
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import YoutubePlayer from '@/components/youtube-player';


import { SignalForm } from '@/components/app/signal-form';
import { SignalResult } from '@/components/app/signal-result';
import { isMarketOpenForAsset } from '@/lib/market-hours';
import { Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { useAppConfig } from '@/firebase/config-provider';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import AffiliateLink from '@/components/app/affiliate-link';
import { generateSignal as generateClientSideSignal } from '@/lib/signal-generator';
import { VipUpgradeModal } from '@/components/app/vip-upgrade-modal';
import { AnalysisAnimation } from '@/components/app/analysis-animation';
import TradingViewWidget from '@/components/app/tradingview-widget';

export type Asset = 
  | 'EUR/USD' | 'EUR/USD (OTC)'
  | 'EUR/JPY' | 'EUR/JPY (OTC)';

export type ExpirationTime = '1m' | '5m';

export type FormData = {
  asset: Asset;
  expirationTime: ExpirationTime;
};

export type OperationStatus = 'pending' | 'active' | 'finished';

export type SignalData = {
  asset: Asset;
  expirationTime: ExpirationTime;
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

export default function AnalisadorPage() {
  const router = useAffiliateRouter();
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const { config, isConfigLoading, affiliateId } = useAppConfig();

  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [appState, setAppState] = useState<AppState>('idle');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [showOTC, setShowOTC] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [signalUsage, setSignalUsage] = useState<SignalUsage>({ timestamps: [] });
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isVipModalOpen, setVipModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { toast } = useToast();
  
  const [isNewsWarningModalOpen, setIsNewsWarningModalOpen] = useState(false);
  const [hasAgreedToNewsWarning, setHasAgreedToNewsWarning] = useState(false);

  const usageStorageKey = user ? `signalUsage_${user.uid}` : null;
  
  const [isChartVisible, setIsChartVisible] = useState(true);


  const vipRequestRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vipRequests', user.uid);
  }, [firestore, user]);

  const { data: vipData, isLoading: isVipLoading } = useDoc(vipRequestRef);

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
    const isPremiumUser = vipData && ['PREMIUM', 'APPROVED'].includes((vipData as any).status);
    
    if (isPremiumUser) {
      setIsPremium(true);
      document.documentElement.classList.add('theme-premium');

      const hasSeenWelcome = localStorage.getItem('hasSeenVipWelcome');
      if (!hasSeenWelcome) {
        setVipModalOpen(true);
      }
    } else {
      setIsPremium(false);
      document.documentElement.classList.remove('theme-premium');
    }
     return () => {
      document.documentElement.classList.remove('theme-premium');
    };
  }, [vipData]);

  // Effect for checking and updating signal usage limit
  useEffect(() => {
    if (isPremium || !usageStorageKey || !config) {
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
      
      setHasReachedLimit(recentTimestamps.length >= config.hourlySignalLimit);

    }
  }, [appState, isPremium, usageStorageKey, config]);


  useEffect(() => {
    const checkMarketStatus = () => {
        setIsMarketOpen(isMarketOpenForAsset(formData.asset));
    };
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 10000); 
    return () => clearInterval(interval);
  }, [formData.asset, config]);

  useEffect(() => {
    const checkAndSetOTC = () => {
      const isEurUsdOpen = isMarketOpenForAsset('EUR/USD');
      const isEurJpyOpen = isMarketOpenForAsset('EUR/JPY');
      if (!isEurUsdOpen && !isEurJpyOpen) {
        setShowOTC(true);
        setFormData(prev => ({ ...prev, asset: 'EUR/JPY (OTC)' }));
      }
    };
    
    checkAndSetOTC();
    const interval = setInterval(checkAndSetOTC, 60000);

    return () => clearInterval(interval);
  }, [config]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (appState === 'result' && signalData) {
      const updateCountdowns = () => {
        setSignalData(prevData => {
          if (!prevData) return null;
          const now = new Date();
          if (prevData.operationStatus === 'pending') {
            const newCountdown = Math.max(0, Math.floor((prevData.targetDate.getTime() - now.getTime()) / 1000));
            

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
              const newOperationCountdown = Math.max(0, Math.floor((operationEndTime - now.getTime()) / 1000));
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

 const proceedWithAnalysis = async () => {
    // Set a flag in session storage so this modal doesn't appear again during this session
    sessionStorage.setItem('hasSeenNewsWarning', 'true');
    setIsNewsWarningModalOpen(false);

    if (!config) {
        toast({
            variant: 'destructive',
            title: 'Erro de Configuração',
            description: 'A configuração da aplicação não foi carregada. Tente novamente.',
        });
        return;
    }
    if (!user || !firestore) {
      toast({
            variant: 'destructive',
            title: 'Erro de Autenticação',
            description: 'Não foi possível identificar o usuário. Tente fazer login novamente.',
        });
        return;
    }
    if (!isPremium && usageStorageKey) {
      const usageString = localStorage.getItem(usageStorageKey) || '{ "timestamps": [] }';
      const currentUsage: SignalUsage = JSON.parse(usageString);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentTimestamps = (currentUsage.timestamps || []).filter(ts => ts > oneHourAgo);

      if (recentTimestamps.length >= config.hourlySignalLimit) {
          setHasReachedLimit(true);
          setVipModalOpen(true);
          return;
      }
    }

    setAppState('loading');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      // Use the client-side signal generator
      const result = generateClientSideSignal({
        asset: formData.asset,
        expirationTime: formData.expirationTime,
        userTier: isPremium ? 'PREMIUM' : 'VIP',
        // Pass the configs from Firebase
        premiumMinWait: config.premiumMinWait,
        premiumMaxWait: config.premiumMaxWait,
        vipMinWait: config.vipMinWait,
        vipMaxWait: config.vipMaxWait,
        invertSignal: config.invertSignal,
      });
      
      const newSignalData: SignalData = {
        ...formData,
        signal: result.signal,
        targetTime: result.targetTime,
        source: result.source,
        targetDate: result.targetDate,
        countdown: null,
        operationCountdown: null,
        operationStatus: 'pending'
      };
      
      setSignalData(newSignalData);

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
        if(newUsage.timestamps.length >= config.hourlySignalLimit){
            setHasReachedLimit(true);
        }
      }

      setAppState('result');
    } catch (error) {
        console.error("Error generating signal:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao Gerar Sinal',
            description: 'Ocorreu um erro. Tente novamente.',
        });
        setAppState('idle');
    }
  };

  const handleAnalyze = () => {
    // Check if the user has already seen the warning in this session
    const hasSeenWarning = sessionStorage.getItem('hasSeenNewsWarning');

    if (hasSeenWarning) {
      // If they have, proceed directly to analysis
      proceedWithAnalysis();
    } else {
      // Otherwise, show the warning modal
      setHasAgreedToNewsWarning(false);
      setIsNewsWarningModalOpen(true);
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setSignalData(null);
  };
  
  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('hasSeenVipWelcome'); // Clear welcome message flag on logout
    router.push('/login');
  }

  // Loading screen while checking user auth
  if (accessState === 'checking' || isVipLoading || isConfigLoading) {
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
            <AlertDialogAction onClick={() => router.push('/login')}>Ir para Login</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return <AnalysisAnimation />;
      case 'result':
        return signalData && <SignalResult data={signalData} onReset={handleReset} />;
      default:
        return (
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
            isPremium={isPremium}
            vipStatus={(vipData as any)?.status}
            isVipModalOpen={isVipModalOpen}
            setVipModalOpen={setVipModalOpen}
            setUpgradeModalOpen={setUpgradeModalOpen}
            rejectedBrokerId={(vipData as any)?.brokerId}
          />
        );
    }
  }


  // Main content for granted access
  return (
    <>
      <div className="fixed inset-0 -z-20 h-full w-full animated-gradient" />
      <div className="fixed inset-0 -z-10 h-full w-full bg-black/30" />

      <div className="flex flex-col min-h-screen">
        <header className="p-4 flex justify-between items-center">
          <div className='flex items-center gap-4'>
            <div className="px-3 py-1 text-sm font-bold bg-primary text-primary-foreground rounded-full shadow-lg">
              {isPremium ? 'PREMIUM' : 'VIP'}
            </div>
          </div>
           <button
            onClick={handleLogout}
            className="text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 px-3 py-1.5 rounded-md font-semibold"
          >
            Sair
          </button>
        </header>

        <main className="flex-grow flex flex-col items-center p-4 pt-8 space-y-6">
          {appState !== 'loading' && (
             <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    ESTRATÉGIA<br />CHINESA
                </h1>
             </div>
          )}
          <div className="w-full max-w-md bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-2xl shadow-primary/10 p-8 min-h-[480px] flex items-center justify-center">
             {renderContent()}
          </div>
          {appState !== 'loading' && (
            <div className="w-full max-w-4xl">
              <div className="flex justify-end items-center gap-2 rounded-t-lg bg-background/50 backdrop-blur-sm border-x border-t border-border/50 p-2">
                <div className="mr-auto flex items-center gap-1 text-sm font-semibold text-muted-foreground px-2">
                  Timeframe: <span className="text-foreground font-bold">{
                      appState === 'result' && signalData ? signalData.expirationTime : formData.expirationTime
                  }</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsChartVisible(!isChartVisible)}>
                    {isChartVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span className="sr-only">{isChartVisible ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}</span>
                </Button>
              </div>
              {isChartVisible && ((appState === 'result' && signalData ? signalData.asset : formData.asset).includes('(OTC)') ? (
                <div className="rounded-b-lg overflow-hidden h-[400px] w-full flex items-center justify-center bg-background/50 backdrop-blur-sm border-x border-b border-border/50">
                    <div className="text-center text-muted-foreground">
                        <p>Gráficos para ativos OTC não estão disponíveis.</p>
                    </div>
                </div>
              ) : (
                <div className="rounded-b-lg overflow-hidden">
                    <TradingViewWidget
                        asset={appState === 'result' && signalData ? signalData.asset : formData.asset}
                        interval={(appState === 'result' && signalData ? signalData.expirationTime : formData.expirationTime).replace('m', '')} />
                </div>
              ))}
            </div>
          )}
        </main>
        
        <footer className="p-4 text-center text-xs text-foreground/30">
          <p>© 2026 ESTRATÉGIA CHINESA. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-2">
            <AffiliateLink href="/legal#terms" className="underline underline-offset-2 hover:text-foreground">Termos de Uso</AffiliateLink>
            <AffiliateLink href="/legal#privacy" className="underline underline-offset-2 hover:text-foreground">Política de Privacidade</AffiliateLink>
            <AffiliateLink href="/legal#cookies" className="underline underline-offset-2 hover:text-foreground">Política de Cookies</AffiliateLink>
          </div>
          <p className="max-w-xl mx-auto text-[0.6rem] mt-2">Aviso Legal: Todas as estratégias e investimentos envolvem risco de perda. Nenhuma informação contida neste produto deve ser interpretada como uma garantia de resultados.</p>
        </footer>
      </div>
      <VipUpgradeModal
        isOpen={isUpgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        user={user}
        firestore={firestore}
        config={config}
      />
      <Dialog open={isNewsWarningModalOpen} onOpenChange={setIsNewsWarningModalOpen}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="text-yellow-400" />
                    Atenção! Mercado Volátil?
                </DialogTitle>
                <DialogDescription>
                    Operar durante notícias de alto impacto (3 touros) pode invalidar os sinais. Veja o vídeo e verifique o calendário antes de prosseguir.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <YoutubePlayer videoId="81HihzJWVwk" />
                <Button asChild variant="outline" className="w-full">
                    <a href="https://br.investing.com/economic-calendar" target="_blank" rel="noopener noreferrer">
                        Abrir Calendário Económico
                    </a>
                </Button>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="news-agreement" checked={hasAgreedToNewsWarning} onCheckedChange={(checked) => setHasAgreedToNewsWarning(checked as boolean)} />
                    <label htmlFor="news-agreement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Eu verifiquei o calendário e entendo os riscos.
                    </label>
                </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button
                    variant="secondary"
                    onClick={() => setIsNewsWarningModalOpen(false)}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={proceedWithAnalysis}
                    disabled={!hasAgreedToNewsWarning}
                >
                    Analisar Mesmo Assim
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    