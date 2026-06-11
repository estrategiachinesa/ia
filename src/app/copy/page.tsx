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
  ShieldAlert
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
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';

type ConnectionStep = 'STEP_1_REGISTER' | 'STEP_2_FORM' | 'STEP_3_PENDING' | 'STEP_4_SUCCESS' | 'STEP_5_ERROR_LIQUIDITY';

export default function CopyPage() {
  const { config, isConfigLoading } = useAppConfig();
  const { firestore } = useFirebase();
  const router = useRouter();
  
  const [formData, setFormData] = useState({ name: '', email: '', brokerId: '' });
  const [step, setStep] = useState<ConnectionStep>('STEP_1_REGISTER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Pedidos de verificação (cliente só vê o seu pelo ID guardado localmente)
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
        else if (myRequest.status === 'APPROVED') setStep('STEP_4_SUCCESS');
        else if (myRequest.status === 'ERROR_LIQUIDITY') setStep('STEP_5_ERROR_LIQUIDITY');
    }
  }, [myRequest]);

  // Kill switch check
  useEffect(() => {
    if (!isConfigLoading && config?.pages?.copy === false) {
      router.replace('/');
    }
  }, [config, isConfigLoading, router]);

  const formatCurrency = (val: any) => {
      const num = typeof val === 'number' ? val : (parseFloat(String(val).replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0);
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatShortDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
      } catch (e) {
          return dateStr;
      }
  };

  const profitTodayRaw = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];
    const results = config?.copyResults || [];
    return results
      .filter((r: any) => r.date === todayIso)
      .reduce((acc: number, curr: any) => acc + curr.netChange, 0);
  }, [config?.copyResults]);

  const masterStats = {
    traderName: config?.copyTraderName || "Trader Chines",
    profilePic: config?.copyProfilePicUrl || "https://picsum.photos/seed/trader/200/200",
    instagram: config?.copyInstagramUrl || "#",
    tiktok: config?.copyTikTokUrl || "#",
    telegram: config?.copyTelegramUrl || "#",
    balance: formatCurrency(config?.copyMasterBalance ?? 245892.10),
    initialBalance: formatCurrency(config?.copyInitialBalance ?? 240000.00),
    profitToday: (profitTodayRaw >= 0 ? '+ ' : '') + formatCurrency(profitTodayRaw),
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
    if (!formData.name || !formData.email || formData.brokerId.length < 5 || !firestore) return;
    
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

  if (isConfigLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-body pb-20">
      <div className="fixed inset-0 -z-10 grid-bg opacity-20" />
      
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <Logo size={32} />
        <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest px-3 py-1">
          Copy System V.2026
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
                        profitTodayRaw < 0 ? "bg-red-500/5 border-red-500/10" : "bg-green-500/5 border-green-500/10"
                    )}>
                        <p className={cn("text-[0.6rem] font-bold uppercase", profitTodayRaw < 0 ? "text-red-500" : "text-green-500")}>Lucro Hoje</p>
                        <p className={cn("text-lg font-black font-mono tracking-tighter", profitTodayRaw < 0 ? "text-red-500" : "text-green-500")}>{masterStats.profitToday}</p>
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
                    <Progress value={parseFloat(masterStats.winRate) || 0} className="h-2 bg-white/5" indicatorClassName="bg-green-500" />
                </div>
            </CardContent>
          </Card>

          {/* HISTÓRICO REAL */}
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
                                    <span className="text-sm font-black font-mono leading-tight text-white">{trade.time}</span>
                                    <span className="text-[0.6rem] font-bold opacity-30 uppercase">{formatShortDate(trade.date)}</span>
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
                                        trade.result === 'WIN' ? "text-green-500" : "text-red-500"
                                    )}>
                                        {trade.result}
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
                                    trade.result === 'WIN' ? "bg-green-500/10" : "bg-red-500/10"
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
                        <h2 className="text-2xl font-headline font-black uppercase text-white">Sincronização de Protocolo</h2>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                            O Handshake técnico exige a validação do seu ID de usuário.
                        </p>
                    </div>

                    <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                            <Label className="text-[0.6rem] font-black uppercase opacity-40 ml-2">Nome do Titular</Label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Seu nome completo..." className="pl-12 h-12 bg-black/40 border-white/5 rounded-xl" />
                            </div>
                        </div>
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
                            disabled={!formData.name || !formData.email || formData.brokerId.length < 5 || isSubmitting}
                            className="w-full h-14 bg-primary text-black font-black uppercase tracking-tighter text-sm rounded-xl shadow-lg mt-2"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SOLICITAR HANDSHAKE'}
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
                            <ShieldCheck className="h-16 w-16 text-primary animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black uppercase text-white">Escaneando Registro</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            O cluster de cópia está validando o Handshake com o ID: <span className="text-primary font-mono">{myRequest?.brokerId || formData.brokerId}</span>. O espelhamento será ativado assim que a integridade dos dados for confirmada.
                        </p>
                        <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                            <p className="text-[0.6rem] font-black text-primary uppercase tracking-widest animate-pulse">Status: AGUARDANDO AUTORIZAÇÃO DO PROTOCOLO MASTER</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_4_SUCCESS' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in fade-in zoom-in-95">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-headline font-black uppercase text-white">Sincronização Ativa!</h2>
                        <p className="text-muted-foreground text-sm">
                            Conexão de baixa latência estabelecida. Todas as ordens da conta Master de {masterStats.traderName} estão sendo replicadas agora.
                        </p>
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

            {step === 'STEP_5_ERROR_LIQUIDITY' && (
                <div className="max-w-xl w-full space-y-8 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-red-600/10 border border-red-500/20 p-8 rounded-[2rem] text-center space-y-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                            <ShieldAlert className="h-10 w-10 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-headline font-black uppercase text-white">Erro: Margem de Segurança</h2>
                            <p className="text-red-400/80 text-xs font-black uppercase tracking-widest">Protocolo de Liquidez Proporcional</p>
                        </div>
                        
                        <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-left space-y-4">
                            <p className="text-sm text-zinc-300 leading-relaxed">
                                Para sincronizar com a conta Master de {masterStats.traderName} ({masterStats.balance}), o algoritmo exige uma **Margem de Segurança Mínima**. Devido ao alto valor das operações, a corretora requer liquidez na sua conta para garantir a execução das ordens sem rejeição.
                            </p>
                            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                <span className="text-xs font-bold uppercase text-zinc-500">Liquidez Requerida:</span>
                                <span className="text-lg font-black text-white">R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button 
                                asChild
                                className="w-full h-16 bg-white text-black font-black uppercase tracking-tighter text-lg rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl"
                            >
                                <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                                    ATIVAR MARGEM DE SEGURANÇA <CircleDollarSign className="ml-2 h-6 w-6" />
                                </a>
                            </Button>
                            <p className="text-[0.6rem] font-bold text-muted-foreground uppercase opacity-40">O sistema re-sincronizará automaticamente após a detecção de liquidez.</p>
                        </div>
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
            Aviso Legal: O Copy Trading utiliza algoritmos de espelhamento que requerem margem de garantia de R$ {(config?.copyMinLiquidity || 1000).toLocaleString('pt-BR')} para operações de alta frequência.
          </p>
      </footer>
    </div>
  );
}
