'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'; 
import { Checkbox } from '@/components/ui/checkbox';
import YoutubePlayer from '@/components/youtube-player';

import { SignalForm } from '@/components/app/signal-form';
import { SignalResult } from '@/components/app/signal-result';
import { isMarketOpenForAsset } from '@/lib/market-hours';
import { Loader2, AlertTriangle, BarChart, LogOut, ShieldAlert, Cpu } from 'lucide-react';
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
import { generateMockNewsEvents, isNewsCurrentlyActive } from '@/lib/news-events';

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
  source: 'Price Action';
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

  const [currentDateInfo, setCurrentDateInfo] = useState('');
  const [currentTimeInfo, setCurrentTimeInfo] = useState('');
  
  const { toast } = useToast();
  const [hasAgreedToNewsWarning, setHasAgreedToNewsWarning] = useState(false);
  const usageStorageKey = user ? `signalUsage_${user.uid}` : null;

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

  const [lastMarketOpen, setLastMarketOpen] = useState(true);

  useEffect(() => {
    const checkMarketStatus = () => {
      const baseAsset = formData.asset.replace(' (OTC)', '') as Asset;
      const open = isMarketOpenForAsset(baseAsset, config?.marketSchedules);
      setIsMarketOpen(open);

      if (!open && lastMarketOpen && !showOTC) {
        setShowOTC(true);
      }
      setLastMarketOpen(open);
    };
    
    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 10000); 
    return () => clearInterval(interval);
  }, [formData.asset, lastMarketOpen, showOTC, config?.marketSchedules]);

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

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDateInfo(now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }));
      setCurrentTimeInfo(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' BRT');
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 10000);
    return () => clearInterval(interval);
  }, []);

 const proceedWithAnalysis = async () => {
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
    // Lógica Inteligente de Notícias
    const newsEvents = generateMockNewsEvents();
    const isNewsActive = isNewsCurrentlyActive(newsEvents, config?.newsWarningDuration || 60);

    if (isNewsActive && !showOTC) {
      setHasAgreedToNewsWarning(false);
      setIsNewsWarningModalOpen(true);
    } else {
      proceedWithAnalysis();
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('loginTimestamp');
    router.push('/login');
  }

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
      case 'loading': return <div className="w-full h-full flex items-center justify-center p-4"><AnalysisAnimation /></div>;
      case 'result': return signalData && <div className="w-full h-full flex items-center justify-center p-4"><SignalResult data={signalData} onReset={() => setAppState('idle')} /></div>;
      default: return (
          <div className="w-full h-full p-2 md:p-4 overflow-hidden">
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
          </div>
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

      <div className="flex flex-col h-[100dvh] overflow-hidden">
        <header className="h-[50px] md:h-[60px] px-4 md:px-8 flex justify-between items-center border-b border-border/10 bg-card/30 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex flex-col">
                <h1 className="text-xs md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400 font-headline tracking-tighter leading-tight">
                    ESTRATÉGIA CHINESA
                </h1>
                <p className="text-[0.4rem] text-primary/60 font-black tracking-[0.2em] uppercase mt-[-1px]">Intelligence Analyzer</p>
             </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[50%] md:max-w-none">
            <nav className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 shrink-0">
               {navigationItems.map((item) => (
                  <Button key={item.id} asChild variant="ghost" size="sm" className={cn("h-6 md:h-9 px-2 md:px-4 rounded-md text-[0.5rem] md:text-[0.65rem] font-black uppercase tracking-widest transition-all", pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary")}>
                      <AffiliateLink href={item.path} className="flex items-center gap-1">
                          {item.label}
                          {item.id === 'sessaochinesa' && (
                              <span className={cn(
                                  "w-1 h-1 rounded-full",
                                  isSessionOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                              )} />
                          )}
                      </AffiliateLink>
                  </Button>
               ))}
            </nav>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-[0.5rem] font-black text-muted-foreground hover:text-destructive transition-all rounded-full px-2 border border-white/5 h-6 uppercase tracking-widest hidden md:flex"
          >
            <LogOut className="h-3 w-3 mr-1" /> Sair
          </Button>
        </header>

        <main className="flex-grow flex flex-col md:flex-row overflow-y-auto md:overflow-hidden snap-y snap-mandatory md:snap-none no-scrollbar">
            {/* Reel 1: Analisador (Full height no mobile, 420px no desktop) */}
            <div className="w-full md:w-[420px] h-[calc(100dvh-50px)] md:h-full shrink-0 snap-start">
                <div className="w-full h-full bg-card/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center overflow-hidden relative glass-panel">
                    {renderContent()}
                </div>
            </div>

            {/* Reel 2: Gráfico/Radar (Snap Scroll no mobile, preenchimento no desktop) */}
            <div className="w-full md:flex-grow h-[calc(100dvh-50px)] md:h-full relative overflow-hidden bg-black shrink-0 snap-start">
                {isOtcAsset ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/20 p-6 relative overflow-hidden">
                        {/* Radar Scan Animation */}
                        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20">
                           <svg width="400" height="400" viewBox="0 0 100 100" className="w-[80%] max-w-[500px]">
                              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                              <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                              <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                              <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.1" className="text-primary" />
                              
                              <circle cx="50" cy="50" r="5" className="text-primary pulse-ring" fill="currentColor" />
                              
                              <g className="radar-sweep">
                                 <path d="M 50 50 L 50 2 A 48 48 0 0 1 98 50 Z" fill="url(#radarGradient)" />
                              </g>

                              <defs>
                                <conicGradient id="radarGradient" cx="50" cy="50">
                                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" className="text-primary" />
                                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
                                </conicGradient>
                              </defs>
                           </svg>
                        </div>

                        <div className="text-center max-w-md relative z-10 animate-in zoom-in-95 duration-700">
                            <Cpu className="h-10 w-10 text-primary/40 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-lg font-black text-foreground uppercase tracking-widest">IA SCANNER: {currentAsset}</h3>
                            <p className="mt-2 text-[0.65rem] text-primary/60 font-black uppercase tracking-[0.3em] leading-tight">Sincronizando com Liquidez de Balcão</p>
                            
                            <div className="mt-8 grid grid-cols-2 gap-3 max-w-[280px] mx-auto">
                                <Button asChild variant="outline" size="sm" className="h-10 text-[0.6rem] font-black border-white/10 hover-glow"><a href={config?.iqOptionOpenUrl || '#'} target="_blank">IQ OPTION</a></Button>
                                <Button asChild variant="outline" size="sm" className="h-10 text-[0.6rem] font-black border-white/10 hover-glow"><a href={config?.exnovaOpenUrl || '#'} target="_blank">EXNOVA</a></Button>
                            </div>

                            <div className="mt-12 hidden md:flex items-center justify-center gap-8 opacity-30">
                               <div className="flex flex-col items-center">
                                  <span className="text-[0.5rem] font-bold">LATENCY</span>
                                  <span className="text-xs font-mono">14ms</span>
                               </div>
                               <div className="flex flex-col items-center">
                                  <span className="text-[0.5rem] font-bold">DATA</span>
                                  <span className="text-xs font-mono">{currentDateInfo || '--/--/--'}</span>
                               </div>
                               <div className="flex flex-col items-center">
                                  <span className="text-[0.5rem] font-bold">HORA</span>
                                  <span className="text-xs font-mono">{currentTimeInfo || '--:--'}</span>
                               </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-black">
                        <div className="h-[25px] shrink-0 px-4 border-b border-white/5 flex items-center justify-between bg-black/50">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[0.45rem] font-black text-muted-foreground uppercase tracking-widest">Market Live Stream</span>
                            </div>
                            <span className="text-[0.45rem] font-black text-primary bg-primary/10 px-1 rounded uppercase">{currentExpirationTime}</span>
                        </div>
                        <div className="flex-grow relative">
                            <TradingViewWidget
                                asset={currentAsset}
                                interval={currentExpirationTime.replace('m', '')}
                            />
                            {appState === 'loading' && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                    <AnalysisAnimation showProgressBar={false} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
      </div>

      <VipUpgradeModal isOpen={isUpgradeModalOpen} onOpenChange={setUpgradeModalOpen} user={user} firestore={firestore} config={config} />
      <VipStatusModal isOpen={isStatusModalOpen} onOpenChange={setStatusModalOpen} vipStatus={(vipData as any)?.status} rejectedBrokerId={(vipData as any)?.brokerId} />

      <Dialog open={isNewsWarningModalOpen} onOpenChange={setIsNewsWarningModalOpen}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-headline">
                <AlertTriangle className="text-yellow-400 h-6 w-6" /> Notícia no Momento
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-sm leading-relaxed text-zinc-300">
                    O mercado está a passar por um evento económico de impacto. As análises estatísticas podem ser invalidadas pela volatilidade extrema.
                  </p>
                </div>
                <YoutubePlayer videoId="81HihzJWVwk" />
                <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setHasAgreedToNewsWarning(!hasAgreedToNewsWarning)}>
                    <Checkbox id="news-agreement" checked={hasAgreedToNewsWarning} onCheckedChange={(checked) => setHasAgreedToNewsWarning(checked as boolean)} />
                    <label htmlFor="news-agreement" className="text-[0.65rem] font-black uppercase leading-tight cursor-pointer opacity-80">Estou ciente dos riscos e desejo operar.</label>
                </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="secondary" onClick={() => setIsNewsWarningModalOpen(false)} className="h-11 rounded-xl">Cancelar</Button>
              <Button 
                onClick={proceedWithAnalysis} 
                disabled={!hasAgreedToNewsWarning} 
                className="h-11 rounded-xl bg-primary text-black font-black uppercase tracking-tighter"
              >
                Analisar mesmo assim
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
