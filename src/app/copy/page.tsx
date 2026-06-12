
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
  MessageSquare,
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
    if (!dateStr || !timeStr) return '--/--/-- --:--';
    try {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y.substring(2)} ${timeStr}`;
    } catch (e) {
        return `${dateStr} ${timeStr}`;
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

  const affiliateLink = "https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=copy";

  const handleRequestVerification = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        alert("E-mail válido necessário");
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
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-body pb-20">
      <div className="fixed inset-0 -z-10 grid-bg opacity-20" />
      
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <Logo size={32} />
        <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest px-3 py-1">
          Copy Protocol V.2026
        </Badge>
      </header>

      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl">
        
        {/* LEFT: MASTER ACCOUNT STATS */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card/40 border-white/5 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden shine-effect">
            <div className="h-1.5 bg-primary w-full" />
            <CardContent className="pt-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 transition-opacity" />
                        <div className="relative h-24 w-24 rounded-full border-2 border-white/10 overflow-hidden bg-black">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover" unoptimized />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[0.65rem] font-black uppercase tracking-[0.3em] opacity-40">Master Trader</h3>
                        <p className="text-2xl font-headline font-black text-white uppercase tracking-tighter">{masterStats.traderName}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <a href={masterStats.instagram} target="_blank" className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-primary hover:text-black transition-all">
                            <Instagram className="h-4 w-4" />
                        </a>
                        <a href={masterStats.tiktok} target="_blank" className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-primary hover:text-black transition-all">
                            <MessageSquare className="h-4 w-4" />
                        </a>
                        <a href={masterStats.telegram} target="_blank" className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-primary hover:text-black transition-all">
                            <Send className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                        <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">Saldo Inicial</p>
                        <p className="text-sm font-black font-mono text-white opacity-60">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                        <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">Saldo Atual</p>
                        <p className="text-lg font-black font-mono text-white tracking-tighter">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-4 rounded-2xl border flex justify-between items-center",
                        lastTradeResult < 0 ? "bg-red-500/5 border-red-500/10" : (lastTradeResult === 0 ? "bg-zinc-500/5 border-zinc-500/10" : "bg-green-500/5 border-green-500/10")
                    )}>
                        <p className={cn("text-[0.6rem] font-bold uppercase", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-500" : "text-green-500"))}>Lucro Hoje</p>
                        <p className={cn("text-lg font-black font-mono tracking-tighter", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-500" : "text-green-500"))}>{masterStats.profitToday}</p>
                    </div>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[0.6rem] font-black uppercase opacity-40 flex items-center gap-1.5"><Trophy className="h-3 w-3" /> Placar Acumulado</span>
                        <Badge variant="outline" className={cn(
                            "text-[0.5rem] border-none font-black animate-pulse",
                            masterStats.isActive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        )}>
                            {masterStats.isActive ? "LIVE" : "OFFLINE"}
                        </Badge>
                    </div>
                    <div className="flex justify-center items-center gap-6">
                         <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-green-500">{scoreboard.wins}</span>
                            <span className="text-[0.5rem] font-bold opacity-30 uppercase">Wins</span>
                         </div>
                         <div className="h-8 w-px bg-white/10" />
                         <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-red-500">{scoreboard.losses}</span>
                            <span className="text-[0.5rem] font-bold opacity-30 uppercase">Losses</span>
                         </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[0.7rem] font-black uppercase opacity-40">Assertividade Global</span>
                        <span className="text-sm font-black text-green-500">{masterStats.winRate}</span>
                    </div>
                    <Progress value={parseFloat(masterStats.winRate) || 0} indicatorClassName="bg-green-500" className="h-2 bg-white/5" />
                </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 border-white/5 rounded-3xl overflow-hidden hidden md:block">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Histórico de Trading
                </CardTitle>
             </CardHeader>
             <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                    {masterStats.results.length > 0 ? masterStats.results.map((trade: any) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[0.7rem] font-black font-mono leading-tight text-white/90">
                                        {formatFullDate(trade.date, trade.time)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CurrencyFlags asset={trade.asset} />
                                    <span className="text-sm font-black text-zinc-100 uppercase tracking-tight">{trade.asset}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className={cn(
                                        "text-[0.6rem] font-black uppercase tracking-widest",
                                        trade.result === 'WIN' ? "text-green-500" : (trade.result === 'LOSS' ? "text-red-500" : "text-zinc-500")
                                    )}>
                                        {trade.result}
                                    </span>
                                    <span className={cn(
                                        "text-[0.7rem] font-black font-mono leading-none my-0.5",
                                        trade.netChange > 0 ? "text-green-500" : (trade.netChange < 0 ? "text-red-500" : "text-zinc-500")
                                    )}>
                                        {trade.netChange > 0 ? '+' : ''}{formatCurrency(trade.netChange)}
                                    </span>
                                    <span className={cn(
                                        "text-[0.5rem] font-bold opacity-40 uppercase",
                                        trade.direction === 'CALL' ? "text-green-500/60" : "text-red-500/60"
                                    )}>
                                        {trade.direction}
                                    </span>
                                </div>
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-transform group-hover:scale-110",
                                    trade.result === 'WIN' ? "bg-green-500/10" : (trade.result === 'LOSS' ? "bg-red-500/10" : "bg-zinc-500/10")
                                )}>
                                    {trade.direction === 'CALL' ? (
                                        <ArrowUpCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <ArrowDownCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-8 text-[0.6rem] font-black uppercase opacity-30 tracking-widest">Aguardando operações...</p>
                    )}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* RIGHT: SYNC CONSOLE */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/40 border-white/5 shadow-2xl backdrop-blur-xl rounded-3xl p-8 min-h-[550px] flex flex-col items-center justify-center relative overflow-hidden">
            
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cpu className="w-64 h-64 text-primary" />
            </div>

            {step === 'STEP_1_REGISTER' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 animate-pulse">
                            <Zap className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-3xl font-headline font-black uppercase tracking-tighter text-white">Conexão Master</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Para espelhar as operações do Master {masterStats.traderName}, sua conta deve obrigatoriamente estar vinculada ao nosso cluster de alta frequência.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button asChild className="w-full h-16 bg-primary text-black font-black uppercase tracking-tighter text-lg shadow-xl shadow-primary/20 rounded-2xl hover:scale-[1.02] transition-all">
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                <ArrowRight className="mr-2 h-5 w-5" /> VINCULAR MINHA CONTA
                            </a>
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setStep('STEP_2_FORM')}
                            className="w-full h-14 border-white/10 text-xs font-black uppercase tracking-widest"
                        >
                            JÁ POSSUO CONTA (SINCRONIZAR ID)
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_2_FORM' && (
                <div className="max-w-md w-full text-center space-y-6 z-10 animate-in fade-in zoom-in-95">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-headline font-black uppercase text-white">Protocolo Handshake</h2>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                            Inicie o processo informando seu registro técnico.
                        </p>
                    </div>

                    <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                            <Label className="text-[0.6rem] font-black uppercase opacity-40 ml-2">E-mail Registrado</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" className="pl-12 h-12 bg-black/40 border-white/5 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[0.6rem] font-black uppercase opacity-40 ml-2">ID de Usuário (Corretora)</Label>
                            <div className="relative">
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                                <Input value={formData.brokerId} onChange={e => setFormData({...formData, brokerId: e.target.value.replace(/\D/g, '')})} placeholder="ID da Exnova" className="pl-12 h-12 bg-black/40 border-white/5 rounded-xl font-mono" />
                            </div>
                        </div>

                        <Button 
                            onClick={handleRequestVerification}
                            disabled={!formData.email || formData.brokerId.length < 5 || isSubmitting}
                            className="w-full h-14 bg-primary text-black font-black uppercase tracking-tighter text-sm rounded-xl shadow-lg mt-2"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SOLICITAR CONEXÃO'}
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('STEP_1_REGISTER')} className="w-full text-[0.6rem] font-black uppercase opacity-30">Voltar</Button>
                    </div>
                </div>
            )}

            {step === 'STEP_3_PENDING' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in zoom-in-95">
                    <div className="relative h-40 w-40 mx-auto">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Clock className="h-16 w-16 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black uppercase text-white">Escaneando Registro</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            O cluster de cópia está validando o Handshake com o ID: <span className="text-primary font-mono">{myRequest?.brokerId || formData.brokerId}</span>. A liberação ocorrerá assim que a integridade dos dados for confirmada pela equipe.
                        </p>
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-[0.6rem] font-black text-primary uppercase tracking-widest animate-pulse">Status: AGUARDANDO AUTORIZAÇÃO DO PROTOCOLO</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_4_AWAITING_DEPOSIT' && (
                <div className="max-w-xl w-full space-y-8 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {!myRequest?.name ? (
                        <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] text-center space-y-6">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                                <UserCheck className="h-10 w-10 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-headline font-black uppercase text-white">ID VALIDADO!</h2>
                                <p className="text-primary text-xs font-black uppercase tracking-widest">Complete seu perfil de sincronização</p>
                            </div>
                            <div className="space-y-4 text-left">
                                <div className="space-y-1.5">
                                    <Label className="text-[0.6rem] font-black uppercase opacity-40 ml-2">Seu Nome Completo</Label>
                                    <Input 
                                        value={nameData} 
                                        onChange={e => setNameData(e.target.value)} 
                                        placeholder="Para o certificado de cópia..." 
                                        className="h-14 bg-black/40 border-white/5 rounded-xl text-lg"
                                    />
                                </div>
                                <Button 
                                    onClick={handleUpdateProfile}
                                    disabled={!nameData || isUpdatingName}
                                    className="w-full h-14 bg-white text-black font-black uppercase tracking-tighter"
                                >
                                    {isUpdatingName ? <Loader2 className="h-5 w-5 animate-spin" /> : 'GERAR PROTOCOLO'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/30">
                                <ShieldCheck className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-headline font-black uppercase text-white">Protocolo Ativo para {myRequest.name}</h2>
                                <p className="text-primary text-xs font-black uppercase tracking-widest">Ativação de Margem Requerida</p>
                            </div>
                            
                            <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-left space-y-4">
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    Para sincronizar com as ordens de alta frequência do Master Trader ({masterStats.traderName}), o algoritmo exige uma **Margem de Segurança Proporcional**. Devido ao alto valor das operações (entradas de R$ 1.000+), a corretora requer liquidez mínima em sua conta para garantir o espelhamento sem rejeição.
                                </p>
                                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <span className="text-xs font-bold uppercase text-zinc-500">Liquidez Mínima Requerida:</span>
                                    <span className="text-lg font-black text-white">R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button 
                                    asChild
                                    className="w-full h-16 bg-primary text-black font-black uppercase tracking-tighter text-lg rounded-2xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20"
                                >
                                    <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                        ATIVAR MARGEM E CONECTAR AGORA <CircleDollarSign className="ml-2 h-6 w-6" />
                                    </a>
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={handleConfirmDeposit}
                                    disabled={isConfirmingDeposit}
                                    className="w-full h-14 border-white/10 text-xs font-black uppercase tracking-widest rounded-2xl"
                                >
                                    {isConfirmingDeposit ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} JÁ FIZ O DEPÓSITO
                                </Button>
                                <p className="text-[0.6rem] font-bold text-muted-foreground uppercase opacity-40">O sistema liberará a sincronização automaticamente após a detecção do aporte.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'STEP_7_VERIFYING_DEPOSIT' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                        <RefreshCcw className="h-12 w-12 text-cyan-500 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-headline font-black uppercase text-white">Validando Aporte</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            O cluster de segurança recebeu o seu sinal de depósito. Estamos a verificar junto à rede blockchain da corretora a integridade da margem para o ID <span className="text-primary font-mono">{myRequest?.brokerId}</span>.
                        </p>
                        <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 flex items-center justify-center gap-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="text-[0.6rem] font-black text-cyan-500 uppercase tracking-[0.2em]">Status: VERIFICANDO LIQUIDEZ...</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_5_SUCCESS' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in fade-in zoom-in-95">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-headline font-black uppercase text-white">Sincronização Ativa!</h2>
                        <p className="text-muted-foreground text-sm">
                            Conexão de baixa latência estabelecida. Todas as ordens da conta Master de {masterStats.traderName} estão sendo replicadas em sua conta agora.
                        </p>
                        
                        {masterStats.isActive && (
                            <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/30 space-y-2 animate-in slide-in-from-top-4 duration-1000">
                                <div className="flex items-center justify-center gap-2">
                                    <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                                    <span className="text-xs font-black text-green-500 uppercase tracking-widest">EXECUTANDO AGORA</span>
                                </div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tighter">CONTA CONECTADA NO MOMENTO, TRADER EM ANÁLISE</h4>
                                <p className="text-[0.55rem] text-green-500/60 font-bold uppercase">Aguarde a abertura da próxima ordem automática.</p>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[0.5rem] font-bold opacity-40 uppercase">Latência</span>
                                <span className="text-xs font-mono text-green-500">12ms</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[0.5rem] font-bold opacity-40 uppercase">Status</span>
                                <span className="text-xs font-mono text-green-500">CONECTADO</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_6_REJECTED' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in fade-in zoom-in-95">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                        <Lock className="h-12 w-12 text-red-500" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-headline font-black uppercase text-white">ID Não Reconhecido</h2>
                        <p className="text-muted-foreground text-sm">
                            O ID informado não está vinculado à nossa rede de sincronização master. Certifique-se de ter criado a conta pelo link oficial abaixo.
                        </p>
                        <Button asChild className="w-full h-12 bg-white text-black font-black uppercase">
                            <a href={affiliateLink} target="_blank">CRIAR CONTA OFICIAL</a>
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('STEP_2_FORM')} className="text-xs font-bold opacity-40">TENTAR OUTRO ID</Button>
                    </div>
                </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {[
               { icon: ShieldCheck, title: "100% Automático", desc: "As ordens abrem sozinhas em sua conta via Handshake." },
               { icon: TrendingUp, title: "Gestão Master", desc: "Copiamos o risco proporcional da nossa conta profissional." },
               { icon: History, title: "Sem Mensalidade", desc: "Aproveite enquanto o sistema é gratuito para membros do cluster." },
             ].map((b, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                    <b.icon className="h-6 w-6 text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-tight text-white">{b.title}</h4>
                    <p className="text-[0.65rem] text-muted-foreground font-bold leading-relaxed">{b.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center space-y-4 px-6 opacity-30">
          <Logo size={24} showText={false} className="mx-auto" />
          <p className="text-[0.55rem] font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
            Aviso Legal: O Copy Trading utiliza algoritmos de espelhamento que requerem margem de garantia proporcional para operações de alta frequência.
          </p>
      </footer>
    </div>
  );
}
