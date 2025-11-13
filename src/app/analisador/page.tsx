
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


import { SignalForm } from '@/components/app/signal-form';
import { SignalResult } from '@/components/app/signal-result';
import { isMarketOpenForAsset } from '@/lib/market-hours';
import { Loader2 } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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

type AppState = 'idle' | 'loading' | 'result' | 'waiting';
type AccessState = 'checking' | 'granted' | 'denied';

type SignalUsage = {
  timestamps: number[];
}

const HOURLY_SIGNAL_LIMIT = 3;

// Seeded pseudo-random number generator
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Client-side signal generation with market correlation
function generateClientSideSignal(asset: Asset, expirationTime: '1m' | '5m') {
    const now = new Date();
    const expirationTimeLabel = expirationTime === '1m' ? '1 minute' : '5 minutes';
    
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
        targetDate: targetTime,
    };
}


export default function AnalisadorPage() {
  const router = useRouter();
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [appState, setAppState] = useState<AppState>('idle');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [showOTC, setShowOTC] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [signalUsage, setSignalUsage] = useState<SignalUsage>({ timestamps: [] });
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);
  const { toast } = useToast();
  
  const usageStorageKey = user ? `signalUsage_${user.uid}` : null;


  const vipRequestRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vipRequests', user.uid);
  }, [firestore, user]);

  const { data: premiumData, isLoading: isPremiumLoading } = useDoc(vipRequestRef);

  const [formData, setFormData] = useState<FormData>({
    asset: 'EUR/JPY',
    expirationTime: '1m',
  });

  // Effect for checking user session
  useEffect(() => {
    if (isUserLoading) {
        setAccessState('checking');
        return;
    }

    if (!user) {
        setAccessState('denied');
        return;
    }

    const loginTime = localStorage.getItem('loginTimestamp');
    let sessionExpired = false;

    if (loginTime) {
      const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
      if (hoursSinceLogin >= 1) {
        sessionExpired = true;
      }
    } else {
      sessionExpired = true;
    }

    if (sessionExpired) {
        auth.signOut();
        localStorage.removeItem('loginTimestamp');
        setAccessState('denied');
    } else {
        setAccessState('granted');
    }
  }, [user, isUserLoading, auth]);

   useEffect(() => {
    const isApproved = premiumData && (premiumData as any).status === 'APPROVED';
    
    if (isApproved) {
      setIsPremium(true);
      document.documentElement.classList.add('theme-premium');

      const hasSeenWelcome = localStorage.getItem('hasSeenPremiumWelcome');
      if (!hasSeenWelcome) {
        setPremiumModalOpen(true);
      }
    } else {
      setIsPremium(false);
      document.documentElement.classList.remove('theme-premium');
    }
     return () => {
      document.documentElement.classList.remove('theme-premium');
    };
  }, [premiumData]);

  // Effect for checking and updating signal usage limit
  useEffect(() => {
    if (isPremium || !usageStorageKey) {
      setHasReachedLimit(false);
      return;
    }
    const usageString = localStorage.getItem(usageStorageKey);
    if (usageString) {
      const usage: Partial<SignalUsage> = JSON.parse(usageString);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      const recentTimestamps = (usage.timestamps || []).filter(ts => ts > oneHourAgo);
      
      if (usage.timestamps && usage.timestamps.length !== recentTimestamps.length) {
          const newUsage = { timestamps: recentTimestamps };
          localStorage.setItem(usageStorageKey, JSON.stringify(newUsage));
          setSignalUsage(newUsage);
      } else {
          setSignalUsage({ timestamps: recentTimestamps });
      }
      
      setHasReachedLimit(recentTimestamps.length >= HOURLY_SIGNAL_LIMIT);

    }
  }, [appState, isPremium, usageStorageKey]);


  useEffect(() => {
    const checkMarketStatus = () => {
        setIsMarketOpen(isMarketOpenForAsset(formData.asset));
    };
    checkMarketStatus();
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
    
    checkAndSetOTC();
    const interval = setInterval(checkAndSetOTC, 60000);

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
              const operationDuration = prevData.expirationTime === '1m' ? 60 : 300;
              return { ...prevData, countdown: 0, operationStatus: 'active', operationCountdown: operationDuration };
            }
          }
          if (prevData.operationStatus === 'active') {
              const operationDuration = prevData.expirationTime === '1m' ? 60 : 300;
              const operationEndTime = prevData.targetDate.getTime() + (operationDuration * 1000);
              const newOperationCountdown = Math.max(0, Math.floor((operationEndTime - now) / 1000));
              if (newOperationCountdown > 0) {
                  return { ...prevData, operationCountdown: newOperationCountdown };
              } else {
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
    if (!isPremium && usageStorageKey) {
      const usageString = localStorage.getItem(usageStorageKey) || '{ "timestamps": [] }';
      const currentUsage: SignalUsage = JSON.parse(usageString);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentTimestamps = (currentUsage.timestamps || []).filter(ts => ts > oneHourAgo);

      if (recentTimestamps.length >= HOURLY_SIGNAL_LIMIT) {
          setHasReachedLimit(true);
          setPremiumModalOpen(true);
          return;
      }
    }


    setAppState('loading');
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateClientSideSignal(formData.asset, formData.expirationTime);
    
    setSignalData({
      ...formData,
      signal: result.signal,
      targetTime: result.targetTime,
      source: result.source,
      targetDate: result.targetDate,
      countdown: null,
      operationCountdown: null,
      operationStatus: 'pending'
    });
    
    if (!isPremium && usageStorageKey) {
      // Update usage stats
      const usageString = localStorage.getItem(usageStorageKey) || '{ "timestamps": [] }';
      const currentUsage: SignalUsage = JSON.parse(usageString);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentTimestamps = (currentUsage.timestamps || []).filter(ts => ts > oneHourAgo);

      const newTimestamps = [...recentTimestamps, Date.now()];
      const newUsage = { timestamps: newTimestamps };
      localStorage.setItem(usageStorageKey, JSON.stringify(newUsage));
      setSignalUsage(newUsage);
      if(newUsage.timestamps.length >= HOURLY_SIGNAL_LIMIT){
          setHasReachedLimit(true);
      }
    }

    setAppState('result');
  };

  const handleReset = () => {
    setAppState('idle');
    setSignalData(null);
  };
  
  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('hasSeenPremiumWelcome'); // Clear welcome message flag on logout
    router.push('/');
  }

  // Loading screen while checking user auth
  if (accessState === 'checking' || isPremiumLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Verificando acesso...</p>
          </div>
      )
  }

  // Access denied dialog
  if (accessState === 'denied') {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Negado</AlertDialogTitle>
            <AlertDialogDescription>
              Sua sessão expirou ou você não tem permissão para acessar. Por favor, retorne à página inicial para entrar novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.push('/')}>Ir para Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Main content for granted access
  return (
    <>
      <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />

      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex justify-between items-center">
          {isPremium ? (
             <div className="px-3 py-1 text-sm font-bold bg-primary text-primary-foreground rounded-full shadow-lg">
              PREMIUM
            </div>
          ) : (
             <div className="px-3 py-1 text-sm font-bold bg-primary text-primary-foreground rounded-full shadow-lg">
              VIP
            </div>
          )}
           <button
            onClick={handleLogout}
            className="text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 rounded-md font-semibold"
          >
            Sair
          </button>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-6">
          {appState === 'result' && (
             <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    ESTRATÉGIA CHINESA
                </h1>
             </div>
          )}
          <div className="w-full max-w-md bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl shadow-primary/10 p-8">
             {appState !== 'result' ? (
              <SignalForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAnalyze}
                isLoading={appState === 'loading'}
                showOTC={showOTC}
                setShowOTC={setShowOTC}
                isMarketOpen={isMarketOpen}
                hasReachedLimit={hasReachedLimit}
                user={user}
                firestore={useFirebase().firestore}
                isVip={isPremium}
                vipStatus={(premiumData as any)?.status}
                isVipModalOpen={isPremiumModalOpen}
                setVipModalOpen={setPremiumModalOpen}
                rejectedBrokerId={(premiumData as any)?.brokerId}
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
