
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
  Radio
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

  const formatCurrency = (val: any) => {
      const num = typeof val === 'number' ? val : (parseFloat(String(val).replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0);
      return num.toLocaleString('pt-BR', { style: 'currency', currency: BRL });
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
        alert("Por favor, insira um e-mail válido.");
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

  if (isConfigLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-body overflow-hidden">
      <div className="fixed inset-0 -z-10 grid-bg opacity-[0.05]" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <Logo size={36} />
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <span className={cn("w-1.5 h-1.5 rounded-full", masterStats.isActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <span className="text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-widest text-white/60">{masterStats.isActive ? "Cluster Online" : "Offline"}</span>
             </div>
        </div>
      </header>

      <main className="h-[calc(100dvh-80px)] overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar md:h-auto md:overflow-visible md:snap-none lg:p-10 lg:grid lg:grid-cols-12 lg:gap-8 lg:max-w-[1440px] lg:mx-auto">
        
        {/* SECTION 1: MASTER DASHBOARD (Slide 1 no Mobile) */}
        <div className="snap-start min-h-[calc(100dvh-80px)] flex flex-col justify-center p-4 lg:p-0 lg:col-span-4 lg:min-h-0 lg:justify-start lg:space-y-8">
          <Card className="bg-card/40 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:border-primary/20">
            <div className="h-2 bg-gradient-to-r from-primary via-primary/50 to-primary w-full" />
            <CardContent className="pt-8 px-6 pb-8 md:pt-10 md:px-8 md:pb-10 space-y-6 md:space-y-8">
                <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
                        <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white/10 overflow-hidden bg-black shadow-2xl">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover transform transition-transform duration-700 group-hover:scale-110" unoptimized />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-primary/60 mb-1 md:mb-2">Master Portfolio</h3>
                        <p className="text-3xl md:text-4xl font-headline font-black text-white uppercase tracking-tighter">{masterStats.traderName}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4">
                        <a href={masterStats.instagram} target="_blank" className="p-3 md:p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black transition-all">
                            <Instagram className="h-5 w-5 md:h-6 md:w-6" />
                        </a>
                        <a href={masterStats.tiktok} target="_blank" className="p-3 md:p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black transition-all">
                            <svg fill="currentColor" viewBox="0 0 448 512" className="h-5 w-5 md:h-6 md:w-6">
                                <path d="M448 209.91a210.06 210.06 0 0 1 -122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                            </svg>
                        </a>
                        <a href={masterStats.telegram} target="_blank" className="p-3 md:p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black transition-all">
                            <Send className="h-5 w-5 md:h-6 md:w-6" />
                        </a>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="p-5 bg-white/[0.03] rounded-[1.25rem] border border-white/5 flex justify-between items-center">
                        <p className="text-[0.65rem] font-black text-white/40 uppercase tracking-widest">Saldo Inicial</p>
                        <p className="text-base font-black font-mono text-white/60">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-6 bg-white/[0.05] rounded-[1.25rem] border border-white/10 flex justify-between items-center shadow-xl">
                        <p className="text-[0.65rem] font-black text-white/40 uppercase tracking-widest">Saldo Atual</p>
                        <p className="text-xl md:text-2xl font-black font-mono text-white tracking-tighter">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-6 rounded-[1.25rem] border flex justify-between items-center transition-all duration-500",
                        lastTradeResult < 0 ? "bg-red-500/10 border-red-500/20" : (lastTradeResult === 0 ? "bg-white/5 border-white/10" : "bg-green-500/10 border-green-500/20")
                    )}>
                        <p className={cn("text-[0.65rem] font-black uppercase tracking-widest", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-500" : "text-green-500"))}>Net Profit Hoje</p>
                        <p className={cn("text-xl md:text-2xl font-black font-mono tracking-tighter", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-500" : "text-green-500"))}>{masterStats.profitToday}</p>
                    </div>
                </div>

                <div className="p-6 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                         <Trophy className="h-4 w-4 text-primary" />
                         <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/40">Placar Acumulado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-2xl md:text-3xl font-black text-green-500">{scoreboard.wins}</span>
                            <span className="text-[0.55rem] font-bold text-white/30 uppercase">Wins</span>
                         </div>
                         <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-2xl md:text-3xl font-black text-red-500">{scoreboard.losses}</span>
                            <span className="text-[0.55rem] font-bold text-white/30 uppercase">Losses</span>
                         </div>
                    </div>
                    <div className="pt-2">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[0.55rem] font-black uppercase tracking-[0.1em] text-white/40">Sincronia IA</span>
                            <span className="text-sm font-black text-green-500 font-mono">{masterStats.winRate}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: masterStats.winRate }} />
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: OPERATIONS (Slide 2 no Mobile, Col 1 no Desktop) */}
        <div className="snap-start min-h-[calc(100dvh-80px)] flex flex-col justify-center p-4 lg:p-0 lg:col-span-4 lg:min-h-0 lg:justify-start">
          <Card className="bg-card/30 border border-white/5 rounded-[2rem] overflow-hidden h-full max-h-[85vh] lg:max-h-none flex flex-col">
             <CardHeader className="p-6 pb-4 shrink-0">
                <CardTitle className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary/50" /> Operações HFT
                </CardTitle>
             </CardHeader>
             <CardContent className="px-4 pb-6 space-y-2.5 overflow-y-auto no-scrollbar flex-grow">
                {masterStats.results.length > 0 ? masterStats.results.map((trade: any) => (
                    <div key={trade.id} className="grid grid-cols-12 items-center p-4 bg-white/[0.02] rounded-xl border border-white/5 group transition-all duration-300">
                        <div className="col-span-3">
                            <span className="text-[0.55rem] font-black font-mono text-white/20 block mb-1">HORÁRIO</span>
                            <span className="text-[0.7rem] md:text-xs font-black text-white/80 whitespace-nowrap">{formatFullDate(trade.date, trade.time)}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-2 pl-1">
                            <div className="shrink-0 scale-75 md:scale-100"><CurrencyFlags asset={trade.asset} /></div>
                            <span className="text-[0.7rem] md:text-sm font-black text-white uppercase tracking-tight truncate">{trade.asset.replace(' (OTC)', '')}</span>
                        </div>
                        <div className="col-span-5 flex flex-col items-end text-right">
                             <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    "text-[0.6rem] font-black uppercase tracking-widest",
                                    trade.result === 'WIN' ? "text-green-500" : (trade.result === 'LOSS' ? "text-red-500" : "text-zinc-500")
                                )}>
                                    {trade.result}
                                </span>
                                <div className={cn("w-1.5 h-1.5 rounded-full", trade.result === 'WIN' ? "bg-green-500" : (trade.result === 'LOSS' ? "bg-red-500" : "bg-zinc-500"))} />
                             </div>
                             <span className={cn(
                                "text-base md:text-lg font-black font-mono leading-none my-1 tracking-tighter",
                                trade.netChange > 0 ? "text-green-500" : (trade.netChange < 0 ? "text-red-500" : "text-white/20")
                             )}>
                                {trade.netChange > 0 ? '+' : ''}{trade.netChange.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </span>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center opacity-20 flex flex-col items-center">
                         <Clock className="h-8 w-8 mb-3" />
                         <p className="text-[0.6rem] font-black uppercase tracking-[0.2em]">Sincronizando Fluxo...</p>
                    </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* SECTION 3: SYNC CONSOLE (Slide 3 no Mobile, Col 2 no Desktop) */}
        <div className="snap-start min-h-[calc(100dvh-80px)] flex flex-col justify-center p-4 lg:p-0 lg:col-span-8 lg:min-h-0 lg:justify-start lg:mt-0">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-16 h-full flex flex-col items-center justify-center relative overflow-hidden">
            
            {step === 'STEP_1_REGISTER' && (
                <div className="max-w-md w-full text-center space-y-10 z-10 animate-in fade-in duration-700">
                    <div className="space-y-6">
                        <div className="flex justify-center animate-bounce duration-[3000ms]"><Logo size={100} showText={false} /></div>
                        <div className="space-y-3">
                            <h2 className="text-4xl md:text-5xl font-headline font-black uppercase tracking-tighter text-white">Conexão Copy</h2>
                            <p className="text-white/40 text-base md:text-lg leading-relaxed font-medium">
                                Para espelhar as operações do Trader, sua conta deve obrigatoriamente estar vinculada ao nosso cluster de alta frequência.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-4">
                        <Button asChild className="w-full h-20 md:h-24 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-xl md:text-2xl rounded-[1.5rem] md:rounded-[2rem] hover:scale-[1.03] transition-all relative overflow-hidden group/btn shadow-[0_20px_40px_rgba(255,0,0,0.15)]">
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                                <ArrowRight className="mr-3 h-6 w-6 md:h-8 md:w-8" /> VINCULAR MINHA CONTA
                            </a>
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-14 border border-white/5 bg-white/[0.02] text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/50 rounded-xl">
                            JÁ POSSUO CONTA (SINCRONIZAR)
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_2_FORM' && (
                <div className="max-w-sm w-full text-center space-y-8 z-10 animate-in zoom-in-95 duration-500">
                    <div className="space-y-2">
                        <div className="inline-flex p-3 bg-primary/10 rounded-2xl border border-primary/20 mb-2">
                             <Zap className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-headline font-black uppercase text-white tracking-tighter">Handshake</h2>
                        <p className="text-[0.6rem] text-white/30 uppercase font-black tracking-[0.3em]">Protocolo de Identificação</p>
                    </div>
                    <div className="space-y-5 text-left">
                        <div className="space-y-2">
                            <Label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 ml-3">Canal de E-mail</Label>
                            <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="h-16 bg-black/60 border-white/10 rounded-2xl text-lg focus:ring-primary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 ml-3">Terminal ID (Exnova)</Label>
                            <Input value={formData.brokerId} onChange={e => setFormData({...formData, brokerId: e.target.value.replace(/\D/g, '')})} placeholder="ID do usuário" className="h-16 bg-black/60 border-white/10 rounded-2xl font-mono text-xl tracking-[0.2em] focus:ring-primary/20" />
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleRequestVerification} disabled={!formData.email || formData.brokerId.length < 5 || isSubmitting} className="w-full h-18 bg-primary text-primary-foreground font-black uppercase text-lg rounded-[1.25rem] shadow-xl hover:scale-[1.02] transition-all">
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'SOLICITAR SINCRONIZAÇÃO'}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_1_REGISTER')} className="w-full h-10 text-[0.55rem] font-black uppercase tracking-[0.3em] text-white/10 mt-2">Voltar</Button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_3_PENDING' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="relative h-48 w-48 mx-auto">
                        <div className="absolute inset-0 border-[6px] border-primary/5 rounded-full" />
                        <div className="absolute inset-0 border-[6px] border-primary rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Radio className="h-12 w-12 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-3xl font-black uppercase text-white tracking-tighter">Validando ID</h3>
                        <p className="text-sm text-white/40 leading-relaxed font-medium">O cluster está processando o ID <span className="text-primary font-mono">{myRequest?.brokerId || formData.brokerId}</span>. A liberação ocorrerá após confirmação manual.</p>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                            <p className="text-[0.6rem] font-black text-primary uppercase tracking-[0.3em]">Status: AGUARDANDO AUTORIZAÇÃO</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_4_AWAITING_DEPOSIT' && (
                <div className="max-w-md w-full space-y-8 z-10 animate-in fade-in duration-700">
                    {!myRequest?.name ? (
                        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[2.5rem] text-center space-y-8">
                            <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto border border-green-500/20"><UserCheck className="h-10 w-10 text-green-500" /></div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black uppercase text-white tracking-tighter">ID Vinculado!</h2>
                                <p className="text-primary text-[0.6rem] font-black uppercase tracking-[0.3em]">Complete seu perfil técnico</p>
                            </div>
                            <div className="space-y-4 text-left">
                                <Input value={nameData} onChange={e => setNameData(e.target.value)} placeholder="Seu nome completo" className="h-16 bg-black/40 border-white/10 rounded-xl text-xl font-bold px-6" />
                                <Button onClick={handleUpdateProfile} disabled={!nameData || isUpdatingName} className="w-full h-16 bg-white text-black font-black uppercase text-lg rounded-xl shadow-2xl">
                                    {isUpdatingName ? <Loader2 className="h-6 w-6 animate-spin" /> : 'GERAR CERTIFICADO'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] text-center space-y-8">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20"><ShieldCheck className="h-10 w-10 text-primary" /></div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Aguardando Margem</h2>
                                <p className="text-primary text-[0.6rem] font-black uppercase tracking-[0.3em]">Liquidez Proporcional Requerida</p>
                            </div>
                            <div className="p-6 bg-black/60 rounded-2xl border border-white/5 text-left space-y-4">
                                <p className="text-sm text-white/50 leading-relaxed font-medium">O algoritmo exige uma **Margem de Segurança** de R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR')} para espelhar as entradas de alta frequência do Master.</p>
                            </div>
                            <div className="space-y-4">
                                <Button asChild className="w-full h-20 bg-primary text-primary-foreground font-black uppercase text-xl rounded-2xl shadow-xl animate-pulse">
                                    <a href={affiliateLink} target="_blank" rel="noopener noreferrer">ATIVAR MARGEM AGORA</a>
                                </Button>
                                <Button variant="outline" onClick={handleConfirmDeposit} disabled={isConfirmingDeposit} className="w-full h-14 border-white/10 bg-white/[0.02] text-[0.7rem] font-black uppercase tracking-[0.2em] rounded-xl">
                                    {isConfirmingDeposit ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />} JÁ REALIZEI O APORTE
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'STEP_7_VERIFYING_DEPOSIT' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto border border-cyan-500/20"><RefreshCcw className="h-12 w-12 text-cyan-500 animate-spin" style={{ animationDuration: '3s' }} /></div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Validando Aporte</h2>
                        <p className="text-white/40 text-sm font-medium">Estamos verificando na rede da corretora a integridade da margem para o ID <span className="text-primary font-mono">{myRequest?.brokerId}</span>.</p>
                        <div className="p-6 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 flex flex-col items-center gap-3">
                            <span className="text-[0.6rem] font-black text-cyan-500 uppercase tracking-[0.3em] animate-pulse">Sincronizando...</span>
                            <Progress value={45} className="h-1 w-32 bg-white/5" />
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_5_SUCCESS' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in fade-in duration-700">
                    <div className="w-24 h-24 bg-green-500/20 rounded-3xl flex items-center justify-center mx-auto border border-green-500/30"><CheckCircle2 className="h-12 w-12 text-green-500" /></div>
                    <div className="space-y-6">
                        <h2 className="text-4xl font-black uppercase text-white tracking-tighter">Handshake Ativo!</h2>
                        <p className="text-white/40 text-base leading-relaxed font-medium">Conexão estabelecida. Todas as ordens da conta Master estão sendo replicadas agora.</p>
                        <div className="flex items-center justify-center gap-8 bg-black/40 p-6 rounded-2xl border border-white/5">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[0.55rem] font-black text-white/20 uppercase tracking-widest">LATÊNCIA</span>
                                <span className="text-xl font-mono text-green-500 font-black">12ms</span>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[0.55rem] font-black text-white/20 uppercase tracking-widest">STATUS</span>
                                <span className="text-xl font-mono text-green-500 font-black">STABLE</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_6_REJECTED' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto border border-red-500/30"><Lock className="h-12 w-12 text-red-500" /></div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black uppercase text-white tracking-tighter">ID Rejeitado</h2>
                        <p className="text-white/40 text-sm font-medium">O ID não está vinculado à nossa rede mestre. Certifique-se de ter criado a conta pelo link oficial.</p>
                        <div className="space-y-3">
                            <Button asChild className="w-full h-18 bg-white text-black font-black uppercase text-lg rounded-xl">
                                <a href={affiliateLink} target="_blank">CRIAR CONTA OFICIAL</a>
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-10 text-[0.6rem] font-black text-white/20 uppercase tracking-[0.2em]">Tentar outro identificador</Button>
                        </div>
                    </div>
                </div>
            )}
          </Card>
        </div>

      </main>

      <footer className="h-20 snap-start flex flex-col items-center justify-center shrink-0 border-t border-white/5 bg-black/80 lg:mt-20">
          <p className="text-[0.55rem] font-black uppercase tracking-[0.4em] text-white/10">Terminal de Alta Frequência • Estratégia Chinesa V.2026</p>
      </footer>
    </div>
  );
}
