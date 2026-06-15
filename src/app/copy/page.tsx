
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
  LogOut
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
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, updateDoc, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

type ConnectionStep = 'STEP_ID_CHECK' | 'STEP_REGISTRATION' | 'STEP_LOGIN' | 'STEP_DASHBOARD' | 'STEP_UNAUTHORIZED';

export default function CopyPage() {
  const { config, isConfigLoading } = useAppConfig();
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [brokerIdInput, setBrokerIdInput] = useState('');
  const [step, setStep] = useState<ConnectionStep>('STEP_ID_CHECK');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncActive, setIsSyncActive] = useState(true);
  
  // Registration state
  const [regData, setRegData] = useState({
      name: '',
      email: '',
      telegram: '',
      password: '',
      confirmPassword: ''
  });

  // Login state (for registered users)
  const [loginData, setLoginData] = useState({
      email: '',
      password: ''
  });

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  useEffect(() => {
      if (!isUserLoading && user) {
          setStep('STEP_DASHBOARD');
      }
  }, [user, isUserLoading]);

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

  const handleCheckId = async () => {
      if (!brokerIdInput || !firestore) return;
      setIsVerifying(true);
      try {
          const q = query(
              collection(firestore, 'copyRequests'),
              where('brokerId', '==', brokerIdInput),
              limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
              const reqData = snap.docs[0].data();
              if (reqData.status === 'REGISTERED') {
                  // User already has an account
                  setLoginData(prev => ({ ...prev, email: '' })); // Do not pre-fill to allow manual entry
                  setStep('STEP_LOGIN');
              } else if (reqData.status === 'AUTHORIZED') {
                  setActiveRequestId(snap.docs[0].id);
                  setStep('STEP_REGISTRATION');
              } else {
                  setStep('STEP_UNAUTHORIZED');
              }
          } else {
              setStep('STEP_UNAUTHORIZED');
          }
      } catch (e) { 
          console.error(e);
          toast({ variant: 'destructive', title: 'Erro de conexão', description: 'Não foi possível verificar seu ID.' });
      } finally { 
          setIsVerifying(false); 
      }
  };

  const handleLogin = async () => {
      if (!firestore || !auth) return;
      if (!loginData.email || !loginData.password) {
          toast({ variant: 'destructive', title: 'Campos Vazios', description: 'Por favor, preencha seu e-mail e senha.' });
          return;
      }
      setIsLoggingIn(true);
      try {
          await signInWithEmailAndPassword(auth, loginData.email.trim(), loginData.password);
          setStep('STEP_DASHBOARD');
          toast({ title: 'Bem-vindo de volta!', description: 'Conexão HFT restabelecida.' });
      } catch (e: any) {
          console.error(e);
          toast({ variant: 'destructive', title: 'Erro no login', description: 'E-mail ou senha incorretos.' });
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handleRegister = async () => {
      if (!firestore || !auth || !activeRequestId) return;
      if (regData.password !== regData.confirmPassword) {
          toast({ variant: 'destructive', title: 'Senhas não coincidem' });
          return;
      }
      setIsRegistering(true);
      try {
          const userCred = await createUserWithEmailAndPassword(auth, regData.email.trim(), regData.password);
          const userId = userCred.user.uid;
          
          await setDoc(doc(firestore, 'users', userId), {
              email: regData.email.trim(),
              displayName: regData.name,
              telegram: regData.telegram,
              brokerId: brokerIdInput,
              accountStatus: 'ACTIVE',
              subscriptionStatus: 'ACTIVE',
              createdAt: serverTimestamp()
          });

          await updateDoc(doc(firestore, 'copyRequests', activeRequestId), {
              status: 'REGISTERED',
              userId: userId,
              registeredAt: serverTimestamp(),
              name: regData.name,
              email: regData.email.trim(),
              telegram: regData.telegram
          });

          setStep('STEP_DASHBOARD');
          toast({ title: 'Sucesso!', description: 'Terminal ativado e pronto para operar.' });
      } catch (e: any) { 
          console.error(e);
          toast({ variant: 'destructive', title: 'Erro no cadastro', description: e.message || "Ocorreu um erro." });
      } finally { setIsRegistering(false); }
  };

  const handleLogout = async () => {
      if (!auth) return;
      await signOut(auth);
      setStep('STEP_ID_CHECK');
      setBrokerIdInput('');
      setLoginData({ email: '', password: '' });
      toast({ title: 'Conexão Encerrada', description: 'Terminal desconectado com sucesso.' });
  };

  if (isConfigLoading || isUserLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-[100dvh] bg-[#050505] text-foreground font-body overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_#0e0e0e_0%,_#050505_100%)]" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-[0.03]" />
      
      <header className="h-14 lg:h-16 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-2xl shrink-0 z-50">
        <Logo size={32} />
        <div className="flex items-center gap-3">
             {user && (
                 <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 px-3 rounded-full border border-white/10 text-[0.6rem] font-black uppercase text-white/40 hover:text-white hover:bg-white/5">
                    <LogOut className="h-3 w-3 mr-2" /> Sair
                 </Button>
             )}
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className={cn("w-1.5 h-1.5 rounded-full", masterStats.isActive ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-red-500")} />
                <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-white/80">{masterStats.isActive ? "COPY ONLINE" : "Offline"}</span>
             </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto snap-y snap-mandatory lg:overflow-hidden lg:snap-none lg:grid lg:grid-cols-12 lg:gap-6 lg:p-6 lg:max-w-[1600px] lg:mx-auto w-full no-scrollbar">
        
        {/* SLIDE 1: MASTER DASHBOARD */}
        <div className="snap-start h-[calc(100dvh-56px)] lg:h-full flex flex-col p-3 lg:p-0 lg:col-span-3">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-3xl rounded-[2rem] overflow-hidden flex flex-col h-full">
            <div className="h-1 bg-primary w-full" />
            <div className="flex-grow flex flex-col justify-between p-6 lg:p-6">
                <div className="flex flex-col items-center text-center space-y-1 lg:space-y-3">
                    <div className="relative">
                        <div className="relative h-16 w-16 md:h-24 md:w-24 rounded-full border-[3px] border-white/10 overflow-hidden bg-black shadow-xl">
                            <Image src={masterStats.profilePic} alt={masterStats.traderName} fill className="object-cover" unoptimized />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-[0.55rem] font-black uppercase tracking-[0.4em] text-primary/70">GESTOR</h3>
                        <p className="text-base lg:text-xl font-headline font-black text-white uppercase tracking-tighter">{masterStats.traderName}</p>
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

                <div className="space-y-1 lg:space-y-2 my-1 lg:my-4">
                    <div className="p-2.5 lg:p-3 bg-white/[0.02] rounded-xl border border-white/5 flex justify-between items-center">
                        <p className="text-[0.55rem] font-black text-white/50 uppercase tracking-[0.2em]">Saldo Inicial</p>
                        <p className="text-xs font-black font-mono text-white/70">{masterStats.initialBalance}</p>
                    </div>
                    <div className="p-3 lg:p-4 bg-white/[0.05] rounded-xl border border-white/10 flex justify-between items-center shadow-2xl">
                        <p className="text-[0.55rem] font-black text-white/60 uppercase tracking-[0.2em]">Saldo Atual</p>
                        <p className="text-base lg:text-lg font-black font-mono text-white tracking-tighter">{masterStats.balance}</p>
                    </div>
                    <div className={cn(
                        "p-3 lg:p-4 rounded-xl border flex justify-between items-center",
                        lastTradeResult < 0 ? "bg-red-500/5 border-red-500/10" : (lastTradeResult === 0 ? "bg-white/5 border-white/10" : "bg-green-500/5 border-green-500/10")
                    )}>
                        <p className={cn("text-[0.55rem] font-black uppercase tracking-[0.2em]", lastTradeResult < 0 ? "text-red-500/80" : (lastTradeResult === 0 ? "text-white/40" : "text-green-500/80"))}>Net Profit Hoje</p>
                        <p className={cn("text-base lg:text-lg font-black font-mono tracking-tighter", lastTradeResult < 0 ? "text-red-500" : (lastTradeResult === 0 ? "text-zinc-600" : "text-green-500"))}>{masterStats.profitToday}</p>
                    </div>
                </div>

                <div className="p-4 lg:p-4 bg-black/60 rounded-[1.5rem] border border-white/10 space-y-2 lg:space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <Trophy className="h-3 w-3 text-primary" />
                             <span className="text-[0.55rem] font-black uppercase tracking-[0.2em] text-white/50">Placar Mensal</span>
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
                            <span className="text-[0.5rem] font-black uppercase text-white/50 tracking-[0.1em]">Assertividade IA</span>
                            <span className="text-[0.65rem] font-black text-green-500 font-mono">{masterStats.winRate}</span>
                        </div>
                        <Progress value={parseFloat(masterStats.winRate)} className="h-1 bg-white/5" indicatorClassName="bg-green-500" />
                    </div>
                </div>
            </div>
          </Card>
        </div>

        {/* SLIDE 2: OPERATIONS HISTORY */}
        <div className="snap-start h-[calc(100dvh-56px)] lg:h-full flex flex-col p-4 lg:p-0 lg:col-span-4" id="history">
          <Card className="bg-card/30 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-2xl backdrop-blur-xl">
             <CardHeader className="p-4 lg:p-6 pb-3 shrink-0 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-white/60 flex items-center gap-3">
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
                                {(() => {
                                    try {
                                        const parts = trade.date.split('-');
                                        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
                                    } catch(e) { return '--/--' }
                                })()}
                             </span>
                             <span className="text-[0.85rem] font-black text-white/20 font-mono leading-none">
                                {trade.time}
                             </span>
                        </div>
                        <div className="col-span-4 flex items-center gap-2 pl-1">
                            <CurrencyFlags asset={trade.asset} />
                            <span className="text-[0.85rem] font-black text-white uppercase truncate tracking-tight">{trade.asset.replace(' (OTC)', '')}</span>
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

        {/* SLIDE 3: SYNC CONSOLE */}
        <div className="snap-start h-[calc(100dvh-56px)] lg:h-full flex flex-col p-4 lg:p-0 lg:col-span-5 relative">
          <Card className="bg-card/40 border border-white/10 shadow-2xl backdrop-blur-[50px] rounded-[2.5rem] p-6 lg:p-10 h-full flex flex-col items-center justify-center relative overflow-hidden">
            
            {step === 'STEP_ID_CHECK' && (
                <div className="max-w-md w-full text-center space-y-8 z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="space-y-5">
                        <div className="flex justify-center scale-90 md:scale-110">
                            <Logo size={80} showText={false} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tighter text-white">Console Copy</h2>
                            <p className="text-white/60 text-xs md:text-sm leading-relaxed font-medium px-4 max-w-sm mx-auto">
                                Insira o ID da sua corretora para verificar a autorização de sincronização do terminal.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2 text-left">
                            <Label className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Terminal ID (Exnova)</Label>
                            <Input 
                                value={brokerIdInput} 
                                onChange={e => setBrokerIdInput(e.target.value.replace(/\D/g, ''))} 
                                placeholder="00000000" 
                                className="h-14 md:h-16 bg-black/40 border-white/10 rounded-2xl font-mono text-xl tracking-[0.3em] text-center" 
                            />
                        </div>
                        <Button 
                            onClick={handleCheckId} 
                            disabled={brokerIdInput.length < 5 || isVerifying} 
                            className="w-full h-14 md:h-16 bg-primary text-primary-foreground font-black uppercase tracking-tighter text-base md:text-lg rounded-2xl hover:scale-[1.03] transition-all shadow-[0_15px_40px_rgba(255,0,0,0.15)]"
                        >
                            {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFICAR AUTORIZAÇÃO'}
                        </Button>
                        <Button asChild variant="ghost" className="w-full h-10 text-[0.6rem] font-black uppercase tracking-[0.2em] text-white/30 rounded-xl hover:bg-white/5 transition-all">
                            <a href={affiliateLink} target="_blank" rel="noopener noreferrer">ABRIR CONTA NA CORRETORA</a>
                        </Button>
                    </div>
                </div>
            )}

            {step === 'STEP_UNAUTHORIZED' && (
                <div className="max-w-sm w-full text-center space-y-8 z-10 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border border-red-500/20">
                        <ShieldAlert className="h-10 w-10 text-red-500" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-black uppercase text-white tracking-tighter">ID Não Autorizado</h3>
                        <p className="text-sm text-white/50 leading-relaxed px-6">
                            O terminal <span className="text-red-500 font-mono font-bold">{brokerIdInput}</span> não possui permissão para criação de conta.
                        </p>
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mx-2 text-left">
                            <p className="text-[0.65rem] font-bold text-white/60 leading-relaxed">
                                1. Certifique-se que o ID está correto.<br/>
                                2. Sua conta deve ser criada pelo link oficial.<br/>
                                3. Solicite a liberação manual ao suporte.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Button asChild className="w-full h-12 bg-white text-black font-black uppercase text-xs rounded-xl">
                            <a href={affiliateLink} target="_blank">ABRIR CONTA OFICIAL</a>
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
                                <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">seu@email.com</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input 
                                        value={loginData.email} 
                                        onChange={e => setLoginData({...loginData, email: e.target.value})}
                                        placeholder="seu@email.com" 
                                        className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">Senha do Terminal</Label>
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
                                <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">Nome Completo</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} placeholder="Seu Nome" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">E-mail de Acesso</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} placeholder="seu@email.com" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">Telegram (@usuario)</Label>
                                <div className="relative">
                                    <Send className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                    <Input value={regData.telegram} onChange={e => setRegData({...regData, telegram: e.target.value})} placeholder="@seuuser" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">Senha</Label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                                        <Input type={showPassword ? "text" : "password"} value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} placeholder="******" className="h-12 bg-black/40 border-white/10 rounded-xl pl-12 text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[0.55rem] font-black uppercase tracking-widest text-white/30 ml-2">Repetir</Label>
                                    <Input type={showPassword ? "text" : "password"} value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} placeholder="******" className="h-12 bg-black/40 border-white/10 rounded-xl text-sm" />
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleRegister} disabled={isRegistering} className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-sm rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
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
                            isSyncActive ? "bg-green-500/20 animate-pulse" : "bg-orange-500/10"
                        )} />
                        <div className={cn(
                            "relative w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border shadow-2xl transition-all duration-500",
                            isSyncActive ? "bg-green-500/15 border-green-500/20" : "bg-orange-500/10 border-orange-500/20"
                        )}>
                            {isSyncActive ? (
                                <CheckCircle2 className="h-10 w-10 text-green-500 animate-bounce" />
                            ) : (
                                <Pause className="h-10 w-10 text-orange-500" />
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-2xl lg:text-3xl font-black uppercase text-white tracking-tighter">Terminal {isSyncActive ? 'Conectado!' : 'Pausado'}</h2>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                                <UserIcon className="h-3 w-3 text-primary/60" />
                                <span className="text-[0.65rem] font-bold text-white/80 uppercase">{user?.displayName || 'Membro Ativo'}</span>
                            </div>
                        </div>
                        
                        <p className="text-white/60 text-sm leading-relaxed px-6">
                            {isSyncActive 
                                ? `A sincronização via HFT está ativa. Todas as ordens mestres serão replicadas no seu ID ${user?.brokerId || brokerIdInput} em menos de 15ms.`
                                : "A sincronização foi pausada manualmente. Nenhuma ordem do Mestre Trader será replicada na sua conta enquanto este status permanecer."
                            }
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 bg-black/60 p-5 lg:p-6 rounded-[2rem] border border-white/5 mx-2 shadow-inner relative group">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                            <div className="flex flex-col items-center border-r border-white/10 relative z-10">
                                <span className="text-[0.45rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1">LATÊNCIA MÉDIA</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-xl font-mono font-black", isSyncActive ? "text-green-500" : "text-zinc-600")}>12ms</span>
                                    {isSyncActive && <Activity className="h-3 w-3 text-green-500/40 animate-pulse" />}
                                </div>
                            </div>
                            <div className="flex flex-col items-center relative z-10">
                                <span className="text-[0.45rem] font-black text-white/30 uppercase tracking-[0.2em] mb-1">STATUS SYNC</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-xl font-mono font-black", isSyncActive ? "text-green-500" : "text-orange-500")}>
                                        {isSyncActive ? 'ACTIVE' : 'PAUSED'}
                                    </span>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isSyncActive ? "bg-green-500 animate-pulse" : "bg-orange-500"
                                    )} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button 
                            onClick={() => setIsSyncActive(!isSyncActive)}
                            className={cn(
                                "h-16 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                                isSyncActive 
                                    ? "bg-orange-500 text-white hover:bg-orange-600" 
                                    : "bg-green-500 text-white hover:bg-green-600"
                            )}
                        >
                            {isSyncActive ? (
                                <><Pause className="mr-2 h-5 w-5" /> PAUSAR CONEXÃO HFT</>
                            ) : (
                                <><Play className="mr-2 h-5 w-5" /> ATIVAR CONEXÃO HFT</>
                            )}
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase text-[0.65rem] tracking-widest group" onClick={() => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })}>
                                <ArrowDown className="mr-2 h-3.5 w-3.5 group-hover:translate-y-1 transition-transform" />
                                HISTÓRICO DE TRADES
                            </Button>
                            <Button asChild className="h-12 rounded-2xl bg-white text-black font-black uppercase text-[0.65rem] tracking-widest shadow-xl hover:scale-[1.02] transition-all">
                                <a href="https://trade.exnova.com/traderoom" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                    ABRIR CORRETORA
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
          </Card>
        </div>

        {/* SLIDE 4: DISCRETE CORPORATE FOOTER (ONLY ON MOBILE SNAP SCROLL) */}
        <div className="snap-start h-[120px] lg:hidden flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-6 opacity-20 text-[0.45rem] font-black uppercase tracking-[0.1em]">
                <div className="flex items-center gap-1.5"><Shield className="h-2.5 w-2.5" /> HFT Encrypted</div>
                <div className="flex items-center gap-1.5"><Lock className="h-2.5 w-2.5" /> SSL Secure V.2026</div>
            </div>
            <p className="text-[0.45rem] font-bold uppercase tracking-tight text-white/10 leading-tight">
                AVISO: Trading envolve riscos. Sem garantia de lucros. Responsabilidade exclusiva do usuário. Opere com consciência.
            </p>
        </div>

      </main>

      {/* DESKTOP ONLY FIXED FOOTER */}
      <footer className="hidden lg:block shrink-0 py-3 px-6 border-t border-white/5 bg-black/80 backdrop-blur-md z-50">
          <div className="max-w-4xl mx-auto text-center space-y-0.5">
              <div className="flex items-center justify-center gap-6 opacity-20 text-[0.45rem] font-black uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-1.5"><Shield className="h-2.5 w-2.5" /> HFT Encrypted</div>
                  <div className="flex items-center gap-1.5"><Lock className="h-2.5 w-2.5" /> SSL Secure V.2026</div>
              </div>
              <p className="text-[0.45rem] font-bold uppercase tracking-tight text-white/10 leading-tight">
                  AVISO: Trading envolve riscos. Sem garantia de lucros. Responsabilidade exclusiva do usuário. Opere com consciência.
              </p>
          </div>
      </footer>
    </div>
  );
}
