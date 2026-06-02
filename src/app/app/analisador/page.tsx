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
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, BarChart, LogOut, User, Calendar, ExternalLink } from 'lucide-react';
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
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const result = generateClientSideSignal({
        asset: formData.asset,
        expirationTime: formData.expirationTime,
        userTier: isPremium ? 'PREMIUM' : 'VIP',
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
    const hasSeenWarning = sessionStorage.getItem('hasSeenNewsWarning');

    if (hasSeenWarning) {
      proceedWithAnalysis();
    } else {
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
    localStorage.removeItem('hasSeenVipWelcome');
    router.push('/app/login');
  }

  if (accessState === 'checking' || isVipLoading || isConfigLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando...</p>
          </div>
      )
  }

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
            <AlertDialogAction onClick={() => router.push('/app/login')}>Ir para Login</AlertDialogAction>
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

  const currentAsset = appState === 'result' && signalData ? signalData.asset : formData.asset;
  const currentExpirationTime = appState === 'result' && signalData ? signalData.expirationTime : formData.expirationTime;
  const isOtcAsset = currentAsset.includes('(OTC)');


  return (
    <>
      <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/90 to-background" />

      <div className="flex flex-col min-h-screen">
        <header className="p-4 md:px-8 flex justify-between items-center border-b border-border/10 bg-card/30 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400 font-headline tracking-tighter leading-none">
                    ESTRATÉGIA CHINESA
                </h1>
                <p className="text-[0.6rem] text-primary/60 font-bold tracking-[0.2em] uppercase">Intelligence Analyzer</p>
             </div>
             <div className="hidden sm:block h-6 w-px bg-border/20 mx-2" />
             <div className="px-3 py-1 text-[0.7rem] font-bold bg-primary/10 border border-primary/30 text-primary rounded-full shadow-lg shadow-primary/10 flex items-center gap-1.5">
               <User className="h-3 w-3" />
               {isPremium ? 'PREMIUM ACCESS' : 'VIP MEMBER'}
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 lg:p-8 space-y-8">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center">
                    <div className="w-full lg:w-[420px] flex flex-col gap-6">
                        <div className="w-full bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 min-h-[600px] flex flex-col items-center justify-center transition-all duration-500">
                            {renderContent()}
                        </div>

                        <div className="w-full bg-card/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-xl space-y-3">
                            <h3 className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Plataformas Operacionais</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-bold border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs">
                                    <a href={config?.iqOptionUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                                        <ExternalLink className="h-3.5 w-3.5" /> IQ Option
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-bold border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs">
                                    <a href={config?.exnovaUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                                        <ExternalLink className="h-3.5 w-3.5" /> Exnova
                                    </a>
                                </Button>
                            </div>
                        </div>
                        
                        {!isPremium && appState !== 'loading' && (
                             <div className="bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[0.65rem] font-bold text-primary tracking-widest uppercase">Estatuto de Conta</p>
                                    <h4 className="text-sm font-bold text-foreground">Versão VIP Limitada</h4>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    if (vipData) {
                                      setVipModalOpen(true);
                                    } else {
                                      setUpgradeModalOpen(true);
                                    }
                                  }} 
                                  className="h-8 text-[0.7rem] font-bold rounded-full"
                                >
                                  UPGRADE
                                </Button>
                             </div>
                        )}
                    </div>

                     <div className="flex-grow relative flex flex-col min-w-0">
                        {isOtcAsset ? (
                            <div className="w-full h-full flex items-center justify-center bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 min-h-[600px]">
                                {appState === 'loading' ? (
                                    <AnalysisAnimation />
                                ) : (
                                    <div className="text-center max-w-sm">
                                        <div className="bg-muted/10 p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-border/10">
                                            <BarChart className="h-10 w-10 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">Gráfico Indisponível (OTC)</h3>
                                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                                            Os ativos de balcão (OTC) são exclusivos de cada corretora. Utilize a plataforma oficial para acompanhamento.
                                        </p>
                                        <div className="mt-8 grid grid-cols-2 gap-3">
                                            <Button asChild variant="secondary" className="font-bold">
                                                <a href={config?.iqOptionUrl || '#'} target="_blank" rel="noopener noreferrer">
                                                    IQ Option
                                                </a>
                                            </Button>
                                            <Button asChild variant="secondary" className="font-bold">
                                                <a href={config?.exnovaUrl || '#'} target="_blank" rel="noopener noreferrer">
                                                    Exnova
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full min-h-[600px] bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
                                <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/5 bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-widest">Market Live</span>
                                        </div>
                                        <div className="h-4 w-px bg-border/10" />
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            <span className="text-muted-foreground">Timeframe:</span>
                                            <span className="text-primary">{currentExpirationTime}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsChartVisible(!isChartVisible)}>
                                        {isChartVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        <span className="sr-only">{isChartVisible ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}</span>
                                    </Button>
                                </div>

                                <div className="flex-grow bg-[#0a0a0a] relative">
                                    {isChartVisible && (
                                        <TradingViewWidget
                                            asset={currentAsset}
                                            interval={currentExpirationTime.replace('m', '')}
                                        />
                                    )}
                                    
                                    {appState === 'loading' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10 transition-all duration-300">
                                            <AnalysisAnimation showProgressBar={false} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
        
        <footer className="p-6 text-center border-t border-border/5 bg-card/10 backdrop-blur-sm">
          <p className="text-[0.65rem] font-bold text-muted-foreground tracking-[0.1em]">© 2026 ESTRATÉGIA CHINESA • TODOS OS DIREITOS RESERVADOS</p>
          <div className="flex justify-center gap-6 mt-3">
            <AffiliateLink href="/legal#terms" className="text-[0.6rem] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors">Termos de Uso</AffiliateLink>
            <AffiliateLink href="/legal#privacy" className="text-[0.6rem] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors">Privacidade</AffiliateLink>
            <AffiliateLink href="/legal#cookies" className="text-[0.6rem] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors">Cookies</AffiliateLink>
          </div>
          <p className="max-w-3xl mx-auto text-[0.55rem] text-muted-foreground/40 mt-4 leading-relaxed uppercase tracking-tighter">
            Aviso de Risco: O trading de opções binárias envolve riscos elevados e pode resultar na perda total do seu capital. Opere com responsabilidade.
          </p>
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
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-white/10">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-headline">
                    <AlertTriangle className="text-yellow-400 h-6 w-6" />
                    Atenção: Volatilidade do Mercado
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    Operar durante notícias de alto impacto (3 touros) pode invalidar as análises estatísticas.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <YoutubePlayer videoId="81HihzJWVwk" />
                <Button asChild variant="outline" className="w-full h-11 font-bold">
                    <a href="https://br.investing.com/economic-calendar" target="_blank" rel="noopener noreferrer">
                        Ver Calendário Económico
                    </a>
                </Button>
                <div className="flex items-center space-x-3 pt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                    <Checkbox id="news-agreement" checked={hasAgreedToNewsWarning} onCheckedChange={(checked) => setHasAgreedToNewsWarning(checked as boolean)} />
                    <label htmlFor="news-agreement" className="text-xs font-bold leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase tracking-tight">
                        Confirmo que verifiquei o calendário e entendo os riscos operacionais.
                    </label>
                </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
                <Button
                    variant="secondary"
                    onClick={() => setIsNewsWarningModalOpen(false)}
                    className="font-bold"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={proceedWithAnalysis}
                    disabled={!hasAgreedToNewsWarning}
                    className="font-bold"
                >
                    Prosseguir para Análise
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
