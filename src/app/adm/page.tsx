
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  Loader2, 
  LogOut,
  Search,
  ChevronDown,
  ChevronUp,
  Key,
  LayoutDashboard,
  ArrowUpDown,
  MoreVertical,
  Settings2,
  Save,
  Tv,
  Plus,
  Link as LinkIcon,
  MousePointer2,
  Eye,
  EyeOff,
  Copy,
  History,
  Users,
  Timer,
  Star,
  Ban,
  ShieldOff,
  ShieldCheck,
  UserPlus,
  AlertCircle,
  Zap,
  BarChart3,
  Trash2,
  Crown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { useAppConfig } from '@/firebase/config-provider';
import { cn } from '@/lib/utils';

const ADMIN_EMAILS = ['chines@trader.com', 'estrategiachinesa@gmail.com'];

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

type QuickFilter = 'ALL' | 'PENDING' | 'PREMIUM' | 'SUSPENDED' | 'REJECTED';

export default function AdminDashboard() {
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const { config } = useAppConfig();
  const { toast } = useToast();
  const router = useAffiliateRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [regSecret, setRegSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [invertSignals, setInvertSignals] = useState(false);
  const [signalLimit, setSignalLimit] = useState(3);
  
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isClicksDialogOpen, setIsClicksDialogOpen] = useState(false);

  const [zoomLink, setZoomLink] = useState('');
  const [isSavingLink, setIsSavingLink] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const sessionStatusRef = useMemoFirebase(() => firestore ? doc(firestore, 'session', 'status') : null, [firestore]);
  const sessionScoreRef = useMemoFirebase(() => firestore ? doc(firestore, 'session', 'monthly_score') : null, [firestore]);
  const { data: sessionStatus } = useDoc(sessionStatusRef);
  const { data: sessionScore } = useDoc(sessionScoreRef);

  useEffect(() => {
    if (sessionStatus && (sessionStatus as any).zoomLink !== undefined) {
      setZoomLink((sessionStatus as any).zoomLink || '');
    }
  }, [sessionStatus]);

  useEffect(() => {
    const fetchConfigs = async () => {
      if (!firestore || !isAdmin) return;
      try {
        const regSnap = await getDoc(doc(firestore, 'appConfig', 'registration'));
        const remoteSnap = await getDoc(doc(firestore, 'appConfig', 'remoteValues'));
        const limitSnap = await getDoc(doc(firestore, 'appConfig', 'limitation'));

        if (regSnap.exists()) setRegSecret(regSnap.data().registrationSecret || '');
        if (remoteSnap.exists()) setInvertSignals(remoteSnap.data().invertSignal || false);
        if (limitSnap.exists()) setSignalLimit(limitSnap.data().hourlySignalLimit || 3);
      } catch (e) { console.error("Error fetching configs:", e); }
    };
    fetchConfigs();
  }, [firestore, isAdmin]);

  const handleSaveConfigs = async () => {
    if (!firestore) return;
    setIsConfigSaving(true);
    try {
      await Promise.all([
        setDoc(doc(firestore, 'appConfig', 'registration'), { registrationSecret: regSecret.trim() }, { merge: true }),
        setDoc(doc(firestore, 'appConfig', 'remoteValues'), { invertSignal: invertSignals }, { merge: true }),
        setDoc(doc(firestore, 'appConfig', 'limitation'), { hourlySignalLimit: signalLimit }, { merge: true })
      ]);
      toast({ title: 'Configurações Salvas' });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro ao Salvar' }); }
    finally { setIsConfigSaving(false); }
  };

  const handleToggleSession = async (current: boolean | undefined) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'session', 'status'), { isOnline: !current }, { merge: true });
      toast({ title: `Sessão ${!current ? 'Online' : 'Offline'}` });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro ao alternar sessão' }); }
  };

  const handleSaveZoomLink = async () => {
    if (!firestore) return;
    setIsSavingLink(true);
    try {
      await setDoc(doc(firestore, 'session', 'status'), { zoomLink: zoomLink.trim() }, { merge: true });
      toast({ title: 'Link da Sessão Atualizado' });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro ao salvar link' }); }
    finally { setIsSavingLink(false); }
  };

  const handleUpdateScore = async (field: 'wins' | 'losses', current: number) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'session', 'monthly_score'), { [field]: current + 1 }, { merge: true });
      toast({ title: 'Placar Atualizado' });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro ao atualizar placar' }); }
  };

  const handleResetStats = async () => {
    if (!firestore) return;
    setIsResetting(true);
    try {
      await setDoc(doc(firestore, 'appConfig', 'analytics'), { visitCount: 0, checkoutClickCount: 0 });
      toast({ title: 'Estatísticas Zeradas' });
      setIsResetDialogOpen(false);
    } catch (e) { toast({ variant: 'destructive', title: 'Erro ao Resetar' }); }
    finally { setIsResetting(false); }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(regSecret);
    toast({ title: 'Copiado!', description: 'Chave de registo copiada.' });
  };

  const handleCopyRegisterLink = () => {
    const link = 'https://estrategiachinesa.com.br/register';
    navigator.clipboard.writeText(link);
    toast({ title: 'Copiado!', description: 'Link de cadastro oficial copiado.' });
  };

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdmin]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'vipRequests');
  }, [firestore, isAdmin]);

  const { data: rawUsers, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: rawRequests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  useEffect(() => {
    if (!isUserLoading && !isAdmin) router.push('/login');
  }, [isAdmin, isUserLoading, router]);

  const handleToggleAccount = async (userId: string, currentStatus: string | undefined, email: string) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await setDoc(doc(firestore, 'users', userId), { 
        accountStatus: newStatus,
        email: email === '---' ? (userId + "@lead.com") : email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: 'Status Alterado' });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro' }); }
  };

  const handleUpdateVipStatus = async (userId: string, newStatus: string, email: string) => {
    if (!firestore) return;
    const isPremiumStatus = newStatus === 'PREMIUM' || newStatus === 'APPROVED';
    const subStatus = isPremiumStatus ? 'ACTIVE' : 'INACTIVE';
    try {
      await setDoc(doc(firestore, 'vipRequests', userId), { 
        status: newStatus, 
        userId, 
        userEmail: email === '---' ? "" : email, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      await setDoc(doc(firestore, 'users', userId), { 
        subscriptionStatus: subStatus, 
        email: email === '---' ? "" : email, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      toast({ title: 'Plano Atualizado' });
    } catch (e) { toast({ variant: 'destructive', title: 'Erro' }); }
  };

  const handleDeleteUser = async () => {
    if (!firestore || !deleteUserId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'users', deleteUserId));
      await deleteDoc(doc(firestore, 'vipRequests', deleteUserId)).catch(() => {});
      toast({ title: 'Registo Excluído' });
      setDeleteUserId(null);
    } catch (e) { toast({ variant: 'destructive', title: 'Erro' }); }
    finally { setIsDeleting(false); }
  };

  const mergedUsers = useMemo(() => {
    if (!rawUsers && !rawRequests) return [];
    const allIds = new Set([...(rawUsers?.map(u => u.id) || []), ...(rawRequests?.map(r => r.id) || [])]);

    return Array.from(allIds).map(id => {
      const u = rawUsers?.find(userDoc => userDoc.id === id);
      const r = rawRequests?.find(reqDoc => reqDoc.id === id);
      const email = u?.email || r?.userEmail || (r as any).email || '---';
      const vipStatus = r?.status || 'NENHUM';
      const createdAt = u?.createdAt || r?.submittedAt || null;
      const lastActivity = u?.updatedAt || r?.updatedAt || u?.createdAt || r?.submittedAt || null;
      
      let isNew = false;
      let diffDays = 0;
      if (createdAt) {
          const date = (createdAt as any).seconds ? new Date((createdAt as any).seconds * 1000) : new Date(createdAt as any);
          diffDays = Math.floor(Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
          isNew = diffDays <= 8;
      }

      return {
        id, email, createdAt, lastActivity, brokerId: r?.brokerId || '---',
        accountStatus: u?.accountStatus || 'ACTIVE',
        subscriptionStatus: vipStatus === 'NENHUM' ? 'VIP' : (vipStatus === 'APPROVED' || vipStatus === 'PREMIUM' ? 'PREMIUM' : vipStatus),
        rawStatus: vipStatus, rating: u?.rating || 0,
        isPremium: vipStatus === 'PREMIUM' || vipStatus === 'APPROVED',
        isPending: ['PENDING', 'AWAITING_DEPOSIT', 'DEPOSIT_PENDING'].includes(vipStatus),
        isRejected: vipStatus === 'REJECTED', isNew, daysSince: diffDays, isGhost: !u
      };
    })
    .filter(u => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (u.email?.toLowerCase().includes(search) || u.brokerId?.toLowerCase().includes(search) || u.id.toLowerCase().includes(search));
      if (!matchesSearch) return false;
      if (activeFilter === 'PENDING') return u.isPending;
      if (activeFilter === 'PREMIUM') return u.isPremium;
      if (activeFilter === 'SUSPENDED') return u.accountStatus === 'DISABLED';
      if (activeFilter === 'REJECTED') return u.isRejected;
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortConfig.key as keyof typeof a] as any;
      let valB = b[sortConfig.key as keyof typeof b] as any;
      if (valA?.seconds) valA = valA.seconds;
      if (valB?.seconds) valB = valB.seconds;
      if (valA === null || valA === undefined) valA = 0;
      if (valB === null || valB === undefined) valB = 0;
      return sortConfig.direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
    });
  }, [rawUsers, rawRequests, searchTerm, sortConfig, activeFilter]);

  const stats = useMemo(() => ({
    total: mergedUsers.length,
    pending: mergedUsers.filter(u => u.isPending).length,
    premium: mergedUsers.filter(u => u.isPremium).length,
    suspended: mergedUsers.filter(u => u.accountStatus === 'DISABLED').length,
    rejected: mergedUsers.filter(u => u.isRejected).length,
  }), [mergedUsers]);

  const pageClicks = useMemo(() => {
    if (!config) return [];
    return Object.keys(config)
      .filter(key => key.startsWith('clicks_'))
      .map(key => ({
        page: key.replace('clicks_', '').replace('home', 'Início').replace('analisador', 'Analisador').replace('catalogador', 'Scanner').replace('vip', 'Página VIP').replace('sessaochinesa', 'Sessão Chinesa'),
        count: config[key] || 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [config]);

  const formatDate = (ts: any) => {
    if (!ts) return '---';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getPlanBadgeStyles = (rawStatus: string) => {
    if (rawStatus === 'PREMIUM' || rawStatus === 'APPROVED') return 'bg-purple-600 text-white';
    if (rawStatus === 'PENDING') return 'bg-orange-500 text-white';
    if (rawStatus === 'AWAITING_DEPOSIT') return 'bg-cyan-500 text-black';
    if (rawStatus === 'DEPOSIT_PENDING') return 'bg-emerald-500 text-black';
    if (rawStatus === 'REJECTED') return 'bg-red-600 text-white';
    return 'bg-yellow-500 text-black';
  };

  if (isUserLoading || !user || !isAdmin) {
    return <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-body">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-headline font-black tracking-tight uppercase">Gestão Estratégia Chinesa</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-full border border-white/10">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        
        {/* STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
             {[
                 { label: 'Cliques Totais', value: config?.checkoutClickCount || 0, icon: MousePointer2, color: 'text-blue-400', onClick: () => setIsClicksDialogOpen(true) },
                 { label: 'Pendentes', value: stats.pending, icon: Timer, color: stats.pending > 0 ? 'text-orange-500 animate-pulse' : 'text-zinc-500' },
                 { label: 'Total Membros', value: stats.total, icon: Users, color: 'text-primary' },
                 { label: 'Premium', value: stats.premium, icon: Star, color: 'text-purple-500' },
                 { label: 'Recusados', value: stats.rejected, icon: Ban, color: 'text-red-500' },
                 { label: 'Suspensos', value: stats.suspended, icon: ShieldOff, color: 'text-zinc-500' },
             ].map((s, i) => (
                <Card 
                    key={i} 
                    onClick={s.onClick}
                    className={cn(
                        "bg-card/30 border-white/5 p-4 flex items-center gap-4 transition-all",
                        s.label === 'Pendentes' && stats.pending > 0 && "border-orange-500/20 bg-orange-500/5",
                        s.onClick && "cursor-pointer hover:bg-white/5 hover:border-white/10"
                    )}
                >
                    <div className={cn("p-2 rounded-xl bg-white/5", s.color)}><s.icon className="h-5 w-5" /></div>
                    <div>
                        <p className="text-[0.6rem] font-black uppercase tracking-widest opacity-40">{s.label}</p>
                        <p className="text-xl font-headline font-black">{s.value}</p>
                    </div>
                </Card>
             ))}
        </div>

        {/* CONTROLO DE SESSÃO CHINESA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-card/40 border-white/5 p-6 rounded-2xl lg:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                    <Tv className="h-5 w-5 text-primary" />
                    <h2 className="text-sm font-black uppercase tracking-widest">Sessão Chinesa</h2>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase">Status Live</span>
                            <span className={cn("text-[0.6rem] font-black", (sessionStatus as any)?.isOnline ? "text-green-500" : "text-red-500")}>
                                {(sessionStatus as any)?.isOnline ? 'SESSÃO ONLINE' : 'SESSÃO OFFLINE'}
                            </span>
                        </div>
                        <Switch checked={(sessionStatus as any)?.isOnline || false} onCheckedChange={() => handleToggleSession((sessionStatus as any)?.isOnline)} />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[0.6rem] font-bold uppercase opacity-60 flex items-center gap-1.5"><LinkIcon className="h-3 w-3"/> Link da Sala (Zoom/Meet)</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={zoomLink} 
                            onChange={(e) => setZoomLink(e.target.value)} 
                            placeholder="https://zoom.us/j/..." 
                            className="bg-white/5 border-white/10 h-10 text-xs" 
                          />
                          <Button 
                            size="sm" 
                            onClick={handleSaveZoomLink} 
                            disabled={isSavingLink}
                            className="bg-primary text-black h-10 px-4"
                          >
                            {isSavingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[0.6rem] font-bold uppercase opacity-60">Wins (Mês)</Label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={(sessionScore as any)?.wins || 0} className="bg-white/5 border-white/10 text-center text-green-500 font-black" />
                                <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => handleUpdateScore('wins', (sessionScore as any)?.wins || 0)}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[0.6rem] font-bold uppercase opacity-60">Losses (Mês)</Label>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={(sessionScore as any)?.losses || 0} className="bg-white/5 border-white/10 text-center text-red-500 font-black" />
                                <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => handleUpdateScore('losses', (sessionScore as any)?.losses || 0)}><Plus className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* GLOBAL CONFIGS */}
            <Card className="bg-card/40 border-white/5 p-6 rounded-2xl lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-primary" />
                        <h2 className="text-sm font-black uppercase tracking-widest">Configurações Globais</h2>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setIsResetDialogOpen(true)} className="h-9 px-4 rounded-xl font-bold bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white"><History className="h-4 w-4 mr-2" /> Zerar Stats</Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[0.6rem] font-bold uppercase opacity-60">Chave de Registo (Secret)</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <Input 
                                        type={showSecret ? "text" : "password"} 
                                        value={regSecret} 
                                        onChange={(e) => setRegSecret(e.target.value)} 
                                        className="bg-white/5 border-white/10 h-11 pr-10" 
                                    />
                                    <button 
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                                    >
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button size="icon" variant="outline" className="h-11 w-11" onClick={handleCopySecret}><Copy className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-[0.6rem] font-bold uppercase opacity-60">Link de Cadastro</Label>
                            <Button variant="outline" className="w-full h-11 justify-start font-mono text-[0.65rem] bg-white/5 border-white/10" onClick={handleCopyRegisterLink}>
                                <UserPlus className="h-4 w-4 mr-2 text-primary" /> Copiar Link de Registro
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase">Inverter Sinais</span>
                                <span className="text-[0.55rem] opacity-40 uppercase">Apenas Modo PREMIUM</span>
                            </div>
                            <Switch checked={invertSignals} onCheckedChange={setInvertSignals} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label className="text-[0.6rem] font-bold uppercase opacity-60">Limite Trades</Label>
                                <Input type="number" value={signalLimit} onChange={(e) => setSignalLimit(parseInt(e.target.value))} className="bg-white/5 border-white/10 h-11" />
                            </div>
                            <Button onClick={handleSaveConfigs} disabled={isConfigSaving} className="h-11 font-black uppercase tracking-tighter bg-primary text-black">
                                {isConfigSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        {/* FILTERS AND TABLE */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-end justify-between">
            <div className="flex flex-wrap gap-2">
                {['ALL', 'PENDING', 'PREMIUM', 'REJECTED', 'SUSPENDED'].map((f) => (
                    <Button 
                        key={f} 
                        variant={activeFilter === f ? 'default' : 'outline'} 
                        onClick={() => setActiveFilter(f as QuickFilter)} 
                        className={cn(
                            "h-10 px-4 rounded-xl relative",
                            activeFilter === f ? 'bg-primary text-black' : 'bg-white/5',
                            f === 'PENDING' && stats.pending > 0 && "border-orange-500 text-orange-500"
                        )}
                    >
                        {f}
                        {f === 'PENDING' && stats.pending > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                        )}
                    </Button>
                ))}
            </div>
            <div className="flex gap-3 w-full xl:w-auto">
                <div className="relative flex-grow sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="E-mail ou ID..." className="pl-10 rounded-xl bg-white/5 h-11" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </div>

        <Card className="bg-card/40 border-white/5 overflow-hidden rounded-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead onClick={() => setSortConfig({ key: 'createdAt', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="cursor-pointer text-[0.6rem] font-black uppercase">Registo <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                <TableHead onClick={() => setSortConfig({ key: 'email', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="cursor-pointer text-[0.6rem] font-black uppercase">Membro <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                <TableHead onClick={() => setSortConfig({ key: 'lastActivity', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="cursor-pointer text-[0.6rem] font-black uppercase">Atividade <ArrowUpDown className="inline h-3 w-3 ml-1" /></TableHead>
                <TableHead className="text-[0.6rem] font-black uppercase">Broker ID</TableHead>
                <TableHead className="text-[0.6rem] font-black uppercase">Status</TableHead>
                <TableHead className="text-[0.6rem] font-black uppercase">Plano</TableHead>
                <TableHead className="text-right text-[0.6rem] font-black uppercase">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedUsers.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-[0.7rem] font-mono opacity-50">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{u.email}</span>
                        {u.isNew && (
                           <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[0.5rem] px-1.5 h-4 flex items-center gap-1 animate-pulse">
                              <Star className="h-2 w-2 fill-yellow-500" /> NOVO - {u.daysSince}D
                           </Badge>
                        )}
                      </div>
                      {u.isGhost && <Badge variant="outline" className="text-[0.5rem] py-0 border-primary/20 text-primary/50 w-fit">SEM PERFIL</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-[0.7rem] font-mono opacity-80">{formatDate(u.lastActivity)}</TableCell>
                  <TableCell className="text-xs font-mono text-primary font-bold">{u.brokerId}</TableCell>
                  <TableCell>
                    <Badge variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'} className="text-[0.6rem] font-black">{u.accountStatus === 'DISABLED' ? 'SUSPENSO' : 'ATIVA'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[0.6rem] font-black px-2 py-0.5 border-none shadow-md", getPlanBadgeStyles(u.rawStatus))}>{u.subscriptionStatus}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-white/10">
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'APPROVED', u.email)} className="text-xs font-bold text-purple-400">
                          <Crown className="h-3.5 w-3.5 mr-2" /> Tornar PREMIUM
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'REJECTED', u.email)} className="text-xs text-red-400">
                          <Ban className="h-3.5 w-3.5 mr-2" /> Recusar PREMIUM
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'PENDING', u.email)} className="text-xs text-orange-400">
                          <Timer className="h-3.5 w-3.5 mr-2" /> Voltar PENDENTE
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        <DropdownMenuItem onClick={() => handleToggleAccount(u.id, u.accountStatus, u.email)} className="text-xs">
                          {u.accountStatus === 'DISABLED' ? <ShieldCheck className="h-3.5 w-3.5 mr-2" /> : <ShieldOff className="h-3.5 w-3.5 mr-2" />}
                          {u.accountStatus === 'DISABLED' ? 'Ativar Conta' : 'Suspender Conta'}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        <DropdownMenuItem className="text-destructive text-xs font-bold" onClick={() => setDeleteUserId(u.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Total
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent className="bg-[#0d0d0d] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 font-black uppercase">Zerar Estatísticas?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">Esta ação limpará todos os contadores de Cliques acumulados até ao momento.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetStats} className="bg-red-600 text-white hover:bg-red-700">Confirmar Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isClicksDialogOpen} onOpenChange={setIsClicksDialogOpen}>
        <DialogContent className="bg-[#0d0d0d] border-white/10 max-w-md">
            <DialogHeader>
                <DialogTitle className="text-primary font-black uppercase flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Detalhes de Cliques
                </DialogTitle>
                <DialogDescription className="text-xs">
                    Cliques totais por página (Excluindo Admin)
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
                {pageClicks.length > 0 ? pageClicks.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-xs font-bold uppercase opacity-70">{stat.page}</span>
                        <span className="font-mono font-black text-primary">{stat.count}</span>
                    </div>
                )) : (
                    <p className="text-center py-8 text-muted-foreground text-sm">Sem dados de cliques registados.</p>
                )}
            </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-[#0d0d0d] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 font-black uppercase">Excluir Utilizador?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">Esta ação é irreversível e apagará todos os dados de perfil e pedidos VIP deste membro.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-red-600 text-white hover:bg-red-700">
               {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
