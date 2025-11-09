'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


import { SignalForm } from '@/components/app/signal-form';
import { SignalResult } from '@/components/app/signal-result';
import { useToast } from '@/hooks/use-toast';
import { isMarketOpenForAsset } from '@/lib/market-hours';
import { useUser, useAuth } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';

export type Asset = 
  | 'EUR/USD' | 'EUR/USD (OTC)'
  | 'EUR/JPY' | 'EUR/JPY (OTC)';

export type FormData = {
  asset: Asset;
  expirationTime: '1m' | '5m';
};

export type OperationStatus = 'pending' | 'active' | 'finished';

export type SignalData = {
  asset: Asset;
  expirationTime: '1m' | '5m';
  signal: 'CALL 🔼' | 'PUT 🔽';
  targetTime: string;
  source: 'Aleatório';
  targetDate: Date;
  countdown: number | null;
  operationCountdown: number | null;
  operationStatus: OperationStatus;
};

type AppState = 'idle' | 'loading' | 'result';

// Seeded pseudo-random number generator
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Client-side signal generation with market correlation
function generateClientSideSignal(asset: Asset, expirationTimeLabel: '1 minute' | '5 minutes') {
    const now = new Date();
    
    const minuteSeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime();

    const marketTrendSeed = minuteSeed;
    const marketTrendRandom = seededRandom(marketTrendSeed);
    const generalMarketSignal = marketTrendRandom < 0.5 ? 'CALL 🔼' : 'PUT 🔽';

    const assetSpecificSeed = minuteSeed + asset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const assetRandom = seededRandom(assetSpecificSeed);
    const independentSignal = assetRandom < 0.5 ? 'CALL 🔼' : 'PUT 🔽';

    const correlationSeed = minuteSeed + 1;
    const correlationRandom = seededRandom(correlationSeed);
    
    let finalSignal: 'CALL 🔼' | 'PUT 🔽';
    const correlationChance = 0.3; 

    if (correlationRandom < correlationChance) {
        finalSignal = generalMarketSignal;
    } else {
        finalSignal = independentSignal;
    }

    let targetTime: Date;
    if (expirationTimeLabel === '1 minute') {
        const nextMinute = new Date(now);
        nextMinute.setSeconds(0, 0);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);
        targetTime = nextMinute;
    } else { // 5 minutes
        const minutes = now.getMinutes();
        const remainder = minutes % 5;
        const minutesToAdd = 5 - remainder;
        targetTime = new Date(now.getTime());
        targetTime.setMinutes(minutes + minutesToAdd, 0, 0);
        if (targetTime.getTime() < now.getTime()) {
            targetTime.setMinutes(targetTime.getMinutes() + 5);
        }
    }

    const targetTimeString = targetTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

    return {
        signal: finalSignal,
        targetTime: targetTimeString,
        source: 'Aleatório' as const,
    };
}


export default function AnalisadorPage() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>('idle');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const { toast } = useToast();
  const [showOTC, setShowOTC] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();


  const [formData, setFormData] = useState<FormData>({
    asset: 'EUR/JPY',
    expirationTime: '1m',
  });
  
   useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);


  useEffect(() => {
    // Check market status whenever the selected asset changes
    const checkMarketStatus = () => {
        setIsMarketOpen(isMarketOpenForAsset(formData.asset));
    };
    checkMarketStatus();
    // Re-check every 10 seconds
    const interval = setInterval(checkMarketStatus, 10000); 
    return () => clearInterval(interval);
  }, [formData.asset]);

  useEffect(() => {
    const checkAndSetOTC = () => {
      const isEurUsdOpen = isMarketOpenForAsset('EUR/USD');
      const isEurJpyOpen = isMarketOpenForAsset('EUR/JPY');
      if (!isEurUsdOpen && !isEurJpyOpen) {
        setShowOTC(true);
        setFormData(prev => ({ ...prev, asset: 'EUR/USD (OTC)' }));
      }
    };
    
    checkAndSetOTC(); // Check on mount
    const interval = setInterval(checkAndSetOTC, 60000); // Re-check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (appState === 'result' && signalData) {
      const updateCountdowns = () => {
        setSignalData(prevData => {
          if (!prevData) return null;

          const now = Date.now();
          
          if (prevData.operationStatus === 'pending') {
            const newCountdown = Math.max(0, Math.floor((prevData.targetDate.getTime() - now) / 1000));
            
            if (newCountdown > 0) {
              return { ...prevData, countdown: newCountdown };
            } else {
              // Transition to active
              const operationDuration = prevData.expirationTime === '1m' ? 60 : 300;
              return {
                ...prevData,
                countdown: 0,
                operationStatus: 'active',
                operationCountdown: operationDuration
              };
            }
          }

          if (prevData.operationStatus === 'active') {
              const operationDuration = prevData.expirationTime === '1m' ? 60 : 300;
              const operationEndTime = prevData.targetDate.getTime() + (operationDuration * 1000);
              const newOperationCountdown = Math.max(0, Math.floor((operationEndTime - now) / 1000));

              if (newOperationCountdown > 0) {
                  return { ...prevData, operationCountdown: newOperationCountdown };
              } else {
                  // Transition to finished
                  return { ...prevData, operationCountdown: 0, operationStatus: 'finished' };
              }
          }

          return prevData;
        });
      };
      
      updateCountdowns(); 
      
      timer = setInterval(updateCountdowns, 1000);

    }
    return () => clearInterval(timer);
  }, [appState, signalData?.operationStatus]);
  
 const handleAnalyze = async () => {
    setAppState('loading');
    const expirationTimeLabel = formData.expirationTime === '1m' ? '1 minute' : '5 minutes';
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateClientSideSignal(formData.asset, expirationTimeLabel);
    
    const [hours, minutes] = result.targetTime.split(':');
    let targetDate = new Date();
    targetDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // Handle case where target time is in the past (e.g., just after midnight)
    if (targetDate.getTime() < Date.now()) {
        targetDate.setDate(targetDate.getDate() + 1);
    }
    
    setSignalData({
      ...formData,
      signal: result.signal,
      targetTime: result.targetTime,
      source: result.source,
      targetDate: targetDate,
      countdown: null,
      operationCountdown: null,
      operationStatus: 'pending'
    });

    setAppState('result');
  };

  const handleReset = () => {
    setAppState('idle');
    setSignalData(null);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    // The useEffect hook will redirect to '/'
  }

  if (isUserLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-background"></div>
      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex justify-end">
          <button onClick={handleLogout} className="text-sm text-foreground/70 hover:text-foreground">
            Sair
          </button>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-6">
          {appState === 'result' && (
             <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    ESTRATÉGIA<br />CHINESA
                </h1>
             </div>
          )}
          <div className="w-full max-w-md bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-8">
             {appState !== 'result' ? (
              <SignalForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAnalyze}
                isLoading={appState === 'loading'}
                showOTC={showOTC}
                setShowOTC={setShowOTC}
                isMarketOpen={isMarketOpen}
              />
             ) : (
              signalData && <SignalResult data={signalData} onReset={handleReset} />
             )}
          </div>
        </main>
        
        <footer className="p-4 text-center text-[0.6rem] text-foreground/30">
          <p>© 2025 Estratégia Chinesa. </p>
          <p>Todos os direitos reservados.</p>
          <p className="max-w-xl mx-auto">Aviso Legal: Todas as estratégias e investimentos envolvem risco de perda. Nenhuma informação contida neste produto deve ser interpretada como uma garantia de resultados.</p>
        </footer>
      </div>
    </>
  );
}
