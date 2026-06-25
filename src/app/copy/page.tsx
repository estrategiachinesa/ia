'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  X,
  Mail,
  Key,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowDown,
  Play,
  Pause,
  Power,
  LogIn,
  LogOut,
  MessageSquare,
  UserPlus,
  ArrowUpRight,
  Info,
  Bot,
  Sparkles,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useAppConfig } from '@/firebase/config-provider';
import { useRouter } from 'next/navigation';
import { CurrencyFlags } from '@/components/app/currency-flags';
import Image from 'next/image';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, updateDoc, limit, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type ConnectionStep = 'STEP_ID_CHECK' | 'STEP_REGISTRATION' | 'STEP_LOGIN' | 'STEP_DASHBOARD' | 'STEP_UNAUTHORIZED';

export default function CopyPage() {
  const { config, isConfigLoading } = useAppConfig();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [brokerIdInput, setBrokerIdInput] = useState('');
  const [step, setStep] = useState<ConnectionStep>('STEP_ID_CHECK');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
  const [terminalSession, setTerminalSession] = useState<any>(null);
  const [serverTerminalData, setServerTerminalData] = useState<any>(null);

  const [regData, setRegData] = useState({
      name: '',
      email: '',
      telegram: '',
      password: '',
      confirmPassword: ''
  });

  const [loginData, setLoginData] = useState({
      password: ''
  });

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
      localStorage.removeItem('copy_terminal_session');
      setTerminalSession(null);
      setServerTerminalData(null);
      setStep('STEP_ID_CHECK');
      setBrokerIdInput('');
      setLoginData({ password: '' });
      setRegData({ name: '', email: '', telegram: '', password: '', confirmPassword: '' });
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('copy_terminal_session');
    if (savedSession) {
        try {
            const data = JSON.parse(savedSession);
            setTerminalSession(data);
            setStep('STEP_DASHBOARD');
        } catch (e) {
            localStorage.removeItem('copy_terminal_session');
        }
    }
  }, []);

  useEffect(() => {
      if (terminalSession?.id && firestore) {
          const unsub = onSnapshot(doc(firestore, 'copyRequests', terminalSession.id), (snap) => {
              if (snap.exists()) {
                  setServerTerminalData(snap.data());
              } else {
                  // O terminal foi removido pelo administrador no painel
                  handleLogout();
                  toast({ 
                      variant: 'destructive', 
                      title: 'Terminal Desconectado', 
                      description: 'Sua conexão foi encerrada pelo administrador.' 
                  });
              }
          });
          return () => unsub();
      }
  }, [terminalSession?.id, firestore, handleLogout, toast]);

  useEffect(() => {
    if (!isConfigLoading && config?.pages?.copy === false) {
      router.replace('/');
    }
  }, [config, isConfigLoading, router]);

  const totalProfit = useMemo(() => {
    const results = config?.copyResults || [];
    return results.reduce((acc: number, curr: any) => acc + curr.netChange, 0);
  }, [config?.copyResults]);

  const masterStats = {
    traderName: config?.copyTraderName || "Trader Chines",
    profilePic: config?.copyProfilePicUrl || "https://64.media.tumblr.com/0a29dad9d6f04fe39aca48bdf61b5557/a07313c3fc2b7863-a1/s1280x1920/3cfd53145ec0d969f9d236011f0a0234e188b87e.pnj",
    instagram: config?.copyInstagramUrl || "#",
    tiktok: config?.copyTikTokUrl || "#",
    telegram: config?.copyTelegramUrl || "https://t.me/Trader_Chines",
    balance: (config?.copyMasterBalance ?? 245892.10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    initialBalance: (config?.copyInitialBalance ?? 240000.00).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    profitTotal: (totalProfit >= 0 ? '+ ' : '') + (totalProfit).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
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

  const handleCheckId = async () => {
      if (!brokerIdInput || !firestore) return;
      
      if (brokerIdInput.length < 8) {
          toast({ variant: 'destructive', title: 'ID muito curto', description: 'O ID da corretora deve ter no mínimo 8 números.' });
          return;
      }

      setIsVerifying(true);
      try {
          const q = query(
              collection(firestore, 'copyRequests'),
              where('brokerId', '==', brokerIdInput),
              limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
              const docSnap = snap.docs[0];
              const reqData = docSnap.data();
              setActiveRequestId(docSnap.id);
              
              if (reqData.status === 'REGISTERED') {
                  setStep('STEP_LOGIN');
              } else if (reqData.status === 'AUTHORIZED') {
                  setStep('STEP_REGISTRATION');
              } else {
                  setStep('STEP_UNAUTHORIZED');
              }
          } else {
              setStep('STEP_UNAUTHORIZED');
          }
      } catch (e) { 
          console.error(e);
          toast({ variant: 'destructive', title: 'Erro de conexão' });
      } finally { 
          setIsVerifying(false); 
      }
  };

  const handleLogin = async () => {
      if (!firestore || !activeRequestId) return;
      if (!loginData.password) {
          toast({ variant: 'destructive', title: 'Senha Obrigatória' });
          return;
      }
      setIsLoggingIn(true);
      try {
          const snap = await getDocs(query(collection(firestore, 'copyRequests'), where('brokerId', '==', brokerIdInput), limit(1)));
          
          if (!snap.empty) {
              const data = snap.docs[0].data();
              if (data.password === loginData.password) {
                  const session = { id: activeRequestId, brokerId: brokerIdInput, name: data.name };
                  setTerminalSession(session);
                  localStorage.setItem('copy_terminal_session', JSON.stringify(session));
                  setStep('STEP_DASHBOARD');
                  toast({ title: 'Terminal Conectado', description: 'Sincronização HFT ativa.' });
              } else {
                  toast({ variant: 'destructive', title: 'Senha Incorreta' });
              }
          }
      } catch (e) {
          toast({ variant: 'destructive', title: 'Erro no login' });
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handleRegister = async () => {
      if (!firestore || !activeRequestId) return;
      if (!regData.name || !regData.email || !regData.password) {
          toast({ variant: 'destructive', title: 'Campos Obrigatórios' });
          return;
      }
      if (regData.password.length < 6) {
          toast({ variant: 'destructive', title: 'Senha muito curta (mín. 6)' });
          return;
      }
      if (regData.password !== regData.confirmPassword) {
          toast({ variant: 'destructive', title: 'Senhas não coincidem' });
          return;
      }
      setIsRegistering(true);
      try {
          const updateData = {
              status: 'REGISTERED',
              registeredAt: serverTimestamp(),
              name: regData.name,
              email: regData.email.trim(),
              telegram: regData.telegram,
              password: regData.password,
              hasBalance: false
          };

          await updateDoc(doc(firestore, 'copyRequests', activeRequestId), updateData);

          const session = { id: activeRequestId, brokerId: brokerIdInput, name: regData.name };
          setTerminalSession(session);
          localStorage.setItem('copy_terminal_session', JSON.stringify(session));
          setStep('STEP_DASHBOARD');
          setIsDepositModalOpen(true);
          toast({ title: 'Terminal Ativado!' });
      } catch (e: any) { 
          toast({ variant: 'destructive', title: 'Erro no cadastro' });
      } finally { setIsRegistering(false); }
  };

  const handleToggleSync = () => {
      if (!hasInteracted || (!isSyncActive && serverTerminalData?.hasBalance === false)) {
          setIsDepositModalOpen(true);
          setHasInteracted(true);
          return;
      }
      setIsSyncActive(!isSyncActive);
  };

  const AnalyzerCTA = () => (
      <div 
          onClick={() => router.push('/vip')}
          className="w-full bg-gradient-to-r from-purple-500/10 via-purple-500/20 to-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-purple-500/40 transition-all group overflow-hidden relative shadow-2xl"
      >
          <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="h-10 w-10 text-purple-400" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform shadow-inner">
                  <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-left">
                  <p className="text-[0.6rem] font-black text-purple-400 uppercase tracking-[0.2em] mb-0.5">TECNOLOGIA DE PONTA</p>
                  <p className="text-[0.7rem] md:text-xs font-bold text-white/80 leading-tight">Resultados gerados pela IA da Estratégia Chinesa</p>
              </div>
          </div>
          <div className="bg-purple-500/20 p-1.5 rounded-full group-hover:bg-purple-500 group-hover:text-black transition-all">
              <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
          </div>
      </div>
  );

  if (isConfigLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[100dvh] bg-[#050505] text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at(50%,50%),_#0e0e0e_0%,_#050505_100%)]" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-[0.03]" />
      
      <header className="h-14 lg:h-16 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-2xl shrink-0 z-50">
        <Logo size={32} isPremium={masterStats.isActive} />
        <div className="flex items-center gap-3">
             {terminalSession && (
                 <Button variant="ghost" size="sm" onClick={() => { handleLogout(); toast({ title: 'Terminal Desconectado' }); }} className="h-8 px-3 rounded-full border border-white/10 text-[0.6rem] font-black uppercase text-white/40 hover:text-white hover:bg-white/5">
                    <LogOut className="h-3 w-3 mr-2" /> Sair
                 </Button>
             )}
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className={cn("w-1.5 h-1.5 rounded-full", masterStats.isActive ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-red-500")} />
                <span className={cn("text-[0.55rem] font-black uppercase tracking-[0.2em] transition-colors duration-500", masterStats.isActive ? "text-green-500" : "text-red-500")}>
                    {masterStats.isActive ? "COPY ONLINE" : "OFFLINE"}
                </span>
             </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:p-4 lg:max-w-[1600px] lg:mx-auto w-full no-scrollbar">
        
        <div className="lg:h-full flex flex-col p-3 lg:p-0 lg:col-span-3 min-h-0">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-3xl rounded-[2rem] overflow-hidden flex flex-col h-full">
            <div className={cn("h-1 w-full transition-colors duration-1000", masterStats.isActive ? "bg-green-500" : "bg-red-500")} />
            <div className="flex-grow flex flex-col justify-between p-5 lg:p-6">
                <div className="flex flex-col items-center text-center space-y-1 lg:space-y-3">
                    <div className="relative">
                        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full border-[3px] border-white/10 overflow-hidden bg-black shadow-xl">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover" unoptimized />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <h3 className={cn("text-[0.7rem] font-black uppercase tracking-[0.4em] transition-colors duration-500", masterStats.isActive ? "text-green-500/70" : "text-primary/70")}>GESTOR</h3>
                        <p className="text-base lg:text-lg font-headline font-black text-white uppercase tracking-tighter">{masterStats.traderName}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 lg:gap-2">
                        {[
                            { icon: Instagram, href: masterStats.instagram },
                            { icon: () => (
                                <svg fill="currentColor" viewBox="0 0 448 512" className="h-4 w-4">
                                    <path d="M448 209.91a210.06 210.06 0 0 1 -122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                                </svg>
                            ), href: masterStats.tiktok },
                            { icon: Send, href: masterStats.telegram }
                        ].map((social, i) => (
                            <a key={i} href={social.href} target="_blank" className="p-1.5 lg:p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                                <social.icon className="h-3 w-3 lg:h-3.5 lg:h-3.5" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="space-y-1 lg:space-y-2 my-3">
                    <div className="p-2.5 lg:p-2.5 bg-white/[0.02] rounded-xl border border-white/5 flex justify-between items-center">
                        <p className="text-[0.65rem] font-black text-white/50 uppercase tracking-[0.2em]">Saldo Inicial</p>
                        <p className="text-[0.65rem] font-black font-mono text-white/70">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-3 lg:p-3.5 bg-white/[0.05] rounded-xl border border-white/10 flex justify-between items-center shadow-2xl">
                        <p className="text-[0.65rem] font-black text-white/60 uppercase tracking-[0.2em]">Saldo Atual</p>
                        <p className="text-base lg:text-lg font-black font-mono text-white tracking-tighter">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-3 lg:p-3.5 rounded-xl border flex justify-between items-center",
                        totalProfit < 0 ? "bg-red-500/5 border-red-500/10" : (totalProfit === 0 ? "bg-white/5 border-white/10" : "bg-green-500/5 border-green-500/10")
                    )}>
                        <p className={cn("text-[0.65rem] font-black uppercase tracking-[0.2em]", totalProfit < 0 ? "text-red-500/80" : (totalProfit === 0 ? "text-white/40" : "text-green-500/80"))}>Lucro Total</p>
                        <p className={cn("text-base lg:text-lg font-black font-mono tracking-tighter", totalProfit < 0 ? "text-red-500" : (totalProfit === 0 ? "text-zinc-600" : "text-green-500"))}>{masterStats.profitTotal}</p>
                    </div>
                </div>

                <div className="p-4 lg:p-4 bg-black/60 rounded-[1.5rem] border border-white/10 space-y-2 lg:space-y-3 shadow-inner mt-auto">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Trophy className="h-3.5 w-3.5 text-primary" />
                             <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/50">Placar Mensal</span>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <div className="flex flex-col items-center bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-lg lg:text-xl font-black text-green-500">{scoreboard.wins}</span>
                            <span className="text-[0.5rem] font-bold text-white/40 uppercase">Wins</span>
                         </div>
                         <div className="flex flex-col items-center bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-lg lg:text-xl font-black text-red-500">{scoreboard.losses}</span>
                            <span className="text-[0.5rem] font-bold text-white/40 uppercase">Losses</span>
                         </div>
                    </div>
                    <div className="pt-0.5">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[0.65rem] font-black uppercase text-white/50 tracking-[0.1em]">Assertividade IA</span>
                            <span className="text-[0.95rem] font-black text-green-500 font-mono">{masterStats.winRate}</span>
                        </div>
                        <Progress value={parseFloat(masterStats.winRate)} className="h-1 bg-white/5" indicatorClassName="bg-green-500" />
                    </div>
                </div>
            </div>
          </Card>
        </div>

        <div className="lg:h-full flex flex-col p-4 lg:p-0 lg:col-span-4 min-h-0" id="history">
          <Card className="bg-card/30 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl backdrop-blur-xl">
             <CardHeader className="p-4 lg:p-6 pb-3 shrink-0 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-[0.7rem] font-black uppercase tracking-[0.4em] text-white/60 flex items-center gap-3">
                    <Activity className="h-3.5 w-3.5 text-primary/70" />
                    Fluxo HFT Live
                </CardTitle>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             </CardHeader>
             <CardContent className="p-3 lg:p-4 space-y-2 overflow-y-auto no-scrollbar flex-grow bg-black/40">
                {masterStats.results.length > 0 ? masterStats.results.map((trade: any) => (
                    <div key={trade.id} className="grid grid-cols-12 items-center p-3 bg-white/[0.02] rounded-xl border border-white/5 transition-all hover:bg-white/[0.06]">
                        <div className="col-span-3 flex flex-col justify-center">
                             <span className="text-[0.85rem] font-black text-white/80 font-mono leading-none">
                                {trade.time}
                             </span>
                             <span className="text-[0.75rem] font-black text-white/20 font-mono leading-none mt-1">
                                {(() => {
                                    try {
                                        const parts = trade.date.split('-');
                                        const day = parts[2].padStart(2, '0');
                                        const monthIdx = parseInt(parts[1]) - 1;
                                        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                        return `${day} ${months[monthIdx]}`;
                                    } catch(e) { return '-- ---' }
                                })()}
                             </span>
                        </div>
                        <div className="col-span-4 flex flex-col justify-center pl-1">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <CurrencyFlags asset={trade.asset} />
                                    <span className="text-[0.85rem] font-black text-white uppercase truncate tracking-tight">{trade.asset.replace(' (OTC)', '')}</span>
                                </div>
                                <span className={cn(
                                    "text-[0.65rem] font-black uppercase tracking-widest",
                                    trade.direction === 'CALL' ? "text-green-500" : "text-red-500"
                                )}>
                                    {trade.direction}
                                </span>
                            </div>
                        </div>
                        <div className="col-span-5 flex flex-col items-end text-right">
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[0.75rem] font-black uppercase tracking-[0.1em]",
                                    trade.result === 'WIN' ? "text-green-500" : (trade.result === 'LOSS' ? "text-red-500" : "text-zinc-500")
                                )}>
                                    {trade.result}
                                </span>
                             </div>
                             <span className={cn(
                                "text-[0.85rem] font-black font-mono leading-none mt-1 tracking-tighter",
                                trade.netChange > 0 ? "text-green-500" : (trade.netChange < 0 ? "text-red-500" : "text-white/30")
                             )}>
                                {trade.netChange > 0 ? '+' : ''}{trade.netChange.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </span>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                         <Loader2 className="h-6 w-6 mb-3 animate-spin" />
                         <p className="text-[0.55rem] font-black uppercase tracking-[0.4em]">Sincronizando...</p>
                    </div>
                )}
             </CardContent>
          </Card>
        </div>

        <div className="lg:h-full flex flex-col p-4 lg:p-0 lg:col-span-5 relative min-h-0">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-[50px] rounded-[2.5rem] p-6 lg:p-10 h-full flex flex-col items-center justify-center relative overflow-hidden">
            
            {step === 'STEP_ID_CHECK' && (
                <div className="max-w-md w-full text-center space-y-6 z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="space-y-5">
                        <div className="flex justify-center scale-90 md:scale-110">
                            <Logo size={80} showText={false} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter text-white">Console Copy</h2>
                            <p className="text-white/60 text-xs md:text-sm leading-relaxed font-medium px-4 max-sm mx-auto">
                                Insira o ID da sua corretora para verificar a autorização de sincronização do terminal.
                            </p>
                        </div>
                    </div>

                    <AnalyzerCTA />

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2 text-left">
                            <Label className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Terminal ID (Exnova)</Label>
                            <input 
                                value={brokerIdInput} 
                                onChange={e => setBrokerIdInput(e.target.value.replace(/\D/g, ''))} 
                                placeholder="00000000" 
                                className="w-full h-14 md:h-16 bg-black/40 border border-white/10 rounded-2xl font-mono text-xl tracking-[0.3em] text-center text-white outline-none focus:border-primary/50 transition-all" 
                            />
                        </div>
                        <Button 
                            onClick={handleCheckId} 
                            disabled={brokerIdInput.length < 8 || isVerifying} 
                            className="w-full h-14 md:h-16 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-base md:text-lg rounded-2xl hover:scale-[1.03] transition-all shadow-[0_15px_40px_rgba(255,0,0,0.15)]"
                        >
                            {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFICAR AUTORIZAÇÃO'}
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsInstructionsModalOpen(true)}
                            className="w-full h-10 text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/30 rounded-xl hover:bg-white/5 transition-all"
                        >
                            SE CADASTRAR AO COPY
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_UNAUTHORIZED' && (
                <div className="max-sm w-full text-center space-y-8 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-black uppercase text-white tracking-tighter">ID Não Autorizado</h3>
                        <p className="text-sm text-white/50 leading-relaxed px-6">
                            O terminal <span className="text-red-500 font-mono font-bold">{brokerIdInput}</span> não possui permissão para criação de conta.
                        </p>
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mx-2 text-left">
                            <p className="text-[0.7rem] font-bold text-white/60 leading-relaxed">
                                1. Certifique-se que o ID está correto.<br/>
                                2. Sua conta deve ser criada pelo link oficial.<br/>
                                3. Solicite a liberação manual ao suporte.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full h-12 border-white/10 text-white font-black uppercase text-xs rounded-xl" asChild>
                            <a href="https://t.me/Trader_Chines" target="_blank">SOLICITAR SUPORTE</a>
                        </Button>
                        <Button variant="ghost" onClick={() => setStep('STEP_ID_CHECK')} className="w-full h-10 text-[0.55rem] font-black uppercase tracking-[0.2em] text-white/20">Tentar outro ID</Button>
                    </div>
                </div>
            )}

            {step === 'STEP_LOGIN' && (
                <div className="max-w-md w-full z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="bg-white/[0.03] border border-white/10 p-6 lg:p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20"><LogIn className="h-6 w-6 text-primary" /></div>
                            <div>
                                <h2 className="text-xl font-black uppercase text-white tracking-tighter">Login Terminal</h2>
                                <p className="text-primary text-[0.55rem] font-black uppercase tracking-[0.3em]">ID {brokerIdInput} Detectado</p>
                            </div>
                        </div>

                        <div className="space-y-4 text-left">
                            <div className="space-y-1">
                                <Label className="text-[0.7rem] font-black uppercase tracking-widest text-white/30 ml-2">Senha do Terminal</Label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input type={showPassword ? "text" : "password"} value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} placeholder="******" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button onClick={handleLogin} disabled={isLoggingIn} className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-sm rounded-xl shadow-lg hover:scale-[1.02] transition-all">
                                {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CONECTAR TERMINAL'}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep('STEP_ID_CHECK')} className="w-full h-10 text-[0.55rem] font-black uppercase tracking-[0.2em] text-white/20">Usar outro ID</Button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'STEP_REGISTRATION' && (
                <div className="max-w-md w-full z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white/[0.03] border border-white/10 p-6 lg:p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20"><UserCheck className="h-6 w-6 text-green-500" /></div>
                            <div>
                                <h2 className="text-xl font-black uppercase text-white tracking-tighter">ID Autorizado</h2>
                                <p className="text-primary text-[0.55rem] font-black uppercase tracking-[0.3em]">Finalize seu cadastro</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-left">
                            <div className="space-y-1">
                                <Label className="text-[0.7rem] font-black uppercase tracking-widest text-white/30 ml-2">Nome Completo</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="Seu Nome" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[0.7rem] font-black uppercase tracking-widest text-white/30 ml-2">E-mail de Notificação</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="seu@email.com" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[0.7rem] font-black uppercase tracking-widest text-white/30 ml-2">Telegram (@usuario)</Label>
                                <div className="relative">
                                    <Send className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input value={regData.telegram} onChange={e => setRegData({...regData, telegram: e.target.value})} placeholder="@seuuser" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[0.7rem] font-black uppercase tracking-widest text-white/30 ml-2">Senha</Label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                        <Input type={showPassword ? "text" : "password"} value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} placeholder="******" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[0.7rem] font-black uppercase tracking-widest text-white/30 ml-2">Repetir</Label>
                                    <Input type={showPassword ? "text" : "password"} value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} placeholder="******" className="h-12 bg-black/40 border-white/10 rounded-xl text-sm" />
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleRegister} disabled={isRegistering} className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-sm rounded-xl shadow-lg hover:scale-[1.02] transition-all">
                            {isRegistering ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ATIVAR TERMINAL'}
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_DASHBOARD' && (
                <div className="max-w-md w-full text-center space-y-6 lg:space-y-8 z-10 animate-in fade-in duration-700">
                    <div className="relative">
                        <div className={cn(
                            "absolute inset-0 blur-3xl rounded-full scale-150 transition-all duration-700",
                            isSyncActive && serverTerminalData?.hasBalance !== false ? "bg-green-500/20 animate-pulse" : "bg-red-500/10"
                        )} />
                        <div className={cn(
                            "relative w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center mx-auto border shadow-2xl transition-all duration-500",
                            isSyncActive && serverTerminalData?.hasBalance !== false ? "bg-green-500/15 border-green-500/20" : "bg-red-500/10 border-red-500/20"
                        )}>
                            {isSyncActive && serverTerminalData?.hasBalance !== false ? (
                                <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-green-500 animate-bounce" />
                            ) : (
                                <Pause className="h-8 w-8 md:h-10 md:w-10 text-red-500" />
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl lg:text-3xl font-black uppercase text-white tracking-tighter">Terminal {isSyncActive && serverTerminalData?.hasBalance !== false ? 'Conectado!' : 'Pausado'}</h2>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                <UserIcon className="h-3 w-3 text-primary/60" />
                                <span className="text-[0.6rem] font-bold text-white/80 uppercase">{terminalSession?.name || 'Membro Ativo'}</span>
                            </div>
                        </div>

                        {serverTerminalData?.hasBalance === false && (
                            <div className="mx-4 p-3 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <p className="text-[0.65rem] font-black uppercase text-red-500">Sincronização Interrompida</p>
                                    <p className="text-[0.6rem] font-bold text-white/60 leading-tight">O sistema detectou que sua conta está sem margem operacional. Faça um depósito para reativar o Copy HFT.</p>
                                </div>
                            </div>
                        )}

                        <AnalyzerCTA />
                        
                        <p className="text-white/60 text-[0.8rem] leading-relaxed px-6 max-sm mx-auto">
                            {isSyncActive && serverTerminalData?.hasBalance !== false
                                ? `A sincronização via HFT está ativa. Todas as ordens mestres serão replicadas no seu ID ${terminalSession?.brokerId} em menos de 15ms.`
                                : "A sincronização foi pausada. Nenhuma ordem do Mestre Trader será replicada na sua conta enquanto este status permanecer."
                            }
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 bg-black/60 p-4 lg:p-6 rounded-[2rem] border border-white/5 mx-2 shadow-inner relative group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                            <div className="flex flex-col items-center border-r border-white/10 relative z-10">
                                <span className="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1">LATÊNCIA MÉDIA</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-lg md:text-xl font-mono font-black", isSyncActive && serverTerminalData?.hasBalance !== false ? "text-green-500" : "text-zinc-600")}>12ms</span>
                                    {isSyncActive && serverTerminalData?.hasBalance !== false && <Activity className="h-3 w-3 text-green-500/40 animate-pulse" />}
                                </div>
                            </div>
                            <div className="flex flex-col items-center relative z-10">
                                <span className="text-[0.6rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1">STATUS SYNC</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-lg md:text-xl font-mono font-black", isSyncActive && serverTerminalData?.hasBalance !== false ? "text-green-500" : "text-red-500")}>
                                        {isSyncActive && serverTerminalData?.hasBalance !== false ? 'ACTIVE' : 'PAUSED'}
                                    </span>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isSyncActive && serverTerminalData?.hasBalance !== false ? "bg-green-500 animate-pulse" : "bg-red-500"
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 px-4">
                        <Button 
                            onClick={handleToggleSync}
                            className={cn(
                                "h-14 md:h-16 rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                                isSyncActive && serverTerminalData?.hasBalance !== false
                                    ? "bg-red-500 text-white hover:bg-red-600" 
                                    : "bg-green-500 text-white hover:bg-green-600"
                            )}
                        >
                            {isSyncActive && serverTerminalData?.hasBalance !== false ? (
                                <><Pause className="mr-2 h-4 w-4 md:h-5 md:w-5" /> PAUSAR CONEXÃO HFT</>
                            ) : (
                                <><Play className="mr-2 h-4 w-4 md:h-5 md:w-5" /> ATIVAR CONEXÃO HFT</>
                            )}
                        </Button>

                        <Button asChild className="h-10 md:h-12 rounded-2xl bg-white text-black font-black uppercase text-[0.6rem] md:text-[0.7rem] tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                            <a href="https://trade.exnova.com/traderoom" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                ABRIR CORRETORA
                            </a>
                        </Button>
                    </div>
                </div>
            )}
          </Card>
        </div>

      </main>

      <footer className="shrink-0 py-2.5 px-6 border-t border-white/5 bg-black/80 backdrop-blur-md z-50">
          <div className="max-w-4xl mx-auto text-center space-y-0.5">
              <div className="flex items-center justify-center gap-6 opacity-20 text-[0.55rem] font-black uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-1.5"><Shield className="h-2.5 w-2.5" /> HFT Encrypted</div>
                  <div className="flex items-center gap-1.5"><Lock className="h-2.5 w-2.5" /> SSL Secure V.2026</div>
              </div>
              <p className="text-[0.4rem] md:text-[0.45rem] font-bold uppercase tracking-tight text-white/10 leading-tight">
                  AVISO: Trading envolve riscos. Sem garantia de lucros. Responsabilidade exclusiva do usuário. Opere com consciência.
              </p>
          </div>
      </footer>

      <Dialog open={isInstructionsModalOpen} onOpenChange={setIsInstructionsModalOpen}>
          <DialogContent className="bg-[#050505] border border-white/10 max-w-sm rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]">
              <div className="relative p-6 lg:p-8 space-y-8">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent -z-10" />
                  
                  <div className="text-center space-y-3 pt-2">
                      <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl border border-primary/20 mb-2 shadow-2xl">
                          <ShieldCheck className="h-10 w-10 text-primary" />
                      </div>
                      <DialogTitle className="text-3xl font-headline font-black uppercase tracking-tighter text-white leading-none">
                        COPY TRADE<br/>
                        <span className="text-primary">ESTRATEGIA CHINESA</span>
                      </DialogTitle>
                      <DialogDescription className="text-[0.65rem] font-bold text-white/30 uppercase tracking-[0.3em]">
                          Protocolo de Sincronização HFT
                      </DialogDescription>
                  </div>

                  <div className="relative space-y-8">
                      <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-primary/50 via-white/5 to-white/5" />

                      <div className="relative flex items-start gap-5 group">
                          <div className="h-12 w-12 rounded-2xl bg-black border border-primary/30 flex items-center justify-center shrink-0 z-10 shadow-2xl transition-all group-hover:border-primary group-hover:scale-110">
                              <span className="text-sm font-black text-primary font-mono">01</span>
                          </div>
                          <div className="pt-1 space-y-1">
                              <h4 className="text-sm font-black uppercase text-white tracking-widest">Nova Conta Oficial</h4>
                              <p className="text-xs font-bold text-white/50 leading-snug">
                                  Crie sua conta pelo link abaixo para vincular o ID ao nosso copy trade.
                              </p>
                          </div>
                      </div>

                      <div className="relative flex items-start gap-5 group">
                          <div className="h-12 w-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center shrink-0 z-10 shadow-2xl transition-all group-hover:border-primary group-hover:scale-110">
                              <span className="text-sm font-black text-white/40 font-mono group-hover:text-primary">02</span>
                          </div>
                          <div className="pt-1 space-y-1">
                              <h4 className="text-sm font-black uppercase text-white tracking-widest">Ativação do Copy</h4>
                              <p className="text-xs font-bold text-white/50 leading-snug">
                                  Envie o ID gerado no Telegram para liberação do seu cadastro.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                      <Button asChild className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-sm rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                          <a href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=copy" target="_blank" rel="noopener noreferrer">
                              <ArrowUpRight className="mr-2 h-4 w-4" />
                              1. ABRIR CONTA OFICIAL
                          </a>
                      </Button>
                      <Button asChild variant="outline" className="w-full h-12 font-black uppercase tracking-tighter text-[0.7rem] border-white/10 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                          <a href={masterStats.telegram} target="_blank" rel="noopener noreferrer">
                              <Send className="mr-2 h-4 w-4" />
                              2. ENVIAR ID NO TELEGRAM
                          </a>
                      </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 opacity-20">
                      <Info className="h-3 w-3" />
                      <span className="text-[0.5rem] font-black uppercase tracking-widest">Processamento imediato após validação</span>
                  </div>
              </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-sm rounded-[2rem] p-6 lg:p-8">
              <div className="text-center space-y-6">
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 w-fit mx-auto shadow-2xl">
                      <Wallet className="h-10 w-10 text-primary" />
                  </div>
                  <DialogHeader>
                      <DialogTitle className="text-2xl font-headline font-black uppercase tracking-tighter text-white">Margem Requerida</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                      <p className="text-sm text-white/70 leading-relaxed text-left">
                          Para sincronizar ao trader, você precisa fazer um depósito de no mínimo <span className="text-primary font-bold">{masterStats.initialBalance}</span> ou o valor ideal recomendado de <span className="text-green-500 font-bold">{masterStats.balance}</span>.
                      </p>
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <p className="text-[0.65rem] font-bold text-white/60 uppercase leading-relaxed text-left">
                              Após depositar, envie um print mostrando o seu <span className="text-primary">ID</span> e o <span className="text-primary">Saldo</span> que foi adicionado para validar sua sincronização.
                          </p>
                      </div>
                  </div>
                  <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0 pt-2">
                      <Button asChild className="w-full h-12 bg-primary text-black font-black uppercase rounded-xl">
                          <a href={masterStats.telegram} target="_blank">ENVIAR COMPROVANTE</a>
                      </Button>
                      <Button variant="ghost" onClick={() => setIsDepositModalOpen(false)} className="w-full text-white/30 font-bold uppercase text-[0.6rem]">Fechar</Button>
                  </DialogFooter>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
