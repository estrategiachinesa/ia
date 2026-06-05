'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { usePathname } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/dialog'; 
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import YoutubePlayer from '@/components/youtube-player';


import { SignalForm } from '@/components/app/signal-form';
import { SignalResult } from '@/components/app/signal-result';
import { isMarketOpenForAsset } from '@/lib/market-hours';
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, BarChart, LogOut, User, Calendar, ShieldAlert, ExternalLink, Zap, Search, Radio, Crown } from 'lucide-react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { useAppConfig } from '@/firebase/config-provider';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import AffiliateLink from '@/components/app/affiliate-link';
import { generateSignal as generateClientSideSignal, Asset, ExpirationTime } from '@/lib/signal-generator';
import { VipUpgradeModal } from '@/components/app/vip-upgrade-modal';
import { VipStatusModal } from '@/components/app/vip-status-modal';
import { AnalysisAnimation } from '@/components/app/analysis-animation';
import TradingViewWidget from '@/components/app/tradingview-widget';
import { cn } from '@/lib/utils';

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
type AccessState = 'checking' | 'granted' | 'denied' | 'blocked' | 'disabled';

type SignalUsage = {
  timestamps: number[];
}

const PAGE_METADATA: Record<string, { label: string; path: string }> = {
    analisador: { label: 'ANALISADOR', path: '/analisador' },
    catalogador: { label: 'SINAIS', path: '/catalogador' },
    sessaochinesa: { label: 'SESSÃO CHINESA', path: '/sessaochinesa' },
    vip: { label: 'PÁGINA VIP', path: '/vip' },
    descubra: { label: 'VSL', path: '/descubra' },
    register: { label: 'REGISTRO', path: '/register' },
    bb: { label: 'BROKER BREAKER', path: '/bb' },
};

const EXCLUDED_NAV_IDS = ['register', 'vip', 'descubra', 'vsl'];

export default function AnalisadorPage() {
  const router = useAffiliateRouter();
  const pathname = usePathname();
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const { config, isConfigLoading } = useAppConfig();

  const [accessState, setAccessState] = useState<AccessState>('checking');
  const [appState, setAppState] = useState<AppState>('idle');
  const [signalData, setSignalData] = useState<SignalData | null>(null);
  const [showOTC, setShowOTC] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isNewsWarningModalOpen, setIsNewsWarningModalOpen] = useState(false);
  
  const { toast } = useToast();
  const [hasAgreedToNewsWarning, setHasAgreedToNewsWarning] = useState(false);
  const usageStorageKey = user ? `signalUsage_${user.uid}` : null;
  const [isChartVisible, setIsChartVisible] = useState(true);

  const vipRequestRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vipRequests', user.uid);
  }, [firestore, user]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const sessionStatusRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'session', 'status');
  }, [firestore]);

  const { data: vipData, isLoading: isVipLoading } = useDoc(vipRequestRef);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  const { data: sessionStatus } = useDoc(sessionStatusRef);
  const isSessionOnline = (sessionStatus as any)?.isOnline;

  const [formData, setFormData] = useState<FormData>({
    asset: 'EUR/JPY',
    expirationTime: '1m',
  });

  const navigationItems = useMemo(() => {
    if (!config || !config.pagesOrder) {
        return Object.entries(PAGE_METADATA)
            .filter(([id]) => !EXCLUDED_NAV_IDS.includes(id) && config?.pages?.[id] !== false)
            .map(([id, meta]) => ({ id, ...meta }));
    }
    
    return config.pagesOrder
        .filter((id: string) => !EXCLUDED_NAV_IDS.includes(id))
        .map((id: string) => ({
            id,
            ...PAGE_METADATA[id]
        }))
        .filter((p: any) => p && p.label);
  }, [config]);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
        setAccessState('checking');
        return;
    }

    if (!user) {
        setAccessState('denied');
        return;
    }

    if (userProfile?.accountStatus === 'DISABLED') {
      setAccessState('blocked');
      auth.signOut();
      return;
    }

    if (config?.pages?.analisador === false) {
        router.replace('/');
        setAccessState('disabled');
        return;
    }

    const loginTime = localStorage.getItem('loginTimestamp');
    if (!loginTime || (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60) >= 1) {
        auth.signOut();
        setAccessState('denied');
    } else {
        setAccessState('granted');
    }
  }, [user, isUserLoading, isProfileLoading, userProfile, auth, config, router]);

   useEffect(() => {
    const isPremiumUser = vipData && ['PREMIUM', 'APPROVED'].includes((vipData as any).status);
    setIsPremium(!!isPremiumUser);
    
    if (isPremiumUser) {
      document.documentElement.classList.add('theme-premium');
      const hasSeenWelcome = localStorage.getItem('hasSeenVipWelcome');
      if (!hasSeenWelcome) {
        setStatusModalOpen(true);
      }
    } else {
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
      setHasReachedLimit(recentTimestamps.length >= config.hourlySignalLimit);
    }
  }, [appState, isPremium, usageStorageKey, config]);

  useEffect(() => {
    const checkMarketStatus = () => setIsMarketOpen(isMarketOpenForAsset(formData.asset));
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 10000); 
    return () => clearInterval(interval);
  }, [formData.asset]);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (appState === 'result' && signalData) {
      const updateCountdowns = () => {
        setSignalData(prevData => {
          if (!prevData) return null;
          const now = new Date();
          if (prevData.operationStatus === 'pending') {
            const newCountdown = Math.max(0, Math.floor((prevData.targetDate.getTime() - now.getTime()) / 1000));
            if (newCountdown > 0) return { ...prevData, countdown: newCountdown };
            const operationDuration = prevData.expirationTime === '1m' ? 60 : 300;
            return { ...prevData, countdown: 0, operationStatus: 'active', operationCountdown: operationDuration };
          }
          if (prevData.operationStatus === 'active') {
              const operationDuration = prevData.expirationTime === '1m' ? 60 : 300;
              const operationEndTime = prevData.targetDate.getTime() + (operationDuration * 1000);
              const newOpCountdown = Math.max(0, Math.floor((operationEndTime - now.getTime()) / 1000));
              if (newOpCountdown > 0) return { ...prevData, operationCountdown: newOpCountdown };
              return { ...prevData, operationCountdown: 0, operationStatus: 'finished' };
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

    if (!config || !user || !firestore) return;

    if (!isPremium && usageStorageKey) {
      const usageString = localStorage.getItem(usageStorageKey) || '{ "timestamps": [] }';
      const currentUsage: SignalUsage = JSON.parse(usageString);
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentTimestamps = (currentUsage.timestamps || []).filter(ts => ts > oneHourAgo);

      if (recentTimestamps.length >= config.hourlySignalLimit) {
          setHasReachedLimit(true);
          setStatusModalOpen(true);
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
        const newUsage = { timestamps: [...recentTimestamps, Date.now()] };
        localStorage.setItem(usageStorageKey, JSON.stringify(newUsage));
        if(newUsage.timestamps.length >= config.hourlySignalLimit) setHasReachedLimit(true);
      }

      setAppState('result');
    } catch (error) {
        setAppState('idle');
    }
  };

  const handleAnalyze = () => {
    const hasSeenWarning = sessionStorage.getItem('hasSeenNewsWarning');
    if (hasSeenWarning) proceedWithAnalysis();
    else {
      setHasAgreedToNewsWarning(false);
      setIsNewsWarningModalOpen(true);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('loginTimestamp');
    router.push('/login');
  }

  const handleUpgradeClick = () => {
    if (vipData) {
      setStatusModalOpen(true);
    } else {
      setUpgradeModalOpen(true);
    }
  };

  if (accessState === 'checking' || isVipLoading || isConfigLoading || isProfileLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  if (accessState === 'disabled' || accessState === 'blocked') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6">
        <div className={cn("max-w-md w-full bg-card border rounded-3xl p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95", accessState === 'blocked' ? "border-destructive/20" : "border-primary/20")}>
           <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto", accessState === 'blocked' ? "bg-destructive/10" : "bg-primary/10")}>
             {accessState === 'blocked' ? <ShieldAlert className="h-10 w-10 text-destructive" /> : <AlertTriangle className="h-10 w-10 text-primary" />}
           </div>
           <h2 className="text-3xl font-headline font-black uppercase tracking-tight">
                {accessState === 'blocked' ? 'Acesso Bloqueado' : 'Manutenção'}
           </h2>
           <p className="text-muted-foreground leading-relaxed">
                {accessState === 'blocked' ? 'Sua conta foi suspensa.' : 'O Analisador está temporariamente indisponível.'}
           </p>
           <Button variant="outline" onClick={() => router.replace('/')} className="w-full h-12 rounded-xl font-bold">Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  if (accessState === 'denied') {
    return (
      <Dialog open={true}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sessão Expirada</DialogTitle>
            <DialogDescription>Por favor, faça login novamente.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button className="w-full" onClick={() => router.push('/login')}>Ir para Login</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const renderContent = () => {
    switch (appState) {
      case 'loading': return <div className="w-full h-full flex items-center justify-center"><AnalysisAnimation /></div>;
      case 'result': return signalData && <SignalResult data={signalData} onReset={() => setAppState('idle')} />;
      default: return (
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
            firestore={firestore}
            isPremium={isPremium}
            vipStatus={(vipData as any)?.status}
            isVipModalOpen={isStatusModalOpen}
            setVipModalOpen={setStatusModalOpen}
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
        <header className="px-4 py-2 md:py-4 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-6 border-b border-border/10 bg-card/30 backdrop-blur-md sticky top-0 z-50 h-[72px] md:h-auto">
          <div className="flex items-center justify-between w-full md:w-auto relative">
             <div className="flex flex-col flex-1 items-center md:items-start text-center md:text-left">
                <h1 className="text-base md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400 font-headline tracking-tighter leading-tight">
                    ESTRATÉGIA CHINESA
                </h1>
                <p className="text-[0.5rem] md:text-[0.6rem] text-primary/60 font-black tracking-[0.2em] uppercase mt-[-1px]">Intelligence Analyzer</p>
             </div>
             
             <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[0.55rem] font-black text-muted-foreground hover:text-destructive transition-all rounded-full px-2.5 border border-white/5 h-7 uppercase tracking-tighter"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sair
                </Button>
             </div>
          </div>

          <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto no-scrollbar justify-center">
            <nav className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 shadow-2xl shrink-0">
               {navigationItems.map((item) => (
                  <Button key={item.id} asChild variant="ghost" size="sm" className={cn("h-7 md:h-10 px-2 md:px-4 rounded-md md:rounded-xl text-[0.55rem] md:text-[0.65rem] font-black uppercase tracking-widest transition-all", pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}>
                      <AffiliateLink href={item.path} className="flex items-center gap-1 md:gap-2">
                          {item.label}
                          {item.id === 'sessaochinesa' && (
                              <span className={cn(
                                  "w-1 h-1 md:w-2 md:h-2 rounded-full",
                                  isSessionOnline ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"
                              )} />
                          )}
                      </AffiliateLink>
                  </Button>
               ))}
            </nav>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-[0.65rem] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-full px-5 border border-white/5 h-10 uppercase tracking-widest"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
          </div>
        </header>

        <main className="flex-grow container max-w-[1400px] mx-auto p-0 md:p-10">
            <div className="w-full">
                <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 items-stretch justify-center">
                    {/* Secção 1: Analisador */}
                    <div className="w-full lg:w-[450px] flex flex-col h-[calc(100dvh-72px)] lg:h-auto overflow-hidden">
                        <div className="w-full h-full bg-card/50 backdrop-blur-xl border-x-0 md:border border-white/10 rounded-none md:rounded-3xl shadow-2xl p-4 md:p-10 flex flex-col items-center justify-between md:justify-center transition-all duration-500 overflow-hidden relative shine-effect">
                            {renderContent()}
                        </div>
                    </div>

                    {/* Secção 2: Gráfico */}
                     <div className="flex flex-grow relative flex-col min-w-0 self-stretch h-[calc(100dvh-72px)] lg:h-auto mt-0 lg:mt-0">
                        {isOtcAsset ? (
                            <div className="w-full h-full flex items-center justify-center bg-card/40 backdrop-blur-xl border-x-0 md:border border-white/5 rounded-none md:rounded-3xl shadow-2xl p-10">
                                {appState === 'loading' ? (
                                    <AnalysisAnimation />
                                ) : (
                                    <div className="text-center max-w-md">
                                        <div className="bg-muted/10 p-8 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center border border-border/10">
                                            <BarChart className="h-12 w-12 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground">Gráfico Indisponível (OTC)</h3>
                                        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                                            Os ativos de balcão (OTC) são exclusivos de cada corretora. Utilize a plataforma oficial para acompanhamento em tempo real.
                                        </p>
                                        <div className="mt-10 grid grid-cols-2 gap-4">
                                            <Button asChild variant="secondary" className="font-bold h-12 rounded-xl border border-border/50">
                                                <a href={config?.iqOptionUrl || '#'} target="_blank" rel="noopener noreferrer">IQ Option</a>
                                            </Button>
                                            <Button asChild variant="secondary" className="font-bold h-12 rounded-xl border border-border/50">
                                                <a href={config?.exnovaUrl || '#'} target="_blank" rel="noopener noreferrer">Exnova</a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl border-x-0 md:border border-white/5 rounded-none md:rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">
                                <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b border-white/5 bg-white/5 h-[50px] md:h-auto">
                                    <div className="flex items-center gap-3 md:gap-6">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[0.6rem] md:text-[0.7rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Market Live</span>
                                        </div>
                                        <div className="h-4 w-px bg-border/20" />
                                        <div className="flex items-center gap-2 text-[0.65rem] md:text-[0.75rem] font-bold">
                                            <span className="text-muted-foreground">TIME:</span>
                                            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{currentExpirationTime}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-white/10" onClick={() => setIsChartVisible(!isChartVisible)}>
                                        {isChartVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <div className="flex-grow bg-[#0a0a0a] relative overflow-hidden h-[calc(100%-50px)] md:h-full">
                                    {isChartVisible && (
                                        <TradingViewWidget
                                            asset={currentAsset}
                                            interval={currentExpirationTime.replace('m', '')}
                                        />
                                    )}
                                    
                                    {appState === 'loading' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-10 transition-all duration-300">
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
      </div>

      <VipUpgradeModal
        isOpen={isUpgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        user={user}
        firestore={firestore}
        config={config}
      />

      <VipStatusModal
        isOpen={isStatusModalOpen}
        onOpenChange={setStatusModalOpen}
        vipStatus={(vipData as any)?.status}
        rejectedBrokerId={(vipData as any)?.brokerId}
      />

      <Dialog open={isNewsWarningModalOpen} onOpenChange={setIsNewsWarningModalOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-headline">
                    <AlertTriangle className="text-yellow-400 h-8 w-8" /> Alta Volatilidade
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-base leading-relaxed">
                    Eventos de alto impacto podem comprometer as análises estatísticas da IA.
                </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
                <YoutubePlayer videoId="81HihzJWVwk" />
                <Button asChild variant="outline" className="w-full h-12 font-bold rounded-xl border-primary/20 hover:bg-primary/5">
                    <a href="https://br.investing.com/economic-calendar" target="_blank" rel="noopener noreferrer">Calendário Económico</a>
                </Button>
                <div className="flex items-center space-x-4 pt-2 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Checkbox id="news-agreement" checked={hasAgreedToNewsWarning} onCheckedChange={(checked) => setHasAgreedToNewsWarning(checked as boolean)} />
                    <label htmlFor="news-agreement" className="text-xs font-bold leading-tight cursor-pointer uppercase tracking-wide opacity-80">
                        Estou ciente dos riscos operacionais.
                    </label>
                </div>
            </div>
            <DialogFooter className="gap-3 sm:gap-0">
                <Button variant="secondary" onClick={() => setIsNewsWarningModalOpen(false)} className="font-bold h-12 rounded-xl px-8">Cancelar</Button>
                <Button onClick={proceedWithAnalysis} disabled={!hasAgreedToNewsWarning} className="font-bold h-12 rounded-xl px-10 shadow-lg shadow-primary/20">Prosseguir</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
