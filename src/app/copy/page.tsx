
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  TrendingUp, 
  ShieldCheck, 
  CircleDollarSign, 
  Zap, 
  UserCheck, 
  ArrowRight, 
  Activity,
  AlertTriangle,
  History,
  CheckCircle2,
  RefreshCcw,
  Cpu,
  ArrowUpCircle,
  ArrowDownCircle,
  Trophy,
  Instagram,
  Send,
  Mail,
  User as UserIcon,
  ShieldAlert,
  Clock,
  Lock,
  ChevronRight,
  Radio,
  ExternalLink,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useAppConfig } from '@/firebase/config-provider';
import { useRouter } from 'next/navigation';
import { CurrencyFlags } from '@/components/app/currency-flags';
import Image from 'next/image';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, setDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

type ConnectionStep = 'STEP_1_REGISTER' | 'STEP_2_FORM' | 'STEP_3_PENDING' | 'STEP_4_AWAITING_DEPOSIT' | 'STEP_5_SUCCESS' | 'STEP_6_REJECTED' | 'STEP_7_VERIFYING_DEPOSIT';

export default function CopyPage() {
  const { config, isConfigLoading } = useAppConfig();
  const { firestore } = useFirebase();
  const router = useRouter();
  
  const [formData, setFormData] = useState({ email: '', brokerId: '' });
  const [nameData, setNameData] = useState('');
  const [step, setStep] = useState<ConnectionStep>('STEP_1_REGISTER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);

  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !savedRequestId) return null;
    return collection(firestore, 'copyRequests');
  }, [firestore, savedRequestId]);

  const { data: myRequests } = useCollection(requestsQuery);
  const myRequest = useMemo(() => myRequests?.find(r => r.id === savedRequestId), [myRequests, savedRequestId]);

  useEffect(() => {
    const storedId = localStorage.getItem('copy_requestId');
    if (storedId) setSavedRequestId(storedId);
  }, []);

  useEffect(() => {
    if (myRequest) {
        if (myRequest.status === 'PENDING') setStep('STEP_3_PENDING');
        else if (myRequest.status === 'AWAITING_DEPOSIT') setStep('STEP_4_AWAITING_DEPOSIT');
        else if (myRequest.status === 'DEPOSIT_PENDING') setStep('STEP_7_VERIFYING_DEPOSIT');
        else if (myRequest.status === 'APPROVED') setStep('STEP_5_SUCCESS');
        else if (myRequest.status === 'REJECTED') setStep('STEP_6_REJECTED');
    }
  }, [myRequest]);

  useEffect(() => {
    if (!isConfigLoading && config?.pages?.copy === false) {
      router.replace('/');
    }
  }, [config, isConfigLoading, router]);

  const lastTradeResult = useMemo(() => {
    const results = config?.copyResults || [];
    if (results.length === 0) return 0;
    return results[0].netChange;
  }, [config?.copyResults]);

  const masterStats = {
    traderName: config?.copyTraderName || "Trader Chines",
    profilePic: config?.copyProfilePicUrl || "https://picsum.photos/seed/trader/200/200",
    instagram: config?.copyInstagramUrl || "#",
    tiktok: config?.copyTikTokUrl || "#",
    telegram: config?.copyTelegramUrl || "#",
    balance: (config?.copyMasterBalance ?? 245892.10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    initialBalance: (config?.copyInitialBalance ?? 240000.00).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    profitToday: (lastTradeResult >= 0 ? '+ ' : '') + (lastTradeResult).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    winRate: config?.copyMasterWinRate || "0%",
    results: config?.copyResults || [],
    isActive: config?.copyIsActive ?? true
  };

  const scoreboard = useMemo(() => {
    const results = config?.copyResults || [];
    const wins = results.filter((r: any) => r.result === 'WIN').length;
    const losses = results.filter((r: any) => r.result === 'LOSS').length;
    return { wins, losses };
  }, [config?.copyResults]);

  const affiliateLink = config?.copyAffiliateUrl || "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=copy";

  const handleRequestVerification = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || !formData.email.includes('.com')) {
        alert("Insira um e-mail válido.");
        return;
    }

    if (formData.brokerId.length < 5 || !firestore) return;
    
    setIsSubmitting(true);
    try {
        const requestId = `req_${Date.now()}`;
        await setDoc(doc(firestore, 'copyRequests', requestId), {
            ...formData,
            status: 'PENDING',
            submittedAt: serverTimestamp()
        });
        localStorage.setItem('copy_requestId', requestId);
        setSavedRequestId(requestId);
        setStep('STEP_3_PENDING');
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  const handleUpdateProfile = async () => {
      if (!nameData || !savedRequestId || !firestore) return;
      setIsUpdatingName(true);
      try {
          await updateDoc(doc(firestore, 'copyRequests', savedRequestId), { name: nameData });
      } catch (e) { console.error(e); } finally { setIsUpdatingName(false); }
  };

  const handleConfirmDeposit = async () => {
      if (!savedRequestId || !firestore) return;
      setIsConfirmingDeposit(true);
      try {
          await updateDoc(doc(firestore, 'copyRequests', savedRequestId), { status: 'DEPOSIT_PENDING' });
          setStep('STEP_7_VERIFYING_DEPOSIT');
      } catch (e) { console.error(e); } finally { setIsConfirmingDeposit(false); }
  };

  const formatFullDate = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return '--/-- --:--';
    try {
        const [y, m, d] = dateStr.split('-');
        const day = d.padStart(2, '0');
        const month = m.padStart(2, '0');
        return `${day}/${month} ${timeStr}`;
    } catch (e) {
        return `${timeStr}`;
    }
  };

  if (isConfigLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[100dvh] bg-[#050505] text-foreground font-body overflow-hidden flex flex-col relative">
      {/* Background Depth & Noise */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_#0e0e0e_0%,_#050505_100%)]" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-[0.03]" />
      
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-2xl shrink-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <Logo size={40} className="drop-shadow-[0_0_15px_rgba(255,0,0,0.2)]" />
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                <span className={cn("w-2 h-2 rounded-full", masterStats.isActive ? "bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.8)]" : "bg-red-500")} />
                <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/80">{masterStats.isActive ? "Cluster Online" : "Offline"}</span>
             </div>
        </div>
      </header>

      {/* Main Container - Optimized for One Screen on Desktop */}
      <main className="flex-grow overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar lg:overflow-hidden lg:snap-none lg:grid lg:grid-cols-12 lg:gap-6 lg:p-6 lg:max-w-[1600px] lg:mx-auto w-full">
        
        {/* SLIDE 1: MASTER DASHBOARD */}
        <div className="snap-start min-h-[calc(100dvh-80px)] lg:min-h-0 flex flex-col p-4 lg:p-0 lg:col-span-3 lg:h-full">
          <Card className="bg-card/40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl rounded-[2.5rem] overflow-hidden flex flex-col h-full">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/50 to-primary w-full shadow-[0_0_20px_rgba(255,0,0,0.3)]" />
            <div className="flex-grow overflow-y-auto no-scrollbar p-6 lg:p-8 space-y-8">
                <div className="flex flex-col items-center text-center space-y-5">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-2xl opacity-20 animate-pulse" />
                        <div className="relative h-32 w-32 md:h-36 md:w-36 rounded-full border-4 border-white/10 overflow-hidden bg-black shadow-2xl transition-transform hover:scale-105 duration-500">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover" unoptimized />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-primary/70">Portfolio Master</h3>
                        <p className="text-2xl lg:text-3xl font-headline font-black text-white uppercase tracking-tighter drop-shadow-lg">{masterStats.traderName}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {[
                            { icon: Instagram, href: masterStats.instagram },
                            { icon: () => (
                                <svg fill="currentColor" viewBox="0 0 448 512" className="h-5 w-5">
                                    <path d="M448 209.91a210.06 210.06 0 0 1 -122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                                </svg>
                            ), href: masterStats.tiktok },
                            { icon: Send, href: masterStats.telegram }
                        ].map((social, i) => (
                            <a key={i} href={social.href} target="_blank" className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 group shadow-xl">
                                <social.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="space-y-3.5">
                    <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 flex justify-between items-center transition-colors hover:bg-white/[0.04]">
                        <p className="text-[0.7rem] font-black text-white/50 uppercase tracking-[0.2em]">Saldo Inicial</p>
                        <p className="text-base font-black font-mono text-white/70">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-6 bg-white/[0.05] rounded-2xl border border-white/10 flex justify-between items-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[0.7rem] font-black text-white/60 uppercase tracking-[0.2em] relative z-10">Saldo Atual</p>
                        <p className="text-2xl font-black font-mono text-white tracking-tighter relative z-10">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-6 rounded-2xl border flex justify-between items-center shadow-lg transition-all",
                        lastTradeResult < 0 ? "bg-red-500/5 border-red-500/10" : (lastTradeResult === 0 ? "bg-white/5 border-white/10" : "bg-green-500/5 border-green-500/10")
                    )}>
                        <p className={cn("text-[0.7rem] font-black uppercase tracking-[0.2em]", lastTradeResult < 0 ? "text-red-500/80" : (lastTradeResult === 0 ? "text-white/40" : "text-green-500/80"))}>Net Profit Hoje</p>
                        <p className={cn("text-2xl font-black font-mono tracking-tighter", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-600" : "text-green-500"))}>{masterStats.profitToday}</p>
                    </div>
                </div>

                <div className="p-6 bg-black/60 rounded-3xl border border-white/10 space-y-5 mt-auto shadow-inner">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Trophy className="h-4 w-4 text-primary" />
                             <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/50">Placar Mensal</span>
                         </div>
                         <div className="flex gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                            <div className="w-1 h-1 rounded-full bg-primary/40" />
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col items-center bg-white/5 p-4 rounded-xl border border-white/5 shadow-md">
                            <span className="text-3xl font-black text-green-500">{scoreboard.wins}</span>
                            <span className="text-[0.6rem] font-bold text-white/40 uppercase tracking-widest mt-1">Wins</span>
                         </div>
                         <div className="flex flex-col items-center bg-white/5 p-4 rounded-xl border border-white/5 shadow-md">
                            <span className="text-3xl font-black text-red-500">{scoreboard.losses}</span>
                            <span className="text-[0.6rem] font-bold text-white/40 uppercase tracking-widest mt-1">Losses</span>
                         </div>
                    </div>
                    <div className="pt-2">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[0.65rem] font-black uppercase text-white/50 tracking-[0.1em]">Assertividade IA</span>
                            <span className="text-sm font-black text-green-500 font-mono drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">{masterStats.winRate}</span>
                        </div>
                        <Progress value={parseFloat(masterStats.winRate)} className="h-2 bg-white/5 rounded-full" indicatorClassName="bg-gradient-to-r from-green-600 to-green-400" />
                    </div>
                </div>
            </div>
          </Card>
        </div>

        {/* SLIDE 2: OPERATIONS HISTORY */}
        <div className="snap-start min-h-[calc(100dvh-80px)] lg:min-h-0 flex flex-col p-4 lg:p-0 lg:col-span-4 lg:h-full">
          <Card className="bg-card/30 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-2xl backdrop-blur-xl">
             <CardHeader className="p-6 lg:p-8 pb-5 shrink-0 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-[0.75rem] font-black uppercase tracking-[0.4em] text-white/60 flex items-center gap-3">
                    <div className="relative">
                        <Activity className="h-5 w-5 text-primary/70" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                    </div>
                    Fluxo HFT Live
                </CardTitle>
                <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <span className="text-[0.55rem] font-black text-primary uppercase tracking-[0.2em]">Real-Time</span>
                </div>
             </CardHeader>
             <CardContent className="p-4 lg:p-6 space-y-2.5 overflow-y-auto no-scrollbar flex-grow bg-black/40">
                {masterStats.results.length > 0 ? masterStats.results.map((trade: any) => (
                    <div key={trade.id} className="grid grid-cols-12 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 group transition-all duration-500 hover:bg-white/[0.06] hover:border-primary/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                        <div className="col-span-3">
                            <span className="text-[0.55rem] font-black font-mono text-white/30 block mb-0.5 tracking-tighter uppercase">Timestamp</span>
                            <span className="text-[0.75rem] font-black text-white/80 whitespace-nowrap font-mono">{formatFullDate(trade.date, trade.time)}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-3 pl-2">
                            <div className="shrink-0 scale-90 drop-shadow-md"><CurrencyFlags asset={trade.asset} /></div>
                            <span className="text-[0.8rem] font-black text-white uppercase truncate tracking-tight">{trade.asset.replace(' (OTC)', '')}</span>
                        </div>
                        <div className="col-span-5 flex flex-col items-end text-right">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[0.65rem] font-black uppercase tracking-[0.2em]",
                                    trade.result === 'WIN' ? "text-green-500" : (trade.result === 'LOSS' ? "text-red-500" : "text-zinc-500")
                                )}>
                                    {trade.result}
                                </span>
                                <div className={cn("w-2 h-2 rounded-full shadow-lg", trade.result === 'WIN' ? "bg-green-500 shadow-green-500/40" : (trade.result === 'LOSS' ? "bg-red-500 shadow-red-500/40" : "bg-zinc-500"))} />
                             </div>
                             <span className={cn(
                                "text-base font-black font-mono leading-none mt-1 tracking-tighter",
                                trade.netChange > 0 ? "text-green-500" : (trade.netChange < 0 ? "text-red-500" : "text-white/30")
                             )}>
                                {trade.netChange > 0 ? '+' : ''}{trade.netChange.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </span>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
                         <Loader2 className="h-10 w-10 mb-6 animate-spin text-primary" />
                         <p className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-white">Sincronizando com Terminal...</p>
                    </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* SLIDE 3: SYNC CONSOLE */}
        <div className="snap-start min-h-[calc(100dvh-80px)] lg:min-h-0 flex flex-col p-4 lg:p-0 lg:col-span-5 lg:h-full">
          <Card className="bg-card/40 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-[50px] rounded-[3rem] p-8 lg:p-14 h-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700">
            
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent shadow-[0_0_25px_rgba(255,0,0,0.4)]" />

            {step === 'STEP_1_REGISTER' && (
                <div className="max-w-md w-full text-center space-y-10 lg:space-y-14 z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="space-y-8">
                        <div className="flex justify-center scale-125 md:scale-150 drop-shadow-[0_0_25px_rgba(255,0,0,0.3)]">
                            <Logo size={140} showText={false} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter text-white drop-shadow-2xl">Conexão Copy</h2>
                            <p className="text-white/60 text-base md:text-xl leading-relaxed font-medium px-4 max-w-sm mx-auto">
                                Para espelhar as operações do Trader, sua conta deve obrigatoriamente estar vinculada ao nosso cluster de alta frequência.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-5 pt-4 px-2">
                        <Button asChild className="w-full h-20 md:h-28 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-xl md:text-3xl rounded-[2.5rem] hover:scale-[1.03] transition-all shadow-[0_20px_50px_rgba(255,0,0,0.3)] group relative overflow-hidden border border-white/10">
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                                <ArrowRight className="mr-4 h-6 w-6 md:h-10 md:w-10" /> VINCULAR MINHA CONTA
                            </a>
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-14 md:h-16 border border-white/5 bg-white/[0.03] text-[0.7rem] md:text-[0.85rem] font-black uppercase tracking-[0.2em] text-white/50 rounded-2xl hover:bg-white/10 hover:text-white transition-all">
                            JÁ POSSUO CONTA (SINCRONIZAR)
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_2_FORM' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="space-y-3">
                        <div className="inline-flex p-4 bg-primary/15 rounded-[2rem] border border-primary/30 mb-2 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                             <Zap className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-headline font-black uppercase text-white tracking-tighter">Protocolo</h2>
                        <p className="text-[0.7rem] text-white/50 uppercase font-black tracking-[0.4em]">Identificação de Terminal</p>
                    </div>
                    <div className="space-y-5 text-left">
                        <div className="space-y-2">
                            <Label className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/40 ml-3">Canal de E-mail</Label>
                            <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="h-16 bg-black/60 border-white/10 rounded-2xl text-lg px-6 focus:ring-primary/30 focus:border-primary/50 shadow-inner" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/40 ml-3">Terminal ID (Exnova)</Label>
                            <Input value={formData.brokerId} onChange={e => setFormData({...formData, brokerId: e.target.value.replace(/\D/g, '')})} placeholder="ID do usuário" className="h-16 bg-black/60 border-white/10 rounded-2xl font-mono text-xl tracking-[0.3em] px-6 focus:ring-primary/30 focus:border-primary/50 shadow-inner" />
                        </div>
                        <div className="pt-6">
                            <Button onClick={handleRequestVerification} disabled={!formData.email || formData.brokerId.length < 5 || isSubmitting} className="w-full h-20 bg-primary text-primary-foreground font-black uppercase text-xl rounded-2xl shadow-[0_15px_40px_rgba(255,0,0,0.25)] hover:scale-[1.02] active:scale-95 transition-all">
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'SOLICITAR SINCRONIZAÇÃO'}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_1_REGISTER')} className="w-full h-12 text-[0.65rem] font-black uppercase tracking-[0.3em] text-white/20 mt-3 hover:text-white/50 transition-colors">Cancelar Operação</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Steps Pending, Awaiting Deposit, etc, remain largely similar but with updated typography and depth */}
            {step === 'STEP_3_PENDING' && (
                <div className="max-w-sm w-full text-center space-y-12 z-10 animate-in zoom-in-95 duration-500">
                    <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-[6px] border-primary/5 rounded-full" />
                        <div className="absolute inset-0 border-[6px] border-primary rounded-full border-t-transparent animate-spin shadow-[0_0_30px_rgba(255,0,0,0.2)]" style={{ animationDuration: '0.8s' }} />
                        <Radio className="h-14 w-14 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-8">
                        <h3 className="text-4xl font-black uppercase text-white tracking-tighter">Validando ID</h3>
                        <p className="text-lg text-white/50 leading-relaxed font-medium px-6">O cluster está processando o ID <span className="text-primary font-mono bg-primary/5 px-2 py-1 rounded-md">{myRequest?.brokerId || formData.brokerId}</span>. A liberação ocorrerá após confirmação da rede.</p>
                        <div className="p-5 bg-primary/10 rounded-2xl border border-primary/30 mx-4 shadow-xl">
                            <p className="text-[0.7rem] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Status: AGUARDANDO AUTORIZAÇÃO</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_4_AWAITING_DEPOSIT' && (
                <div className="max-w-md w-full z-10 animate-in fade-in duration-700">
                    {!myRequest?.name ? (
                        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] text-center space-y-10 shadow-2xl backdrop-blur-xl">
                            <div className="w-20 h-20 bg-green-500/15 rounded-3xl flex items-center justify-center mx-auto border border-green-500/30 shadow-[0_0_25px_rgba(34,197,94,0.2)]"><UserCheck className="h-10 w-10 text-green-500" /></div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black uppercase text-white tracking-tighter">ID Vinculado</h2>
                                <p className="text-primary text-[0.7rem] font-black uppercase tracking-[0.4em]">Complete seu perfil técnico</p>
                            </div>
                            <div className="space-y-5 text-left">
                                <Input value={nameData} onChange={e => setNameData(e.target.value)} placeholder="Seu nome completo" className="h-16 bg-black/50 border-white/10 rounded-2xl text-xl font-bold px-8 shadow-inner" />
                                <Button onClick={handleUpdateProfile} disabled={!nameData || isUpdatingName} className="w-full h-20 bg-white text-black font-black uppercase text-lg rounded-2xl shadow-[0_15px_40px_rgba(255,255,255,0.1)] hover:bg-zinc-200 transition-all">
                                    {isUpdatingName ? <Loader2 className="h-6 w-6 animate-spin" /> : 'GERAR CERTIFICADO'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[3rem] text-center space-y-10 shadow-2xl backdrop-blur-xl">
                            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto border border-primary/40 shadow-[0_0_25px_rgba(255,0,0,0.2)]"><ShieldCheck className="h-10 w-10 text-primary" /></div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black uppercase text-white tracking-tighter">Margem de Segurança</h2>
                                <p className="text-primary text-[0.7rem] font-black uppercase tracking-[0.4em]">Liquidez Requerida</p>
                            </div>
                            <div className="p-6 bg-black/60 rounded-2xl border border-white/5 text-left shadow-inner">
                                <p className="text-sm text-white/60 leading-relaxed font-medium">O algoritmo exige uma **Margem de Segurança** de <span className="text-white font-bold">R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR')}</span> para espelhar as entradas de alta frequência do Master Trader.</p>
                            </div>
                            <div className="space-y-5">
                                <Button asChild className="w-full h-20 bg-primary text-primary-foreground font-black uppercase text-xl rounded-2xl shadow-[0_15px_40px_rgba(255,0,0,0.3)] animate-pulse hover:scale-[1.02] transition-all">
                                    <a href={affiliateLink} target="_blank" rel="noopener noreferrer">ATIVAR MARGEM AGORA</a>
                                </Button>
                                <Button variant="outline" onClick={handleConfirmDeposit} disabled={isConfirmingDeposit} className="w-full h-14 border-white/20 bg-white/[0.03] text-[0.75rem] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 hover:text-white transition-all">
                                    {isConfirmingDeposit ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="mr-3 h-5 w-5 text-green-500" />} JÁ REALIZEI O APORTE
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'STEP_7_VERIFYING_DEPOSIT' && (
                <div className="max-w-sm w-full text-center space-y-12 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-cyan-500/15 rounded-[2.5rem] flex items-center justify-center mx-auto border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)]"><RefreshCcw className="h-12 w-12 text-cyan-500 animate-spin" style={{ animationDuration: '3s' }} /></div>
                    <div className="space-y-8">
                        <h2 className="text-4xl font-black uppercase text-white tracking-tighter">Validando Aporte</h2>
                        <p className="text-white/60 text-lg font-medium px-6 leading-relaxed">Sincronizando com o terminal bancário da corretora para o ID <span className="text-primary font-mono">{myRequest?.brokerId}</span>.</p>
                        <div className="p-8 bg-cyan-500/10 rounded-[2rem] border border-cyan-500/20 flex flex-col items-center gap-4 shadow-xl">
                            <span className="text-[0.75rem] font-black text-cyan-500 uppercase tracking-[0.4em] animate-pulse">Confirmando Liquidez...</span>
                            <Progress value={45} className="h-1.5 w-40 bg-white/5 rounded-full" indicatorClassName="bg-cyan-500" />
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_5_SUCCESS' && (
                <div className="max-w-md w-full text-center space-y-10 z-10 animate-in fade-in duration-700">
                    <div className="w-24 h-24 bg-green-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-bounce"><CheckCircle2 className="h-12 w-12 text-green-500" /></div>
                    <div className="space-y-6">
                        <h2 className="text-5xl font-black uppercase text-white tracking-tighter drop-shadow-lg">Terminal Ativo!</h2>
                        <p className="text-white/60 text-xl font-medium leading-relaxed px-8">Conexão estabelecida com sucesso. Todas as ordens da conta Master estão sendo replicadas no seu terminal agora.</p>
                        <div className="flex items-center justify-center gap-10 bg-black/60 p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                            <div className="flex flex-col items-center">
                                <span className="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.3em] mb-1">LATÊNCIA</span>
                                <span className="text-2xl font-mono text-green-500 font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">12ms</span>
                            </div>
                            <div className="h-12 w-px bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.3em] mb-1">STATUS</span>
                                <span className="text-2xl font-mono text-green-500 font-black drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">SYNC</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_6_REJECTED' && (
                <div className="max-w-sm w-full text-center space-y-12 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-red-500/25 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]"><Lock className="h-12 w-12 text-red-500" /></div>
                    <div className="space-y-8">
                        <h2 className="text-4xl font-black uppercase text-white tracking-tighter">ID Rejeitado</h2>
                        <p className="text-white/60 text-lg font-medium px-6 leading-relaxed">O terminal <span className="text-red-500 font-mono bg-red-500/10 px-2 py-0.5 rounded-md">{myRequest?.brokerId}</span> não está vinculado à nossa rede mestre. Certifique-se de usar o link oficial.</p>
                        <div className="space-y-4 px-4">
                            <Button asChild className="w-full h-20 bg-white text-black font-black uppercase text-lg rounded-2xl shadow-2xl hover:bg-zinc-200 transition-all">
                                <a href={affiliateLink} target="_blank">CRIAR CONTA OFICIAL</a>
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-12 text-[0.7rem] font-black text-white/30 uppercase tracking-[0.3em] hover:text-white transition-all">Tentar outro identificador</Button>
                        </div>
                    </div>
                </div>
            )}
          </Card>
        </div>

      </main>

      {/* Corporate Risk Footer & Info */}
      <footer className="h-auto py-6 flex flex-col items-center justify-center shrink-0 border-t border-white/5 bg-black/90 backdrop-blur-3xl z-50 px-6">
          <div className="max-w-4xl w-full text-center space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 mb-2">
                  <div className="flex items-center gap-2 opacity-40">
                      <Shield className="h-3 w-3 text-white" />
                      <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-white">Tecnologia HFT Encriptada</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-40">
                      <Lock className="h-3 w-3 text-white" />
                      <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-white">Certificado SSL V.2026</span>
                  </div>
              </div>
              <p className="text-[0.6rem] font-bold uppercase tracking-tight text-white/20 leading-relaxed max-w-3xl mx-auto">
                  AVISO DE RISCO: O trading de ativos financeiros envolve riscos significativos. Resultados passados não são garantia de lucros futuros. 
                  A Estratégia Chinesa é uma ferramenta de automação e não garante rentabilidade. Cada usuário é integralmente responsável pelas suas 
                  próprias operações, decisões de investimento e gestão de capital. Opere com responsabilidade.
              </p>
              <p className="text-[0.5rem] font-black uppercase tracking-[0.5em] text-white/10 pt-2">Estratégia Chinesa • Protocolo de Elite</p>
          </div>
      </footer>
    </div>
  );
}
