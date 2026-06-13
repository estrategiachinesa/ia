
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
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    balance: formatCurrency(config?.copyMasterBalance ?? 245892.10),
    initialBalance: formatCurrency(config?.copyInitialBalance ?? 240000.00),
    profitToday: (lastTradeResult >= 0 ? '+ ' : '') + formatCurrency(lastTradeResult),
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

  const sendTelegramNotification = async (message: string) => {
    if (!config?.tgEnabled || !config?.tgBotToken || !config?.tgChatId) return;
    try {
        await fetch(`https://api.telegram.org/bot${config.tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.tgChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) { console.error("Erro Telegram:", e); }
  };

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

        if (config?.tgNotifyLeads && config?.tgMsgLead) {
            const msg = config.tgMsgLead
                .replace('{{id}}', formData.brokerId)
                .replace('{{url}}', `${window.location.origin}/copy`);
            sendTelegramNotification(msg);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
      if (!nameData || !savedRequestId || !firestore) return;
      setIsUpdatingName(true);
      try {
          await updateDoc(doc(firestore, 'copyRequests', savedRequestId), {
              name: nameData
          });
      } catch (e) {
          console.error(e);
      } finally {
          setIsUpdatingName(false);
      }
  };

  const handleConfirmDeposit = async () => {
      if (!savedRequestId || !firestore) return;
      setIsConfirmingDeposit(true);
      try {
          await updateDoc(doc(firestore, 'copyRequests', savedRequestId), {
              status: 'DEPOSIT_PENDING'
          });
          setStep('STEP_7_VERIFYING_DEPOSIT');

          if (config?.tgNotifyLeads && config?.tgMsgDeposit) {
            const msg = config.tgMsgDeposit.replace('{{url}}', `${window.location.origin}/copy`);
            sendTelegramNotification(msg);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsConfirmingDeposit(false);
      }
  };

  if (isConfigLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-body pb-24 overflow-x-hidden">
      <div className="fixed inset-0 -z-10 grid-bg opacity-[0.05]" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <Logo size={36} />
        <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                <span className={cn("w-2 h-2 rounded-full", masterStats.isActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/60">{masterStats.isActive ? "Cluster Online" : "Cluster Offline"}</span>
             </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px]">
        
        {/* LEFT: MASTER DASHBOARD */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-card/40 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl rounded-[2.5rem] overflow-hidden group transition-all duration-500 hover:border-primary/20">
            <div className="h-2.5 bg-gradient-to-r from-primary via-primary/50 to-primary w-full" />
            <CardContent className="pt-10 px-8 pb-10 space-y-8">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
                        <div className="relative h-40 w-40 rounded-full border-4 border-white/10 overflow-hidden bg-black shadow-2xl">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover transform transition-transform duration-700 group-hover:scale-110" unoptimized />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-primary/60 mb-2">Master Portfolio</h3>
                        <p className="text-4xl font-headline font-black text-white uppercase tracking-tighter">{masterStats.traderName}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <a href={masterStats.instagram} target="_blank" className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black hover:-translate-y-1 transition-all duration-300">
                            <Instagram className="h-6 w-6" />
                        </a>
                        <a href={masterStats.tiktok} target="_blank" className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black hover:-translate-y-1 transition-all duration-300">
                            <svg fill="currentColor" viewBox="0 0 448 512" className="h-6 w-6">
                                <path d="M448 209.91a210.06 210.06 0 0 1 -122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                            </svg>
                        </a>
                        <a href={masterStats.telegram} target="_blank" className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-primary hover:text-black hover:-translate-y-1 transition-all duration-300">
                            <Send className="h-6 w-6" />
                        </a>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-6 bg-white/[0.03] rounded-[1.5rem] border border-white/5 flex justify-between items-center group/item hover:bg-white/5 transition-colors">
                        <p className="text-xs font-black text-white/40 uppercase tracking-widest">Saldo Inicial</p>
                        <p className="text-lg font-black font-mono text-white/60">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-7 bg-white/[0.05] rounded-[1.5rem] border border-white/10 flex justify-between items-center shadow-xl">
                        <p className="text-xs font-black text-white/40 uppercase tracking-widest">Saldo em Conta</p>
                        <p className="text-2xl font-black font-mono text-white tracking-tighter">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-7 rounded-[1.5rem] border flex justify-between items-center transition-all duration-500",
                        lastTradeResult < 0 ? "bg-red-500/10 border-red-500/20" : (lastTradeResult === 0 ? "bg-white/5 border-white/10" : "bg-green-500/10 border-green-500/20")
                    )}>
                        <p className={cn("text-xs font-black uppercase tracking-widest", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-500" : "text-green-500"))}>Net Profit Hoje</p>
                        <p className={cn("text-2xl font-black font-mono tracking-tighter", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-500" : "text-green-500"))}>{masterStats.profitToday}</p>
                    </div>
                </div>

                <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                         <div className={cn(
                            "px-3 py-1 rounded-full text-[0.6rem] font-black tracking-widest transition-all",
                            masterStats.isActive ? "bg-green-500/20 text-green-500 border border-green-500/30 animate-pulse" : "bg-red-500/20 text-red-500 border border-red-500/30"
                        )}>
                            {masterStats.isActive ? "EXECUTANDO" : "STANDEBY"}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <Trophy className="h-5 w-5 text-primary" />
                         <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/40">Performance Histórica</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-4xl font-black text-green-500">{scoreboard.wins}</span>
                            <span className="text-[0.65rem] font-bold text-white/30 uppercase mt-1">Wins</span>
                         </div>
                         <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                            <span className="text-4xl font-black text-red-500">{scoreboard.losses}</span>
                            <span className="text-[0.65rem] font-bold text-white/30 uppercase mt-1">Losses</span>
                         </div>
                    </div>
                </div>

                <div className="space-y-4 px-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-white/40">Sincronia Algorítmica</span>
                        <span className="text-xl font-black text-green-500 font-mono tracking-tighter">{masterStats.winRate}</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out" 
                            style={{ width: masterStats.winRate }}
                        />
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border border-white/5 rounded-[2rem] overflow-hidden hidden md:block">
             <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-white/30 flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary/50" /> Operações em Tempo Real
                </CardTitle>
             </CardHeader>
             <CardContent className="px-6 pb-8 space-y-3">
                {masterStats.results.length > 0 ? masterStats.results.slice(0, 8).map((trade: any) => (
                    <div key={trade.id} className="grid grid-cols-12 items-center p-5 bg-white/[0.02] rounded-2xl border border-white/5 group hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                        <div className="col-span-3">
                            <span className="text-[0.6rem] font-black font-mono text-white/30 block mb-1">DATA/HORA</span>
                            <span className="text-xs font-black text-white/80 whitespace-nowrap">{formatFullDate(trade.date, trade.time)}</span>
                        </div>
                        <div className="col-span-4 flex items-center gap-3 pl-2">
                            <div className="shrink-0"><CurrencyFlags asset={trade.asset} /></div>
                            <span className="text-sm font-black text-white uppercase tracking-tight truncate">{trade.asset.replace(' (OTC)', '')}</span>
                        </div>
                        <div className="col-span-5 flex flex-col items-end text-right">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[0.65rem] font-black uppercase tracking-widest",
                                    trade.result === 'WIN' ? "text-green-500" : (trade.result === 'LOSS' ? "text-red-500" : "text-zinc-500")
                                )}>
                                    {trade.result}
                                </span>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    trade.result === 'WIN' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : (trade.result === 'LOSS' ? "bg-red-500" : "bg-zinc-500")
                                )} />
                             </div>
                             <span className={cn(
                                "text-lg font-black font-mono leading-none my-1 tracking-tighter",
                                trade.netChange > 0 ? "text-green-500" : (trade.netChange < 0 ? "text-red-500" : "text-white/20")
                             )}>
                                {trade.netChange > 0 ? '+' : ''}{formatCurrency(trade.netChange)}
                             </span>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center opacity-20">
                         <Clock className="h-10 w-10 mx-auto mb-3" />
                         <p className="text-[0.6rem] font-black uppercase tracking-[0.2em]">Aguardando Fluxo...</p>
                    </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* RIGHT: SYNC CONSOLE */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="bg-card/40 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl rounded-[3rem] p-6 md:p-16 min-h-[750px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
            
            {step === 'STEP_1_REGISTER' && (
                <div className="max-w-md w-full text-center space-y-12 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="space-y-8">
                        <div className="flex justify-center transform transition-transform duration-1000 hover:scale-105">
                             <Logo size={120} showText={false} />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-5xl font-headline font-black uppercase tracking-tighter text-white leading-none">Conexão Copy</h2>
                            <p className="text-white/40 text-lg leading-relaxed max-w-[90%] mx-auto font-medium">
                                Para espelhar as operações do Trader, sua conta deve obrigatoriamente estar vinculada ao nosso cluster de alta frequência.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <Button asChild className="w-full h-24 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-2xl shadow-[0_20px_40px_rgba(255,0,0,0.2)] rounded-[2rem] hover:scale-[1.03] active:scale-95 transition-all duration-300 relative overflow-hidden group/btn">
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                                <ArrowRight className="mr-4 h-8 w-8" /> VINCULAR MINHA CONTA
                            </a>
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setStep('STEP_2_FORM')}
                            className="w-full h-16 border border-white/5 bg-white/[0.02] text-sm font-black uppercase tracking-[0.2em] text-white/50 hover:bg-white/5 rounded-2xl"
                        >
                            JÁ POSSUO CONTA (SINCRONIZAR)
                        </Button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 pt-8 opacity-20">
                         <div className="flex flex-col items-center gap-1">
                            <ShieldCheck className="h-5 w-5" />
                            <span className="text-[0.5rem] font-black uppercase">AES-256</span>
                         </div>
                         <div className="h-8 w-px bg-white/20" />
                         <div className="flex flex-col items-center gap-1">
                            <Cpu className="h-5 w-5" />
                            <span className="text-[0.5rem] font-black uppercase">Handshake</span>
                         </div>
                    </div>
                </div>
            )}

            {step === 'STEP_2_FORM' && (
                <div className="max-w-md w-full text-center space-y-10 z-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-4">
                        <div className="inline-flex p-4 bg-primary/10 rounded-3xl border border-primary/20 mb-4">
                             <Zap className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-headline font-black uppercase text-white tracking-tighter">Protocolo Handshake</h2>
                        <p className="text-sm text-white/40 uppercase font-black tracking-[0.3em]">
                            Inicie a validação do seu cluster técnico
                        </p>
                    </div>

                    <div className="space-y-6 text-left">
                        <div className="space-y-2.5">
                            <Label className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/30 ml-4">Canal de Comunicação (E-mail)</Label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="pl-16 h-18 bg-black/60 border-white/10 rounded-3xl text-xl focus:ring-primary/20 focus:border-primary/40 transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/30 ml-4">Terminal de Usuário (ID Corretora)</Label>
                            <div className="relative group">
                                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-primary transition-colors" />
                                <Input value={formData.brokerId} onChange={e => setFormData({...formData, brokerId: e.target.value.replace(/\D/g, '')})} placeholder="ID da Exnova" className="pl-16 h-18 bg-black/60 border-white/10 rounded-3xl font-mono text-2xl tracking-[0.2em] focus:ring-primary/20 focus:border-primary/40 transition-all" />
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button 
                                onClick={handleRequestVerification}
                                disabled={!formData.email || formData.brokerId.length < 5 || isSubmitting}
                                className="w-full h-20 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-xl rounded-[1.5rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : 'SOLICITAR SINCRONIZAÇÃO'}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_1_REGISTER')} className="w-full h-12 text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/20 mt-4 hover:text-white/60">Voltar para início</Button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_3_PENDING' && (
                <div className="max-w-md w-full text-center space-y-12 z-10 animate-in zoom-in-95 duration-500">
                    <div className="relative h-56 w-56 mx-auto">
                        <div className="absolute inset-0 border-[8px] border-primary/5 rounded-full" />
                        <div className="absolute inset-0 border-[8px] border-primary rounded-full border-t-transparent animate-spin shadow-[0_0_30px_rgba(255,0,0,0.3)]" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1 animate-pulse">
                                <Radio className="h-16 w-16 text-primary" />
                                <span className="text-[0.6rem] font-black text-primary uppercase tracking-widest">Scanning</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black uppercase text-white tracking-tighter">Validando Handshake</h3>
                            <p className="text-lg text-white/40 leading-relaxed font-medium">
                                O cluster está cruzando os dados do ID <span className="text-primary font-mono font-black">{myRequest?.brokerId || formData.brokerId}</span> com o servidor mestre. A liberação ocorrerá após a confirmação de integridade.
                            </p>
                        </div>
                        <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/20 backdrop-blur-md">
                            <div className="flex items-center justify-center gap-4">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Status: AGUARDANDO AUTORIZAÇÃO</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_4_AWAITING_DEPOSIT' && (
                <div className="max-w-xl w-full space-y-10 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {!myRequest?.name ? (
                        <div className="bg-white/[0.02] border border-white/10 p-12 md:p-20 rounded-[3rem] text-center space-y-10 backdrop-blur-3xl shadow-2xl">
                            <div className="w-28 h-28 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                                <UserCheck className="h-14 w-14 text-green-500" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-headline font-black uppercase text-white tracking-tighter">ID Vinculado!</h2>
                                <p className="text-primary text-[0.7rem] font-black uppercase tracking-[0.4em]">Finalize o seu perfil de mestre</p>
                            </div>
                            <div className="space-y-6 text-left">
                                <div className="space-y-3">
                                    <Label className="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/30 ml-6">Nome do Protocolo</Label>
                                    <Input 
                                        value={nameData} 
                                        onChange={e => setNameData(e.target.value)} 
                                        placeholder="Seu nome completo" 
                                        className="h-20 bg-black/40 border-white/10 rounded-[1.5rem] text-2xl font-bold px-8 focus:ring-primary/20"
                                    />
                                </div>
                                <Button 
                                    onClick={handleUpdateProfile}
                                    disabled={!nameData || isUpdatingName}
                                    className="w-full h-20 bg-white text-black font-black uppercase tracking-tighter text-xl rounded-[1.5rem] hover:bg-white/90 shadow-2xl"
                                >
                                    {isUpdatingName ? <Loader2 className="h-8 w-8 animate-spin" /> : 'GERAR CERTIFICADO DE CÓPIA'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/10 p-10 md:p-16 rounded-[3rem] text-center space-y-10 backdrop-blur-3xl">
                            <div className="w-28 h-28 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/30 shadow-[0_0_50px_rgba(255,0,0,0.2)]">
                                <ShieldCheck className="h-14 w-14 text-primary" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-headline font-black uppercase text-white tracking-tighter leading-tight">Protocolo Ativado<br />para {myRequest.name}</h2>
                                <p className="text-primary text-[0.7rem] font-black uppercase tracking-[0.4em]">Margem de Segurança Requerida</p>
                            </div>
                            
                            <div className="p-8 md:p-10 bg-black/60 rounded-[2rem] border border-white/5 text-left space-y-6 shadow-inner">
                                <p className="text-lg text-white/50 leading-relaxed font-medium">
                                    Para espelhar as ordens de alta frequência do Master {masterStats.traderName}, o algoritmo exige uma **Margem de Segurança Proporcional**. Devido ao alto valor das operações (entradas de R$ 1.000+), a corretora requer liquidez mínima para garantir o espelhamento total.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/10 gap-4">
                                    <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/30">Liquidez Mínima:</span>
                                    <span className="text-3xl font-black text-white font-mono tracking-tighter">R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <Button 
                                    asChild
                                    className="w-full h-24 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-2xl rounded-[2rem] hover:bg-primary/90 transition-all shadow-[0_25px_50px_rgba(255,0,0,0.3)] animate-pulse hover:animate-none"
                                >
                                    <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                        ATIVAR MARGEM AGORA <CircleDollarSign className="ml-4 h-8 w-8" />
                                    </a>
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={handleConfirmDeposit}
                                    disabled={isConfirmingDeposit}
                                    className="w-full h-18 border-white/10 bg-white/[0.02] text-sm font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/5"
                                >
                                    {isConfirmingDeposit ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CheckCircle2 className="mr-3 h-6 w-6 text-green-500" />} JÁ REALIZEI O APORTE
                                </Button>
                                <p className="text-[0.6rem] font-black text-white/20 uppercase tracking-[0.3em]">O sistema liberará o Handshake automaticamente após detecção de saldo.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'STEP_7_VERIFYING_DEPOSIT' && (
                <div className="max-md w-full text-center space-y-12 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-32 h-32 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                        <RefreshCcw className="h-16 w-16 text-cyan-500 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-4xl font-headline font-black uppercase text-white tracking-tighter">Validando Aporte</h2>
                        <p className="text-white/40 text-lg leading-relaxed font-medium">
                            O cluster de segurança recebeu o sinal de depósito. Estamos verificando na rede da corretora a integridade da margem para o ID <span className="text-primary font-mono font-black">{myRequest?.brokerId}</span>.
                        </p>
                        <div className="p-8 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/10 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-4">
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                                </span>
                                <span className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em] animate-pulse">SINCRONIZANDO LIQUIDEZ...</span>
                            </div>
                            <Progress value={45} className="h-1.5 w-48 bg-white/5" />
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_5_SUCCESS' && (
                <div className="max-w-md w-full text-center space-y-12 z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-32 h-32 bg-green-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-green-500/30 shadow-[0_0_60px_rgba(34,197,94,0.3)]">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-headline font-black uppercase text-white tracking-tighter">Handshake Ativo!</h2>
                            <p className="text-white/40 text-lg leading-relaxed font-medium">
                                Conexão de baixa latência estabelecida. Todas as ordens da conta Master de {masterStats.traderName} estão sendo replicadas em sua conta agora.
                            </p>
                        </div>
                        
                        {masterStats.isActive && (
                            <div className="p-8 bg-green-500/10 rounded-[2.5rem] border border-green-500/30 space-y-4 animate-in slide-in-from-top-6 duration-1000">
                                <div className="flex items-center justify-center gap-4">
                                    <Radio className="h-6 w-6 text-green-500 animate-pulse" />
                                    <span className="text-sm font-black text-green-500 uppercase tracking-[0.3em]">LIVE CONNECTION</span>
                                </div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter">CONTA CONECTADA, AGUARDANDO PRÓXIMO GATILHO</h4>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-10 bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">LATÊNCIA</span>
                                <span className="text-2xl font-mono text-green-500 font-black tracking-tighter">12ms</span>
                            </div>
                            <div className="h-12 w-px bg-white/10" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[0.6rem] font-black text-white/20 uppercase tracking-widest">STATUS</span>
                                <span className="text-2xl font-mono text-green-500 font-black tracking-tighter">CONECTADO</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_6_REJECTED' && (
                <div className="max-w-md w-full text-center space-y-12 z-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-32 h-32 bg-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <Lock className="h-16 w-16 text-red-500" />
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-5xl font-headline font-black uppercase text-white tracking-tighter">ID Rejeitado</h2>
                            <p className="text-white/40 text-lg leading-relaxed font-medium">
                                O ID informado não está vinculado à nossa rede de sincronização master. Certifique-se de ter criado a conta pelo link oficial abaixo.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <Button asChild className="w-full h-20 bg-white text-black font-black uppercase tracking-tighter text-xl rounded-2xl hover:bg-white/90">
                                <a href={affiliateLink} target="_blank">CRIAR CONTA OFICIAL</a>
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="w-full h-12 text-[0.65rem] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white/60">Tentar outro identificador</Button>
                        </div>
                    </div>
                </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { icon: ShieldCheck, title: "100% Automático", desc: "As ordens abrem sozinhas em sua conta via Handshake de baixa latência." },
               { icon: TrendingUp, title: "Gestão Mestre", desc: "O cluster replica o risco proporcional da nossa conta profissional em tempo real." },
               { icon: History, title: "Frequência HFT", desc: "Aproveite enquanto o sistema é gratuito para novos membros do cluster elite." },
             ].map((b, i) => (
                <div key={i} className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 transform transition-transform hover:-translate-y-2 duration-300">
                    <div className="p-4 bg-primary/10 rounded-2xl w-fit border border-primary/20"><b.icon className="h-8 w-8 text-primary" /></div>
                    <div className="space-y-3">
                        <h4 className="text-lg font-black uppercase tracking-tight text-white">{b.title}</h4>
                        <p className="text-sm text-white/30 font-medium leading-relaxed uppercase tracking-wider">{b.desc}</p>
                    </div>
                </div>
             ))}
          </div>
        </div>
      </main>

      <footer className="mt-20 pb-20 text-center space-y-10 px-8">
          <Logo size={40} showText={false} className="mx-auto opacity-20" />
          <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.5em] text-white/10 leading-relaxed">
                Terminal de Alta Frequência • Estratégia Chinesa V.2026 • Encrypt Mode Active
              </p>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/5 max-w-2xl mx-auto leading-relaxed">
                Aviso Legal: O Copy Trading utiliza algoritmos de espelhamento que requerem margem de garantia proporcional para operações de alta frequência. Opere com responsabilidade.
              </p>
          </div>
      </footer>
    </div>
  );
}
