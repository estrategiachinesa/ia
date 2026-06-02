'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  Loader2, 
  LogOut,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldAlert,
  Key,
  Trash2,
  LayoutDashboard,
  UserCheck,
  UserX,
  ArrowUpDown,
  MoreVertical,
  Mail,
  AlertCircle,
  Settings2,
  Save,
  Zap,
  LockKeyhole,
  Activity,
  RefreshCw,
  Timer,
  SlidersHorizontal,
  Download,
  Filter,
  UserCircle,
  CreditCard,
  Ban,
  Users,
  Star,
  ShieldOff,
  XCircle,
  Sparkles,
  Eye,
  MousePointer2
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
  
  // State for user list
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('ALL');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for Global Configs
  const [isConfigSaving, setIsConfigSaving] = useState(false);
  const [regSecret, setRegSecret] = useState('');
  const [invertSignals, setInvertSignals] = useState(false);
  const [signalLimit, setSignalLimit] = useState(3);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // Fetch Global Configs
  useEffect(() => {
    const fetchConfigs = async () => {
      if (!firestore || !isAdmin) return;
      try {
        const regSnap = await getDoc(doc(firestore, 'appConfig', 'registration'));
        const remoteSnap = await getDoc(doc(firestore, 'appConfig', 'remoteValues'));
        const limitSnap = await getDoc(doc(firestore, 'appConfig', 'limitation'));

        if (regSnap.exists()) setRegSecret(regSnap.data().registrationSecret || '');
        if (remoteSnap.exists()) {
            setInvertSignals(remoteSnap.data().invertSignal || false);
        }
        if (limitSnap.exists()) setSignalLimit(limitSnap.data().hourlySignalLimit || 3);
      } catch (e) {
        console.error("Error fetching configs:", e);
      }
    };
    fetchConfigs();
  }, [firestore, isAdmin]);

  const handleSaveConfigs = async () => {
    if (!firestore) return;
    setIsConfigSaving(true);
    try {
      const cleanSecret = regSecret.trim();
      
      await Promise.all([
        setDoc(doc(firestore, 'appConfig', 'registration'), { registrationSecret: cleanSecret }, { merge: true }),
        setDoc(doc(firestore, 'appConfig', 'remoteValues'), { invertSignal: invertSignals }, { merge: true }),
        setDoc(doc(firestore, 'appConfig', 'limitation'), { hourlySignalLimit: signalLimit }, { merge: true })
      ]);
      toast({ title: 'Configurações Salvas', description: 'O sistema foi atualizado em tempo real para todos.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Verifique as permissões de rede.' });
    } finally {
      setIsConfigSaving(false);
    }
  };

  // Queries
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
    if (!isUserLoading && !isAdmin) {
      router.push('/login');
    }
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
      
      toast({ 
        title: 'Status Alterado', 
        description: `Conta ${newStatus === 'DISABLED' ? 'Suspensa' : 'Ativada'}` 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status' });
    }
  };

  const handleUpdateVipStatus = async (userId: string, newStatus: string, email: string) => {
    if (!firestore) return;
    
    const isPremiumStatus = newStatus === 'PREMIUM' || newStatus === 'APPROVED';
    const subStatus = isPremiumStatus ? 'ACTIVE' : 'INACTIVE';

    try {
      await setDoc(doc(firestore, 'vipRequests', userId), { 
        status: newStatus,
        userId: userId,
        userEmail: email === '---' ? "" : email,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      await setDoc(doc(firestore, 'users', userId), { 
        subscriptionStatus: subStatus,
        email: email === '---' ? "" : email,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({ 
        title: 'Plano Atualizado', 
        description: `Status alterado para: ${newStatus}` 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao alterar plano' });
    }
  };

  const handleUpdateRating = async (userId: string, rating: number) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'users', userId), { 
        rating: rating,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: 'Avaliação Atualizada', description: `${rating} estrelas atribuídas.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao avaliar' });
    }
  };

  const handleResetPassword = async (email: string) => {
    if (email === '---') {
        toast({ variant: 'destructive', title: 'E-mail Indisponível' });
        return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'E-mail Enviado', description: `Link enviado para ${email}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao enviar e-mail' });
    }
  };

  const handleDeleteUser = async () => {
    if (!firestore || !deleteUserId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'users', deleteUserId));
      await deleteDoc(doc(firestore, 'vipRequests', deleteUserId)).catch(() => {});
      
      toast({ title: 'Registo Excluído', description: 'O utilizador foi removido permanentemente do Firestore.' });
      setDeleteUserId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao eliminar' });
    } finally {
      setIsDeleting(false);
    }
  };

  const mergedUsers = useMemo(() => {
    if (!rawUsers && !rawRequests) return [];
    
    const allIds = new Set([
      ...(rawUsers?.map(u => u.id) || []),
      ...(rawRequests?.map(r => r.id) || [])
    ]);

    return Array.from(allIds).map(id => {
      const u = rawUsers?.find(userDoc => userDoc.id === id);
      const r = rawRequests?.find(reqDoc => reqDoc.id === id);

      const email = u?.email || r?.userEmail || (r as any).email || '---';
      const vipStatus = r?.status || 'NENHUM';
      
      const isPremium = vipStatus === 'PREMIUM' || vipStatus === 'APPROVED';
      const isPending = vipStatus === 'PENDING';
      const isAwaitingDeposit = vipStatus === 'AWAITING_DEPOSIT';
      const isDepositPending = vipStatus === 'DEPOSIT_PENDING';
      const isRejected = vipStatus === 'REJECTED';

      let planLabel = vipStatus === 'NENHUM' ? 'VIP' : vipStatus;
      if (isPremium) planLabel = 'PREMIUM';
      if (isAwaitingDeposit) planLabel = 'AGUARD. DEPÓSITO';
      if (isDepositPending) planLabel = 'DEPÓSITO PENDENTE';
      if (isRejected) planLabel = 'RECUSADO';

      const createdAt = u?.createdAt || r?.submittedAt || null;
      
      // Lógica para selo NOVO (8 dias)
      let isNew = false;
      let diffDays = 0;
      if (createdAt) {
          const date = (createdAt as any).seconds ? new Date((createdAt as any).seconds * 1000) : new Date(createdAt as any);
          const diffTime = Math.abs(Date.now() - date.getTime());
          diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          isNew = diffDays <= 8;
      }

      return {
        id,
        email,
        createdAt,
        lastActivity: u?.updatedAt || r?.updatedAt || u?.createdAt || r?.submittedAt || null,
        brokerId: r?.brokerId || '---',
        accountStatus: u?.accountStatus || 'ACTIVE',
        subscriptionStatus: planLabel,
        rawStatus: vipStatus,
        rating: u?.rating || 0,
        isPremium,
        isPending,
        isAwaitingDeposit,
        isDepositPending,
        isRejected,
        isNew,
        daysSince: diffDays,
        displayName: u?.displayName || (r as any).userName || null,
        isGhost: !u
      };
    })
    .filter(u => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        u.email?.toLowerCase().includes(search) || 
        u.brokerId?.toLowerCase().includes(search) ||
        u.id.toLowerCase().includes(search)
      );

      if (!matchesSearch) return false;
      
      if (activeFilter === 'PENDING') return u.isPending || u.isDepositPending || u.isAwaitingDeposit;
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
      
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawUsers, rawRequests, searchTerm, sortConfig, activeFilter]);

  const stats = useMemo(() => {
    return {
        total: mergedUsers.length,
        pending: mergedUsers.filter(u => u.isPending || u.isDepositPending || u.isAwaitingDeposit).length,
        premium: mergedUsers.filter(u => u.isPremium).length,
        suspended: mergedUsers.filter(u => u.accountStatus === 'DISABLED').length,
        rejected: mergedUsers.filter(u => u.isRejected).length,
    };
  }, [mergedUsers]);

  const formatDate = (ts: any) => {
    if (!ts) return '---';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const handleExportCSV = () => {
    const headers = ['Data/Hora', 'E-mail', 'ID Corretora', 'Status', 'Plano', 'Avaliação', 'UID'];
    const rows = mergedUsers.map(u => [
        formatDate(u.createdAt),
        u.email,
        u.brokerId,
        u.accountStatus === 'DISABLED' ? 'SUSPENSO' : 'ATIVO',
        u.subscriptionStatus,
        `${u.rating} Estrelas`,
        u.id
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `membros_estrategia_chinesa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-3 w-3 text-primary" /> : <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
  };

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getPlanBadgeStyles = (status: string, rawStatus: string) => {
    if (rawStatus === 'PREMIUM' || rawStatus === 'APPROVED') {
      return 'bg-purple-600 hover:bg-purple-700 text-white border-purple-400/30';
    }
    if (rawStatus === 'PENDING') {
      return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400/30';
    }
    if (rawStatus === 'AWAITING_DEPOSIT') {
      return 'bg-cyan-500 hover:bg-cyan-600 text-black border-cyan-400/30';
    }
    if (rawStatus === 'DEPOSIT_PENDING') {
      return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400/30';
    }
    if (rawStatus === 'REJECTED') {
        return 'bg-red-600 hover:bg-red-700 text-white border-red-400/30';
    }
    return 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-400/30';
  };

  const renderRatingStars = (userId: string, currentRating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleUpdateRating(userId, star)}
            className="focus:outline-none group/star"
          >
            <Star 
              className={cn(
                "h-3.5 w-3.5 transition-all",
                star <= currentRating 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-zinc-600 hover:text-yellow-400/50"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-body">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-headline font-black tracking-tight uppercase">Gestão Estratégia Chinesa</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-full border border-white/10 hover:bg-white/5">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        
        {/* STATS BAR - ORDEM: Pendentes / Total Visitas / Cliques Checkout / Total Membros / Premium / Recusados / Suspensos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
             {[
                 { label: 'Pendentes', value: stats.pending, icon: Timer, color: 'text-orange-500' },
                 { label: 'Total Visitas', value: config?.visitCount || 0, icon: Eye, color: 'text-emerald-500' },
                 { label: 'Cliques Checkout', value: config?.checkoutClickCount || 0, icon: MousePointer2, color: 'text-blue-400' },
                 { label: 'Total Membros', value: stats.total, icon: Users, color: 'text-primary' },
                 { label: 'Premium', value: stats.premium, icon: Star, color: 'text-purple-500' },
                 { label: 'Recusados', value: stats.rejected, icon: Ban, color: 'text-red-500' },
                 { label: 'Suspensos', value: stats.suspended, icon: ShieldOff, color: 'text-zinc-500' },
             ].map((s, i) => (
                <Card key={i} className="bg-card/30 border-white/5 p-4 flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-white/5 ${s.color}`}>
                        <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[0.6rem] font-black uppercase tracking-widest opacity-40">{s.label}</p>
                        <p className="text-xl font-headline font-black">{s.value}</p>
                    </div>
                </Card>
             ))}
        </div>

        {/* GLOBAL CONFIGS SECTION */}
        <Card className="bg-card/40 border-white/5 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">Configurações Globais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold text-muted-foreground uppercase flex items-center gap-2">
                <LockKeyhole className="h-3 w-3" /> Chave de Registo (Secret)
              </Label>
              <Input 
                value={regSecret} 
                onChange={(e) => setRegSecret(e.target.value)}
                className="bg-white/5 border-white/10 h-11 rounded-xl font-mono text-sm"
                placeholder="Ex: chines_2026"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[0.65rem] font-bold text-muted-foreground uppercase flex items-center gap-2">
                <Activity className="h-3 w-3" /> Limite Trades (Hora)
              </Label>
              <Input 
                type="number"
                value={signalLimit} 
                onChange={(e) => setSignalLimit(parseInt(e.target.value))}
                className="bg-white/5 border-white/10 h-11 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-[0.65rem] font-bold text-muted-foreground uppercase flex items-center gap-2">
                <Zap className="h-3 w-3" /> Inverter Sinais
              </Label>
              <div className="h-11 flex items-center px-4 bg-white/5 border border-white/10 rounded-xl justify-between">
                <span className="text-xs font-medium">{invertSignals ? 'ATIVO' : 'DESATIVO'}</span>
                <Switch 
                  checked={invertSignals} 
                  onCheckedChange={setInvertSignals} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveConfigs} 
              disabled={isConfigSaving}
              className="h-11 rounded-xl font-black uppercase tracking-tighter bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/10"
            >
              {isConfigSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Salvar Configs</>}
            </Button>
          </div>
        </Card>

        {/* QUICK FILTERS AND EXPORT */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-end justify-between">
            <div className="flex flex-col gap-4 w-full xl:w-auto">
                <Label className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground opacity-60">Filtros Rápidos</Label>
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'ALL', label: 'Todos', icon: UserCircle },
                        { id: 'PENDING', label: 'Pendentes', icon: Timer },
                        { id: 'PREMIUM', label: 'Premium', icon: Zap },
                        { id: 'REJECTED', label: 'Recusados', icon: Ban },
                        { id: 'SUSPENDED', label: 'Suspensos', icon: ShieldAlert },
                    ].map((f) => (
                        <Button 
                            key={f.id}
                            variant={activeFilter === f.id ? 'default' : 'outline'}
                            onClick={() => setActiveFilter(f.id as QuickFilter)}
                            className={`h-10 px-4 rounded-xl border-white/5 flex items-center gap-2 transition-all ${
                                activeFilter === f.id ? 'bg-primary text-black shadow-lg shadow-primary/10' : 'bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            <f.icon className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{f.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                 <div className="relative flex-grow sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                    placeholder="E-mail ou ID..." 
                    className="pl-10 rounded-xl bg-white/5 border-white/10 h-11" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button 
                    variant="outline" 
                    onClick={handleExportCSV}
                    className="h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 px-6 font-bold"
                >
                    <Download className="h-4 w-4 mr-2" /> Exportar CSV
                </Button>
            </div>
        </div>

        {/* MEMBERS TABLE */}
        <Card className="bg-card/40 border-white/5 overflow-hidden rounded-2xl">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <h2 className="text-sm font-black uppercase tracking-widest">Membros Estratégia Chinesa</h2>
                 <Badge variant="outline" className="text-[0.6rem] h-5 py-0 border-primary/20 text-primary/70">SYNC REALTIME</Badge>
            </div>
            <p className="text-[0.6rem] text-muted-foreground uppercase font-bold">{mergedUsers.length} registos filtrados</p>
          </div>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Registo {renderSortIcon('createdAt')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('email')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Membro {renderSortIcon('email')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('brokerId')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">ID Corretora {renderSortIcon('brokerId')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('rating')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Avaliação {renderSortIcon('rating')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('accountStatus')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Status {renderSortIcon('accountStatus')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('subscriptionStatus')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Plano {renderSortIcon('subscriptionStatus')}</div>
                </TableHead>
                <TableHead className="text-right text-[0.6rem] uppercase font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedUsers.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="text-[0.7rem] opacity-60 font-mono">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-bold">{u.email}</span>
                           {u.isNew && (
                              <Badge className="bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[0.5rem] px-1.5 h-4 font-black tracking-widest uppercase">
                                <Sparkles className="h-2 w-2 mr-0.5 fill-emerald-500" /> NOVO {u.daysSince}D
                              </Badge>
                           )}
                           {u.isGhost && <Badge variant="outline" className="text-[0.5rem] h-4 py-0 border-primary/20 text-primary/50">LEAD AUTH</Badge>}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[0.55rem] text-muted-foreground uppercase font-black opacity-40">Última Ativ:</span>
                            <span className="text-[0.55rem] text-muted-foreground font-bold">{formatDate(u.lastActivity)}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-primary font-bold">{u.brokerId}</TableCell>
                  <TableCell>
                    {renderRatingStars(u.id, u.rating)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                          <Badge 
                            variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'} 
                            className="cursor-pointer text-[0.6rem] font-black tracking-tighter px-2 py-0.5"
                          >
                            {u.accountStatus === 'DISABLED' ? 'SUSPENSO' : 'ATIVA'}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-black/95 border-white/10">
                        <DropdownMenuItem onClick={() => handleToggleAccount(u.id, u.accountStatus, u.email)} className="text-xs font-bold">
                           {u.accountStatus === 'DISABLED' ? <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" /> : <ShieldAlert className="h-3 w-3 mr-2 text-destructive" />}
                           {u.accountStatus === 'DISABLED' ? 'Ativar Conta' : 'Suspender Conta'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                          <Badge 
                            className={`cursor-pointer text-[0.6rem] font-black tracking-tighter shadow-md px-2 py-0.5 border ${getPlanBadgeStyles(u.subscriptionStatus, u.rawStatus)}`}
                          >
                            {u.subscriptionStatus}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-black/95 border-white/10 w-56">
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'APPROVED', u.email)} className="text-xs font-bold text-purple-400">
                           <UserCheck className="h-3 w-3 mr-2" /> Aprovar para PREMIUM
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'DEPOSIT_PENDING', u.email)} className="text-xs text-blue-400">
                           <RefreshCw className="h-3 w-3 mr-2" /> Mudar: Depósito Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'AWAITING_DEPOSIT', u.email)} className="text-xs text-cyan-400">
                           <Timer className="h-3 w-3 mr-2" /> Mudar: Aguard. Depósito
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'PENDING', u.email)} className="text-xs text-orange-500">
                           <RefreshCw className="h-3 w-3 mr-2" /> Mudar: Pendente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'VIP', u.email)} className="text-xs text-yellow-500">
                           <Zap className="h-3 w-3 mr-2" /> Tornar VIP (Reset)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={() => handleUpdateVipStatus(u.id, 'REJECTED', u.email)} className="text-xs text-red-500 font-bold">
                           <Ban className="h-3 w-3 mr-2" /> Recusar / Rebaixar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-white/10 w-48">
                        <DropdownMenuItem onClick={() => handleResetPassword(u.email)} className="text-xs">
                          <Mail className="h-3.5 w-3.5 mr-2 opacity-60" /> Redefinir Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAccount(u.id, u.accountStatus, u.email)} className="text-xs">
                          {u.accountStatus === 'DISABLED' ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" /> Ativar Conta</>
                          ) : (
                            <><ShieldAlert className="h-3.5 w-3.5 mr-2 text-destructive" /> Suspender Conta</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-destructive text-xs font-bold" onClick={() => setDeleteUserId(u.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Registo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {mergedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Search className="h-12 w-12" />
                      <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhum registo encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </main>

      <AlertDialog open={!!deleteUserId} onOpenChange={(isOpen) => !isOpen && !isDeleting && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-[#0d0d0d] border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-headline font-black uppercase tracking-tight">Excluir Registo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Esta ação é **irreversível**. O registo será removido permanentemente do Firestore (Perfil e Pedido VIP).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl border-white/5">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={isDeleting} 
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl px-8"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
