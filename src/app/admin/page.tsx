
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  LayoutDashboard,
  LogOut,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  MoreHorizontal,
  Key,
  UserMinus,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Eye,
  Info,
  ExternalLink,
  ShieldAlert,
  UserCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
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
import { useToast } from '@/hooks/use-toast';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';

const ADMIN_EMAILS = ['chines@trader.com', 'estrategiachinesa@gmail.com'];

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function AdminDashboard() {
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useAffiliateRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort States
  const [userSort, setUserSort] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [requestSort, setRequestSort] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });

  // States for modals
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [detailsUser, setDetailsUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

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

  // Authorized check redirect
  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, isUserLoading, router]);

  const handleUpdateStatus = async (requestId: string, userId: string, newStatus: string) => {
    if (!firestore) return;

    try {
      const requestRef = doc(firestore, 'vipRequests', requestId);
      await updateDoc(requestRef, { status: newStatus });

      if (newStatus === 'PREMIUM' || newStatus === 'APPROVED') {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, { subscriptionStatus: 'ACTIVE' });
      } else if (newStatus === 'REJECTED') {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, { subscriptionStatus: 'INACTIVE' });
      }

      toast({
        title: 'Status Atualizado',
        description: `O pedido foi marcado como ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível completar a ação.',
      });
    }
  };

  const handleUpdateUserSubscription = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (!firestore) return;

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, { subscriptionStatus: newStatus });

      toast({
        title: 'Assinatura Atualizada',
        description: `O usuário agora é ${newStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'}.`,
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar a assinatura.',
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'E-mail enviado',
        description: `Um link de redefinição de senha foi enviado para ${email}.`,
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar o e-mail de redefinição.',
      });
    }
  };

  const handleToggleUserAccountStatus = async (userId: string, currentStatus: string | undefined) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, { accountStatus: newStatus });

      toast({
        title: newStatus === 'DISABLED' ? 'Conta Suspensa' : 'Conta Ativada',
        description: `O status da conta foi alterado com sucesso.`,
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na operação',
        description: 'Não foi possível alterar o status administrativo.',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!firestore || !deleteUserId) return;
    setIsDeleting(true);

    try {
      const userRef = doc(firestore, 'users', deleteUserId);
      await deleteDoc(userRef);

      toast({
        title: 'Usuário Excluído',
        description: 'O registro foi removido do banco de dados.',
      });
      setDeleteUserId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o usuário.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Sort Logic for Users (Enhanced with merged Request data)
  const sortedUsers = useMemo(() => {
    if (!rawUsers) return [];
    
    const merged = rawUsers.map(u => {
        const req = rawRequests?.find(r => r.id === u.id);
        return {
            ...u,
            brokerId: req?.brokerId || '---',
            requestStatus: req?.status || 'NONE'
        }
    });

    let filtered = merged.filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.brokerId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let valA: any = a[userSort.key as keyof typeof a];
      let valB: any = b[userSort.key as keyof typeof b];

      if (valA?.seconds !== undefined) valA = valA.seconds;
      if (valB?.seconds !== undefined) valB = valB.seconds;

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (valA < valB) return userSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return userSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawUsers, rawRequests, searchTerm, userSort]);

  // Sort Logic for Requests
  const sortedRequests = useMemo(() => {
    if (!rawRequests) return [];
    
    return [...rawRequests].sort((a, b) => {
      let valA: any = a[requestSort.key as keyof typeof a];
      let valB: any = b[requestSort.key as keyof typeof b];

      if (valA?.seconds !== undefined) valA = valA.seconds;
      if (valB?.seconds !== undefined) valB = valB.seconds;

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (valA < valB) return requestSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return requestSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawRequests, requestSort]);

  const toggleUserSort = (key: string) => {
    setUserSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleRequestSort = (key: string) => {
    setRequestSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (config: SortConfig, key: string) => {
    if (config.key !== key) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 opacity-20" />;
    return config.direction === 'asc' ? <ChevronUp className="ml-2 h-3.5 w-3.5 text-primary" /> : <ChevronDown className="ml-2 h-3.5 w-3.5 text-primary" />;
  };

  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-headline uppercase tracking-widest text-xs">A autenticar comando...</p>
        </div>
      </div>
    );
  }

  const pendingRequestsCount = sortedRequests.filter(r => ['PENDING', 'DEPOSIT_PENDING', 'AWAITING_DEPOSIT'].includes(r.status)).length;

  const formatDate = (ts: any) => {
      if (!ts) return '---';
      const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen bg-[#080808] text-foreground font-body selection:bg-primary/30">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-inner">
                <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h1 className="text-xl font-headline font-black leading-none tracking-tighter">CENTRAL DE COMANDO</h1>
                <p className="text-[0.55rem] text-primary/60 uppercase tracking-[0.3em] font-black mt-1">Estratégia Chinesa OS v4.0</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[0.6rem] font-black text-primary uppercase tracking-tighter">Administrador Master</span>
              <span className="text-xs text-muted-foreground opacity-80">{user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-xl border border-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all px-4">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest">Base de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter">{isUsersLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : rawUsers?.length || 0}</div>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-2 font-bold">Membros Registados</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Clock className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest">Aguardando Verificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter text-yellow-500">{isRequestsLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary"/> : pendingRequestsCount}</div>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-2 font-bold">Solicitações Pendentes</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest">Contas Bloqueadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tighter text-destructive">
                {rawUsers?.filter(u => u.accountStatus === 'DISABLED').length || 0}
              </div>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-2 font-bold">Acessos Suspensos</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="h-16 w-16 text-green-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest">Estado da Rede</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <div className="text-4xl font-black tracking-tighter text-green-500">ACTIVE</div>
              </div>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-2 font-bold">Monitorização em tempo real</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <TabsList className="bg-white/5 p-1.5 border border-white/5 rounded-2xl">
                <TabsTrigger value="requests" className="rounded-xl px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold transition-all text-xs uppercase tracking-widest">Solicitações VIP</TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold transition-all text-xs uppercase tracking-widest">Lista de Membros</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Pesquisar por e-mail, nome ou ID da corretora..." 
                  className="pl-12 h-12 rounded-2xl bg-card/20 border-white/5 focus:ring-primary/20 focus:border-primary/30 transition-all text-sm" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
          </div>

          <TabsContent value="requests" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/40 border-white/5 overflow-hidden rounded-3xl shadow-2xl shadow-black/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="cursor-pointer py-5 pl-8" onClick={() => toggleRequestSort('userEmail')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Identificador {renderSortIcon(requestSort, 'userEmail')}</div>
                      </TableHead>
                      <TableHead className="text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Cód. Corretora</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleRequestSort('status')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Estado Atual {renderSortIcon(requestSort, 'status')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleRequestSort('submittedAt')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Data/Hora {renderSortIcon(requestSort, 'submittedAt')}</div>
                      </TableHead>
                      <TableHead className="text-right text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground pr-8">Comandos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRequestsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary/40" /></TableCell></TableRow>
                    ) : sortedRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground font-bold uppercase tracking-widest opacity-50">Sem registos encontrados</TableCell></TableRow>
                    ) : (
                      sortedRequests.map((req) => (
                        <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-all group">
                          <TableCell className="py-5 pl-8">
                            <div className="font-bold text-sm text-foreground/90 group-hover:text-primary transition-colors">{req.userEmail}</div>
                            <div className="text-[0.6rem] font-mono text-muted-foreground/40 mt-0.5">{req.userId}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-black text-primary/80 bg-primary/5 rounded-lg px-2 py-1 inline-block mt-4 ml-4 border border-primary/10">
                            {req.brokerId}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                  <Badge className="cursor-pointer px-4 py-1.5 rounded-full text-[0.6rem] font-black border-none transition-all hover:scale-105 active:scale-95" variant={
                                    req.status === 'PREMIUM' || req.status === 'APPROVED' ? 'success' :
                                    req.status === 'REJECTED' ? 'destructive' :
                                    req.status === 'PENDING' ? 'secondary' : 'outline'
                                  }>
                                    {req.status} <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl w-56 p-2">
                                <DropdownMenuLabel className="text-[0.55rem] uppercase tracking-[0.3em] font-black opacity-30 px-3 py-2">Alterar Status Fluxo</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-white/10 cursor-pointer" onClick={() => handleUpdateStatus(req.id, req.userId, 'PENDING')}>PENDING</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-white/10 cursor-pointer" onClick={() => handleUpdateStatus(req.id, req.userId, 'AWAITING_DEPOSIT')}>AWAITING_DEPOSIT</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-white/10 cursor-pointer" onClick={() => handleUpdateStatus(req.id, req.userId, 'DEPOSIT_PENDING')}>DEPOSIT_PENDING</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-green-500/20 text-green-500 font-black cursor-pointer" onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}>PREMIUM (Ativar Tudo)</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-destructive/20 text-destructive font-black cursor-pointer" onClick={() => handleUpdateStatus(req.id, req.userId, 'REJECTED')}>REJECTED</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="text-[0.7rem] text-muted-foreground font-bold tracking-tight">
                            {formatDate(req.submittedAt)}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            {(req.status === 'PENDING' || req.status === 'DEPOSIT_PENDING' || req.status === 'AWAITING_DEPOSIT') && (
                              <Button 
                                size="sm" 
                                className="h-9 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-[0.65rem] font-black uppercase tracking-widest shadow-lg shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                                onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Aprovar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/40 border-white/5 overflow-hidden rounded-3xl shadow-2xl shadow-black/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="cursor-pointer py-5 pl-8" onClick={() => toggleUserSort('email')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Membro Identificado {renderSortIcon(userSort, 'email')}</div>
                      </TableHead>
                      <TableHead className="text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">ID Broker</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleUserSort('subscriptionStatus')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Plano {renderSortIcon(userSort, 'subscriptionStatus')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleUserSort('accountStatus')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Acesso {renderSortIcon(userSort, 'accountStatus')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleUserSort('createdAt')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground">Criação {renderSortIcon(userSort, 'createdAt')}</div>
                      </TableHead>
                      <TableHead className="text-right text-[0.65rem] uppercase font-black tracking-[0.2em] text-muted-foreground pr-8">Gestão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary/40" /></TableCell></TableRow>
                    ) : sortedUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-bold uppercase tracking-widest opacity-50">Central de dados vazia</TableCell></TableRow>
                    ) : (
                      sortedUsers.map((u) => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all group">
                          <TableCell className="py-5 pl-8">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                                    <UserCircle className="h-5 w-5 text-muted-foreground/60" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-foreground/90 group-hover:text-primary transition-colors">{u.displayName || 'Sem Nome'}</div>
                                    <div className="text-[0.6rem] text-muted-foreground/50 font-bold tracking-tight">{u.email}</div>
                                </div>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="font-mono text-xs text-primary/60 font-black tracking-widest bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                                {u.brokerId}
                             </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                  <Badge className="cursor-pointer px-4 py-1.5 rounded-full text-[0.6rem] font-black border-none transition-all hover:scale-105 active:scale-95 shadow-inner" variant={u.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                                    {u.subscriptionStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'} <ChevronDown className="h-2.5 w-2.5 ml-2 opacity-50" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl w-48 p-2">
                                <DropdownMenuLabel className="text-[0.55rem] uppercase tracking-[0.3em] font-black opacity-30 px-3 py-2">Alterar Hierarquia</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-green-500/20 cursor-pointer p-3" onClick={() => handleUpdateUserSubscription(u.id, 'ACTIVE')}>
                                  <UserCheck className="h-4 w-4 mr-3 text-green-500" /> Ativar PREMIUM
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs rounded-xl focus:bg-white/10 cursor-pointer p-3" onClick={() => handleUpdateUserSubscription(u.id, 'INACTIVE')}>
                                  <UserX className="h-4 w-4 mr-3 text-muted-foreground" /> Rebaixar para VIP
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'} className="text-[0.55rem] font-black border-none px-3 py-1 tracking-widest rounded-full">
                              {u.accountStatus === 'DISABLED' ? 'SUSPENSO' : 'ATIVO'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[0.7rem] text-muted-foreground font-bold tracking-tight">
                             {formatDate(u.createdAt)}
                          </TableCell>
                          <TableCell className="text-right pr-8">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/5 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all" onClick={() => setDetailsUser(u)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-white/5">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-2xl border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl w-60 p-2">
                                    <DropdownMenuLabel className="text-[0.55rem] uppercase tracking-[0.3em] font-black opacity-30 px-3 py-2">Comandos Master</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem className="text-xs rounded-xl focus:bg-white/10 cursor-pointer p-3" onClick={() => handleResetPassword(u.email)}>
                                        <Key className="h-4 w-4 mr-3 text-primary" /> Redefinir Senha
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs rounded-xl focus:bg-white/10 cursor-pointer p-3" onClick={() => handleToggleUserAccountStatus(u.id, u.accountStatus)}>
                                        {u.accountStatus === 'DISABLED' ? (
                                        <>
                                            <UserCheck className="h-4 w-4 mr-3 text-green-500" /> Reativar Acesso
                                        </>
                                        ) : (
                                        <>
                                            <ShieldAlert className="h-4 w-4 mr-3 text-destructive" /> Suspender Conta
                                        </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem 
                                        className="text-xs rounded-xl focus:bg-destructive/20 text-destructive font-black cursor-pointer p-3"
                                        onClick={() => setDeleteUserId(u.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-3" /> APAGAR REGISTO
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Details Dialog */}
      <Dialog open={!!detailsUser} onOpenChange={() => setDetailsUser(null)}>
        <DialogContent className="max-w-2xl bg-[#0d0d0d] border-white/10 rounded-[2rem] shadow-2xl overflow-hidden p-0">
          <div className="bg-primary/5 border-b border-white/5 p-8 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <UserCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                  <DialogTitle className="text-2xl font-headline font-black tracking-tight">Dossiê do Membro</DialogTitle>
                  <p className="text-[0.65rem] uppercase tracking-[0.4em] font-black text-primary/60">Análise técnica de perfil no sistema</p>
              </div>
          </div>
          
          {detailsUser && (
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-[0.55rem] font-black text-primary uppercase mb-2 tracking-widest">Credencial de Login</p>
                            <p className="text-sm font-bold truncate">{detailsUser.email}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-[0.55rem] font-black text-primary uppercase mb-2 tracking-widest">Nome Identificado</p>
                            <p className="text-sm font-bold">{detailsUser.displayName || 'Não preenchido'}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-[0.55rem] font-black text-primary uppercase mb-2 tracking-widest">Firebase UID (Sistémico)</p>
                            <p className="text-[0.6rem] font-mono opacity-40 break-all leading-tight">{detailsUser.id}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-inner">
                            <p className="text-[0.55rem] font-black text-primary uppercase mb-2 tracking-widest">Código na Corretora</p>
                            <p className="text-xl font-mono font-black text-primary tracking-widest">{detailsUser.brokerId}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-[0.55rem] font-black text-primary uppercase mb-2 tracking-widest">Data de Nascimento (Sistema)</p>
                            <p className="text-sm font-bold">{formatDate(detailsUser.createdAt)}</p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                            <p className="text-[0.55rem] font-black text-primary uppercase mb-2 tracking-widest">Termos e Condições</p>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold flex items-center gap-2">
                                    {detailsUser.termsAccepted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <ShieldAlert className="h-4 w-4 text-red-500" />}
                                    {detailsUser.termsAccepted ? 'ACEITOS' : 'PENDENTES'} 
                                </p>
                                <span className="text-[0.6rem] text-muted-foreground/60 font-bold">EM {formatDate(detailsUser.termsAcceptedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {detailsUser.lastHotmartStatus && (
                    <div className="p-6 bg-green-500/5 rounded-2xl border border-green-500/10 flex items-center justify-between">
                        <div>
                            <p className="text-[0.55rem] font-black text-green-500 uppercase mb-1 tracking-[0.2em]">Sincronização Hotmart</p>
                            <span className="text-sm font-black uppercase">{detailsUser.lastHotmartStatus}</span>
                        </div>
                        <div className="text-right">
                             <p className="text-[0.5rem] font-black text-muted-foreground uppercase mb-1">Último Postback</p>
                             <span className="text-[0.65rem] font-bold text-muted-foreground/60">{formatDate(detailsUser.lastHotmartUpdate)}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button variant="secondary" onClick={() => setDetailsUser(null)} className="rounded-xl h-11 px-10 font-black text-xs uppercase tracking-widest shadow-xl">Fechar Dossiê</Button>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => !isDeleting && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-[#0d0d0d] border-destructive/20 rounded-[2rem] p-10">
          <AlertDialogHeader>
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6 border border-destructive/20">
                <Trash2 className="h-10 w-10 text-destructive animate-pulse" />
            </div>
            <AlertDialogTitle className="text-2xl font-headline font-black text-center tracking-tight">
              ELIMINAR REGISTO?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground text-sm font-medium leading-relaxed px-4">
              Esta ação é <strong>irreversível</strong>. O utilizador será removido da base de dados e o acesso será cortado imediatamente em todos os dispositivos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl h-12 flex-1 font-bold border-white/5">ABORTAR</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12 flex-1 font-black shadow-lg shadow-destructive/20"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SIM, APAGAR AGORA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
