
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  UserCheck, 
  ArrowRight, 
  Activity,
  CheckCircle2,
  RefreshCcw,
  Trophy,
  Instagram,
  Send,
  User as UserIcon,
  Lock,
  Radio,
  ExternalLink,
  Shield,
  X
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_#0e0e0e_0%,_#050505_100%)]" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-[0.03]" />
      
      <header className="h-16 lg:h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-2xl shrink-0 z-50">
        <Logo size={36} />
        <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <span className={cn("w-1.5 h-1.5 rounded-full", masterStats.isActive ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-red-500")} />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/80">{masterStats.isActive ? "Cluster Online" : "Offline"}</span>
             </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto snap-y snap-mandatory lg:overflow-hidden lg:snap-none lg:grid lg:grid-cols-12 lg:gap-6 lg:p-6 lg:max-w-[1600px] lg:mx-auto w-full no-scrollbar">
        
        {/* SLIDE 1: MASTER DASHBOARD - COMPACTED TO FIT WITHOUT SCROLL */}
        <div className="snap-start min-h-[calc(100dvh-64px)] lg:min-h-0 flex flex-col p-4 lg:p-0 lg:col-span-3 lg:h-full">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-3xl rounded-[2rem] overflow-hidden flex flex-col h-full">
            <div className="h-1.5 bg-primary w-full" />
            <div className="flex-grow flex flex-col justify-between p-5 lg:p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-white/10 overflow-hidden bg-black shadow-xl">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover" unoptimized />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-[0.6rem] font-black uppercase tracking-[0.4em] text-primary/70">Portfolio Master</h3>
                        <p className="text-xl lg:text-2xl font-headline font-black text-white uppercase tracking-tighter">{masterStats.traderName}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {[
                            { icon: Instagram, href: masterStats.instagram },
                            { icon: () => (
                                <svg fill="currentColor" viewBox="0 0 448 512" className="h-4 w-4">
                                    <path d="M448 209.91a210.06 210.06 0 0 1 -122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                                </svg>
                            ), href: masterStats.tiktok },
                            { icon: Send, href: masterStats.telegram }
                        ].map((social, i) => (
                            <a key={i} href={social.href} target="_blank" className="p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                                <social.icon className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="space-y-2.5 my-4">
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex justify-between items-center">
                        <p className="text-[0.6rem] font-black text-white/50 uppercase tracking-[0.2em]">Saldo Inicial</p>
                        <p className="text-sm font-black font-mono text-white/70">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-5 bg-white/[0.05] rounded-xl border border-white/10 flex justify-between items-center shadow-2xl">
                        <p className="text-[0.6rem] font-black text-white/60 uppercase tracking-[0.2em]">Saldo Atual</p>
                        <p className="text-xl font-black font-mono text-white tracking-tighter">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-5 rounded-xl border flex justify-between items-center",
                        lastTradeResult < 0 ? "bg-red-500/5 border-red-500/10" : (lastTradeResult === 0 ? "bg-white/5 border-white/10" : "bg-green-500/5 border-green-500/10")
                    )}>
                        <p className={cn("text-[0.6rem] font-black uppercase tracking-[0.2em]", lastTradeResult < 0 ? "text-red-500/80" : (lastTradeResult === 0 ? "text-white/40" : "text-green-500/80"))}>Net Profit Hoje</p>
                        <p className={cn("text-xl font-black font-mono tracking-tighter", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-600" : "text-green-500"))}>{masterStats.profitToday}</p>
                    </div>
                </div>

                <div className="p-5 bg-black/60 rounded-[1.5rem] border border-white/10 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Trophy className="h-3.5 w-3.5 text-primary" />
                             <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/50">Placar Mensal</span>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="flex flex-col items-center bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-2xl font-black text-green-500">{scoreboard.wins}</span>
                            <span className="text-[0.55rem] font-bold text-white/40 uppercase mt-0.5">Wins</span>
                         </div>
                         <div className="flex flex-col items-center bg-white/5 p-3 rounded-lg border border-white/5">
                            <span className="text-2xl font-black text-red-500">{scoreboard.losses}</span>
                            <span className="text-[0.55rem] font-bold text-white/40 uppercase mt-0.5">Losses</span>
                         </div>
                    </div>
                    <div className="pt-1">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[0.6rem] font-black uppercase text-white/50 tracking-[0.1em]">Assertividade IA</span>
                            <span className="text-xs font-black text-green-500 font-mono">{masterStats.winRate}</span>
                        </div>
                        <Progress value={parseFloat(masterStats.winRate)} className="h-1 bg-white/5" indicatorClassName="bg-green-500" />
                    </div>
                </div>
            </div>
          </Card>
        </div>

        {/* SLIDE 2: OPERATIONS HISTORY */}
        <div className="snap-start min-h-[calc(100dvh-64px)] lg:min-h-0 flex flex-col p-4 lg:p-0 lg:col-span-4 lg:h-full">
          <Card className="bg-card/30 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl backdrop-blur-xl">
             <CardHeader className="p-5 lg:p-6 pb-4 shrink-0 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-white/60 flex items-center gap-3">
                    <Activity className="h-4 w-4 text-primary/70" />
                    Fluxo HFT Live
                </CardTitle>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             </CardHeader>
             <CardContent className="p-3 lg:p-4 space-y-2 overflow-y-auto no-scrollbar flex-grow bg-black/40">
                {masterStats.results.length > 0 ? masterStats.results.map((trade: any) => (
                    <div key={trade.id} className="grid grid-cols-12 items-center p-3.5 bg-white/[0.02] rounded-xl border border-white/5 transition-all hover:bg-white/[0.06]">
                        <div className="col-span-3">
                            <span className="text-[0.5rem] font-black font-mono text-white/30 block mb-0.5 uppercase">Time</span>
                            <span className="text-[0.7rem] font-black text-white/80 whitespace-nowrap font-mono">{formatFullDate(trade.date, trade.time)}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-2.5 pl-1">
                            <CurrencyFlags asset={trade.asset} />
                            <span className="text-[0.75rem] font-black text-white uppercase truncate tracking-tight">{trade.asset.replace(' (OTC)', '')}</span>
                        </div>
                        <div className="col-span-5 flex flex-col items-end text-right">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[0.6rem] font-black uppercase tracking-[0.1em]",
                                    trade.result === 'WIN' ? "text-green-500" : (trade.result === 'LOSS' ? "text-red-500" : "text-zinc-500")
                                )}>
                                    {trade.result}
                                </span>
                             </div>
                             <span className={cn(
                                "text-sm font-black font-mono leading-none mt-0.5 tracking-tighter",
                                trade.netChange > 0 ? "text-green-500" : (trade.netChange < 0 ? "text-red-500" : "text-white/30")
                             )}>
                                {trade.netChange > 0 ? '+' : ''}{trade.netChange.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </span>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                         <Loader2 className="h-8 w-8 mb-4 animate-spin" />
                         <p className="text-[0.6rem] font-black uppercase tracking-[0.4em]">Sincronizando...</p>
                    </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* SLIDE 3: SYNC CONSOLE */}
        <div className="snap-start min-h-[calc(100dvh-64px)] lg:min-h-0 flex flex-col p-4 lg:p-0 lg:col-span-5 lg:h-full">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-[50px] rounded-[2.5rem] p-6 lg:p-10 h-full flex flex-col items-center justify-center relative overflow-hidden">
            
            {step === 'STEP_1_REGISTER' && (
                <div className="max-w-md w-full text-center space-y-10 z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="space-y-6">
                        <div className="flex justify-center scale-110 md:scale-125">
                            <Logo size={100} showText={false} />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tighter text-white">Conexão Copy</h2>
                            <p className="text-white/60 text-sm md:text-base leading-relaxed font-medium px-4 max-w-sm mx-auto">
                                Para espelhar as operações do Trader, sua conta deve obrigatoriamente estar vinculada ao nosso cluster de alta frequência.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3 pt-4 px-2">
                        <Button asChild className="w-full h-16 md:h-20 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-lg md:text-xl rounded-[1.5rem] hover:scale-[1.03] transition-all shadow-[0_15px_40px_rgba(255,0,0,0.15)]">
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                <ArrowRight className="mr-2 h-5 w-5 md:h-7 md:w-7" /> VINCULAR CONTA
                            </a>
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-12 text-[0.65rem] md:text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/30 rounded-xl hover:bg-white/5 transition-all">
                            JÁ POSSUO CONTA (SINCRONIZAR)
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_2_FORM' && (
                <div className="max-w-sm w-full text-center space-y-8 z-10 animate-in zoom-in-95 duration-500">
                    <div className="space-y-2">
                        <div className="inline-flex p-3 bg-primary/10 rounded-2xl border border-primary/20 mb-1">
                             <Zap className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-headline font-black uppercase text-white tracking-tighter">Protocolo</h2>
                        <p className="text-[0.6rem] text-white/50 uppercase font-black tracking-[0.3em]">Identificação de Terminal</p>
                    </div>
                    <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                            <Label className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-white/30 ml-2">Canal de E-mail</Label>
                            <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="h-14 bg-black/40 border-white/10 rounded-xl text-base px-5" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-white/30 ml-2">Terminal ID (Exnova)</Label>
                            <Input value={formData.brokerId} onChange={e => setFormData({...formData, brokerId: e.target.value.replace(/\D/g, '')})} placeholder="ID do usuário" className="h-14 bg-black/40 border-white/10 rounded-xl font-mono text-lg tracking-[0.2em] px-5" />
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleRequestVerification} disabled={!formData.email || formData.brokerId.length < 5 || isSubmitting} className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-lg rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SOLICITAR SINCRONIZAÇÃO'}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_1_REGISTER')} className="w-full h-10 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/20 mt-2">Cancelar</Button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_3_PENDING' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="relative h-32 w-32 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-[3px] border-primary/10 rounded-full" />
                        <div className="absolute inset-0 border-[3px] border-primary rounded-full border-t-transparent animate-spin" />
                        <Radio className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black uppercase text-white tracking-tighter">Validando ID</h3>
                        <p className="text-base text-white/50 leading-relaxed px-6">O cluster está processando o ID <span className="text-primary font-mono">{myRequest?.brokerId || formData.brokerId}</span>. A liberação ocorrerá após confirmação da rede.</p>
                        <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 mx-6">
                            <p className="text-[0.6rem] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Aguardando Autorização...</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_4_AWAITING_DEPOSIT' && (
                <div className="max-w-md w-full z-10 animate-in fade-in duration-700">
                    {!myRequest?.name ? (
                        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] text-center space-y-8 shadow-xl">
                            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto border border-green-500/20"><UserCheck className="h-8 w-8 text-green-500" /></div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase text-white tracking-tighter">ID Vinculado</h2>
                                <p className="text-primary text-[0.6rem] font-black uppercase tracking-[0.3em]">Perfil Técnico</p>
                            </div>
                            <div className="space-y-4 text-left">
                                <Input value={nameData} onChange={e => setNameData(e.target.value)} placeholder="Seu nome completo" className="h-14 bg-black/50 border-white/10 rounded-xl text-lg font-bold px-6" />
                                <Button onClick={handleUpdateProfile} disabled={!nameData || isUpdatingName} className="w-full h-16 bg-white text-black font-black uppercase text-base rounded-xl shadow-lg hover:bg-zinc-200 transition-all">
                                    {isUpdatingName ? <Loader2 className="h-5 w-5 animate-spin" /> : 'GERAR CERTIFICADO'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] text-center space-y-8 shadow-xl">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20"><ShieldCheck className="h-8 w-8 text-primary" /></div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Margem de Segurança</h2>
                                <p className="text-primary text-[0.6rem] font-black uppercase tracking-[0.3em]">Liquidez Requerida</p>
                            </div>
                            <div className="p-5 bg-black/60 rounded-xl border border-white/5 text-left">
                                <p className="text-xs text-white/60 leading-relaxed">O algoritmo exige uma **Margem de Segurança** de <span className="text-white font-bold">R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR')}</span> para espelhar as entradas.</p>
                            </div>
                            <div className="space-y-3">
                                <Button asChild className="w-full h-16 bg-primary text-primary-foreground font-black uppercase text-base rounded-xl shadow-lg animate-pulse">
                                    <a href={affiliateLink} target="_blank" rel="noopener noreferrer">ATIVAR MARGEM AGORA</a>
                                </Button>
                                <Button variant="outline" onClick={handleConfirmDeposit} disabled={isConfirmingDeposit} className="w-full h-12 border-white/10 bg-white/[0.03] text-[0.65rem] font-black uppercase tracking-[0.2em] rounded-xl">
                                    {isConfirmingDeposit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />} JÁ REALIZEI O APORTE
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'STEP_7_VERIFYING_DEPOSIT' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20"><RefreshCcw className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: '3s' }} /></div>
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Validando Aporte</h2>
                        <p className="text-white/60 text-base font-medium px-6 leading-relaxed">Sincronizando com o terminal bancário da corretora para o ID <span className="text-primary font-mono">{myRequest?.brokerId}</span>.</p>
                    </div>
                </div>
            )}

            {step === 'STEP_5_SUCCESS' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-green-500/15 rounded-2xl flex items-center justify-center mx-auto border border-green-500/20 animate-bounce"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>
                    <div className="space-y-5">
                        <h2 className="text-3xl font-black uppercase text-white tracking-tighter">Terminal Ativo!</h2>
                        <p className="text-white/60 text-base leading-relaxed px-8">Conexão estabelecida. Todas as ordens estão sendo replicadas no seu terminal agora.</p>
                        <div className="flex items-center justify-center gap-8 bg-black/60 p-6 rounded-[2rem] border border-white/5 mx-4">
                            <div className="flex flex-col items-center">
                                <span className="text-[0.55rem] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">LATÊNCIA</span>
                                <span className="text-xl font-mono text-green-500 font-black">12ms</span>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[0.55rem] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">STATUS</span>
                                <span className="text-xl font-mono text-green-500 font-black">SYNC</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_6_REJECTED' && (
                <div className="max-w-sm w-full text-center space-y-10 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20"><Lock className="h-10 w-10 text-red-500" /></div>
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black uppercase text-white tracking-tighter">ID Rejeitado</h2>
                        <p className="text-white/60 text-base leading-relaxed px-6">O terminal <span className="text-red-500 font-mono">{myRequest?.brokerId}</span> não está vinculado à nossa rede mestre.</p>
                        <div className="space-y-3 px-6">
                            <Button asChild className="w-full h-16 bg-white text-black font-black uppercase text-base rounded-xl shadow-lg">
                                <a href={affiliateLink} target="_blank">CRIAR CONTA OFICIAL</a>
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-10 text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em]">Tentar outro ID</Button>
                        </div>
                    </div>
                </div>
            )}
          </Card>
        </div>

      </main>

      {/* DISCRETE CORPORATE FOOTER - INTEGRATED IN FLOW */}
      <footer className="shrink-0 py-4 px-6 border-t border-white/5 bg-black/80 backdrop-blur-md z-50">
          <div className="max-w-4xl mx-auto text-center space-y-1">
              <div className="flex items-center justify-center gap-6 opacity-20 text-[0.5rem] font-black uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-1.5"><Shield className="h-2.5 w-2.5" /> HFT Encrypted</div>
                  <div className="flex items-center gap-1.5"><Lock className="h-2.5 w-2.5" /> SSL Secure V.2026</div>
              </div>
              <p className="text-[0.5rem] font-bold uppercase tracking-tight text-white/10 leading-tight">
                  AVISO: Trading envolve riscos. Sem garantia de lucros. Responsabilidade exclusiva do usuário. Opere com consciência.
              </p>
          </div>
      </footer>
    </div>
  );
}
