
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignalForm } from '@/components/app/signal-form';
import { isMarketOpenForAsset } from '@/lib/market-hours';
import type { Asset, FormData, SignalData } from '@/app/analisador/page';
import { FreeSignalResult } from '@/components/app/free-signal-result';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { OnlineServer } from '@/components/app/OnlineServer';

const DAILY_LIMIT_KEY = 'daily_free_signal_timestamp';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function FreePage() {
  const router = useRouter();
  const [appState, setAppState] = useState<'form' | 'loading' | 'result'>('form');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    asset: 'EUR/JPY',
    expirationTime: '1m',
  });
  const [showOTC, setShowOTC] = useState(false);
  const [isFailureModalOpen, setFailureModalOpen] = useState(false);
  const [isWelcomeModalOpen, setWelcomeModalOpen] = useState(true);
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
  const [isMarketModeActive, setMarketModeActive] = useState(false);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);
  const [nextSignalCountdown, setNextSignalCountdown] = useState('');

  const isMarketOpen = isMarketOpenForAsset(formData.asset);

  // Seeded pseudo-random number generator to have some consistency
  function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  const generateSignalData = (isRealSignal: boolean) => {
    const now = new Date();
    let targetTime: Date;

    if (formData.expirationTime === '1m') {
      const nextMinute = new Date(now);
      nextMinute.setSeconds(0, 0);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);
      targetTime = nextMinute;
    } else {
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

    if (isRealSignal) {
        // Generate a real, random signal for market mode
        const minuteSeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime();
        const assetSpecificSeed = minuteSeed + formData.asset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const assetRandom = seededRandom(assetSpecificSeed);
        const realSignal = assetRandom < 0.5 ? 'CALL 🔼' : 'PUT 🔽';

        return {
            ...formData,
            signal: realSignal,
            targetTime: targetTimeString,
            source: 'Aleatório',
            targetDate: targetTime,
            countdown: null,
            operationCountdown: null,
            operationStatus: 'pending'
        } as SignalData;
    }

    // Return placeholder data for the standard free mode
    return {
        asset: formData.asset,
        expirationTime: formData.expirationTime,
        targetTime: targetTimeString,
    };
  };

  const handleAnalyze = async () => {
    if (isMarketModeActive) {
      const lastSignalTimestamp = localStorage.getItem(DAILY_LIMIT_KEY);
      if (lastSignalTimestamp) {
        const lastSignalDate = new Date(parseInt(lastSignalTimestamp));
        const now = new Date();
        if (lastSignalDate.toDateString() === now.toDateString()) {
          setLimitModalOpen(true);
          return;
        }
      }
    }

    setAppState('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (isMarketModeActive) {
        const realSignal = generateSignalData(true);
        setSignalData(realSignal as SignalData);
        localStorage.setItem(DAILY_LIMIT_KEY, Date.now().toString());
    } else {
        const placeholderSignal = generateSignalData(false);
        setSignalData({ ...placeholderSignal, signal: '?' } as any); // Set fake signalData
        setFailureModalOpen(true);
    }
    setAppState('result');
  };
  
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (appState === 'result' && signalData && signalData.operationStatus === 'finished') {
       // logic for when signal is finished in market mode
    } else if (appState === 'result' && signalData && signalData.operationStatus) {
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
                  return { ...prevData, operationStatus: 'finished' };
              }
          }
          return prevData;
        });
      };
      updateCountdowns(); 
      timer = setInterval(updateCountdowns, 1000);
    }
    return () => clearInterval(timer);
  }, [appState, signalData]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLimitModalOpen) {
      const updateCountdown = () => {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setNextSignalCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      };
      updateCountdown();
      interval = setInterval(updateCountdown, 1000);
    }
    return () => clearInterval(interval);
  }, [isLimitModalOpen]);

  const handleReset = () => {
    setAppState('form');
    setSignalData(null);
  };

  const handleBackToHome = () => {
    router.push('/');
  }

  const isSignalFinished = signalData?.operationStatus === 'finished';

  return (
    <>
      <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />

      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex justify-between items-center">
            <div className="flex-1">
                 <div className="px-3 py-1 text-sm font-bold bg-primary text-primary-foreground rounded-full shadow-lg w-fit">
                    FREE
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                 <OnlineServer isActivated={isMarketModeActive} onToggle={() => setMarketModeActive(!isMarketModeActive)} />
            </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleBackToHome}
              className="text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 rounded-md font-semibold"
            >
              Sair
            </button>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-6">
          {(appState === 'result' && signalData) && (
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
                hasReachedLimit={false}
                user={null}
                firestore={undefined as any}
                isVip={false}
                isVipModalOpen={false}
                setVipModalOpen={() => {}}
                isFreeSignalPage={true}
              />
            ) : (
              signalData && (
                <FreeSignalResult
                    data={signalData}
                    onReset={handleReset}
                    isMarketMode={isMarketModeActive}
                    isSignalFinished={isSignalFinished}
                />
              )
            )}
          </div>
        </main>
        
        <footer className="p-4 text-center text-[0.6rem] text-foreground/30">
          <p>© 2025 Estratégia Chinesa. </p>
          <p>Todos os direitos reservados.</p>
          <p className="max-w-xl mx-auto">Aviso Legal: Todas as estratégias e investimentos envolvem risco de perda. Nenhuma informação contida neste produto deve ser interpretada como uma garantia de resultados.</p>
        </footer>
      </div>

      <Dialog open={isFailureModalOpen} onOpenChange={setFailureModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Falha ao analisar ❌</DialogTitle>
            <DialogDescription>
              Não encontramos seu cadastro no sistema. É preciso se cadastrar e realizar um depósito de qualquer valor para gerar os sinais.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
              <Button asChild>
                <Link href="https://pay.hotmart.com/E101943327K" target="_blank">
                  Adquirir uma Licença
                </Link>
              </Button>
              <Button asChild>
                <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                  Cadastrar agora
                </Link>
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={isWelcomeModalOpen} onOpenChange={setWelcomeModalOpen}>
        <DialogContent>
          <DialogHeader className="text-center items-center">
            <DialogTitle className="text-2xl font-headline">ESTRATÉGIA CHINESA</DialogTitle>
            <h3 className="text-lg font-bold text-primary">Atenção!</h3>
            <DialogDescription className="text-base">
              Para gerar os sinais da Estratégia Chinesa, você deve se cadastrar na plataforma e realizar um depósito de qualquer valor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
              <Button asChild onClick={() => setWelcomeModalOpen(false)}>
                <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                  Abrir a Corretora
                </Link>
              </Button>
              <Button variant="outline" onClick={() => { setWelcomeModalOpen(false); setPlayerModalOpen(true);}}>
                Instruções
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPlayerModalOpen} onOpenChange={setPlayerModalOpen}>
        <DialogContent className="max-w-3xl aspect-video p-0 border-0">
           <iframe
              className="w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/PPak8eupMi8?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
        </DialogContent>
      </Dialog>

      <Dialog open={isLimitModalOpen} onOpenChange={setLimitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite diário atingido</DialogTitle>
            <DialogDescription>
              Você já recebeu o sinal gratuito de hoje. Volte amanhã ou ative o Indicador para ter acesso ilimitado.
            </DialogDescription>
          </DialogHeader>
            <div className="text-center text-muted-foreground text-sm">
                Próximo sinal em: <span className="font-bold text-foreground">{nextSignalCountdown}</span>
            </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setLimitModalOpen(false)}>
                Fechar
            </Button>
            <Button asChild>
                <Link href="https://pay.hotmart.com/E101943327K" target="_blank">
                    Quero o Indicador
                </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
