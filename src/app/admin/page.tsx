
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
  ExternalLink
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
        title: newStatus === 'DISABLED' ? 'Conta Desativada' : 'Conta Ativada',
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
    
    // Merge brokerId if request exists
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
    if (config.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return config.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4 text-primary" /> : <ChevronDown className="ml-2 h-4 w-4 text-primary" />;
  };

  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Autenticando...</p>
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
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
                <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h1 className="text-lg font-headline font-bold leading-tight">Admin</h1>
                <p className="text-[0.65rem] text-muted-foreground uppercase tracking-widest font-bold">Gerenciamento Estratégia Chinesa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[0.6rem] font-bold text-primary uppercase tracking-tighter">Administrador Logado</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => auth.signOut()} className="rounded-full border-border/50">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/30 border-border/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-primary/50" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{isUsersLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : rawUsers?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-border/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pedidos em Aberto</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500/50" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-yellow-500">{isRequestsLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : pendingRequestsCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/30 border-border/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status do Servidor</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500/50" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="text-3xl font-black text-green-500">LIVE</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <TabsList className="bg-muted/10 p-1 border border-border/20 rounded-xl">
                <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Solicitações VIP</TabsTrigger>
                <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Banco de Dados</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Pesquisar e-mail, nome ou ID..." 
                  className="pl-10 h-10 rounded-xl bg-card/20 border-border/40 focus:ring-primary/20" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
          </div>

          <TabsContent value="requests">
            <Card className="bg-card/40 border-border/40 overflow-hidden rounded-2xl shadow-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="hover:bg-transparent border-border/20">
                      <TableHead className="cursor-pointer py-4" onClick={() => toggleRequestSort('userEmail')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">E-mail {renderSortIcon(requestSort, 'userEmail')}</div>
                      </TableHead>
                      <TableHead className="text-[0.65rem] uppercase font-black tracking-widest">ID Corretora</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleRequestSort('status')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">Status Atual {renderSortIcon(requestSort, 'status')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleRequestSort('submittedAt')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">Data Submissão {renderSortIcon(requestSort, 'submittedAt')}</div>
                      </TableHead>
                      <TableHead className="text-right text-[0.65rem] uppercase font-black tracking-widest pr-6">Ações Rápidas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRequestsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : sortedRequests.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-medium">Nenhuma solicitação encontrada.</TableCell></TableRow>
                    ) : (
                      sortedRequests.map((req) => (
                        <TableRow key={req.id} className="border-border/10 hover:bg-muted/5 transition-colors">
                          <TableCell className="py-4">
                            <div className="font-bold text-sm">{req.userEmail}</div>
                            <div className="text-[0.6rem] font-mono text-muted-foreground opacity-50">{req.userId}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-primary/80">{req.brokerId}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                  <Badge className="cursor-pointer px-3 py-1 rounded-full text-[0.6rem] font-black border-none" variant={
                                    req.status === 'PREMIUM' || req.status === 'APPROVED' ? 'success' :
                                    req.status === 'REJECTED' ? 'destructive' :
                                    req.status === 'PENDING' ? 'secondary' : 'outline'
                                  }>
                                    {req.status} <ChevronDown className="h-2 w-2 ml-1" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-xl border-border/50">
                                <DropdownMenuLabel className="text-[0.6rem] uppercase tracking-widest opacity-50">Mudar Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-xs" onClick={() => handleUpdateStatus(req.id, req.userId, 'PENDING')}>PENDING</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs" onClick={() => handleUpdateStatus(req.id, req.userId, 'AWAITING_DEPOSIT')}>AWAITING_DEPOSIT</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs" onClick={() => handleUpdateStatus(req.id, req.userId, 'DEPOSIT_PENDING')}>DEPOSIT_PENDING</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs text-green-500 font-bold" onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}>PREMIUM (Ativar)</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs text-destructive font-bold" onClick={() => handleUpdateStatus(req.id, req.userId, 'REJECTED')}>REJECTED</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="text-[0.7rem] text-muted-foreground font-medium">
                            {formatDate(req.submittedAt)}
                          </TableCell>
                          <TableCell className="text-right space-x-2 pr-6">
                            {(req.status === 'PENDING' || req.status === 'DEPOSIT_PENDING' || req.status === 'AWAITING_DEPOSIT') && (
                              <Button 
                                size="sm" 
                                className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-[0.65rem] font-black uppercase tracking-tighter"
                                onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1.5" /> Aprovar
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

          <TabsContent value="users">
            <Card className="bg-card/40 border-border/40 overflow-hidden rounded-2xl shadow-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="hover:bg-transparent border-border/20">
                      <TableHead className="cursor-pointer py-4" onClick={() => toggleUserSort('email')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">Membro {renderSortIcon(userSort, 'email')}</div>
                      </TableHead>
                      <TableHead className="text-[0.65rem] uppercase font-black tracking-widest">ID Corretora</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleUserSort('subscriptionStatus')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">Plano {renderSortIcon(userSort, 'subscriptionStatus')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleUserSort('accountStatus')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">Status {renderSortIcon(userSort, 'accountStatus')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleUserSort('createdAt')}>
                        <div className="flex items-center text-[0.65rem] uppercase font-black tracking-widest">Cadastro {renderSortIcon(userSort, 'createdAt')}</div>
                      </TableHead>
                      <TableHead className="text-right text-[0.65rem] uppercase font-black tracking-widest pr-6">Gestão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : sortedUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">Nenhum membro registrado.</TableCell></TableRow>
                    ) : (
                      sortedUsers.map((u) => (
                        <TableRow key={u.id} className="border-border/10 hover:bg-muted/5 transition-colors">
                          <TableCell className="py-4">
                            <div className="font-bold text-sm">{u.displayName || 'Sem Nome'}</div>
                            <div className="text-[0.65rem] text-muted-foreground opacity-70">{u.email}</div>
                          </TableCell>
                          <TableCell>
                             <div className="font-mono text-xs text-primary/60 font-bold">{u.brokerId}</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                  <Badge className="cursor-pointer px-3 py-1 rounded-full text-[0.6rem] font-black border-none" variant={u.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                                    {u.subscriptionStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'} <ChevronDown className="h-2 w-2 ml-1" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="rounded-xl border-border/50">
                                <DropdownMenuLabel className="text-[0.6rem] uppercase tracking-widest opacity-50">Alterar Plano</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-xs" onClick={() => handleUpdateUserSubscription(u.id, 'ACTIVE')}>
                                  <UserCheck className="h-4 w-4 mr-2 text-green-500" /> Ativar PREMIUM
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs" onClick={() => handleUpdateUserSubscription(u.id, 'INACTIVE')}>
                                  <UserX className="h-4 w-4 mr-2 text-muted-foreground" /> Rebaixar para VIP
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'} className="text-[0.55rem] font-black border-none px-2">
                              {u.accountStatus === 'DISABLED' ? 'BLOQUEADA' : 'ATIVA'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[0.7rem] text-muted-foreground font-medium">
                             {formatDate(u.createdAt)}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                             <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => setDetailsUser(u)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                                    <DropdownMenuLabel className="text-[0.6rem] uppercase tracking-widest opacity-50">Comandos</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-xs" onClick={() => handleResetPassword(u.email)}>
                                        <Key className="h-4 w-4 mr-2 text-primary/70" /> Redefinir Senha
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-xs" onClick={() => handleToggleUserAccountStatus(u.id, u.accountStatus)}>
                                        {u.accountStatus === 'DISABLED' ? (
                                        <>
                                            <UserCheck className="h-4 w-4 mr-2 text-green-500" /> Ativar Acesso
                                        </>
                                        ) : (
                                        <>
                                            <UserMinus className="h-4 w-4 mr-2 text-yellow-500" /> Suspender Acesso
                                        </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-xs text-destructive font-bold"
                                        onClick={() => setDeleteUserId(u.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir Registro
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
        <DialogContent className="max-w-2xl bg-card border-border/40 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-headline">
              <Info className="text-primary h-5 w-5" />
              Dossiê do Membro
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-tighter font-bold opacity-50">
              Informações técnicas registradas no sistema
            </DialogDescription>
          </DialogHeader>
          
          {detailsUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                    <div className="p-3 bg-muted/10 rounded-xl border border-border/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">E-mail de Login</p>
                        <p className="text-sm font-bold truncate">{detailsUser.email}</p>
                    </div>
                    <div className="p-3 bg-muted/10 rounded-xl border border-border/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">Nome Exibido</p>
                        <p className="text-sm font-bold">{detailsUser.displayName || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-muted/10 rounded-xl border border-border/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">Firebase UID</p>
                        <p className="text-[0.65rem] font-mono opacity-60 break-all">{detailsUser.id}</p>
                    </div>
                </div>

                <div className="space-y-4">
                     <div className="p-3 bg-muted/10 rounded-xl border border-border/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">ID na Corretora</p>
                        <p className="text-sm font-mono font-bold text-yellow-500">{detailsUser.brokerId}</p>
                    </div>
                    <div className="p-3 bg-muted/10 rounded-xl border border-border/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">Data de Cadastro</p>
                        <p className="text-sm font-bold">{formatDate(detailsUser.createdAt)}</p>
                    </div>
                    <div className="p-3 bg-muted/10 rounded-xl border border-border/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">Aceite de Termos</p>
                        <p className="text-sm font-bold flex items-center gap-2">
                            {detailsUser.termsAccepted ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            {detailsUser.termsAccepted ? 'SIM' : 'NÃO'} 
                            <span className="text-[0.65rem] text-muted-foreground font-normal">({formatDate(detailsUser.termsAcceptedAt)})</span>
                        </p>
                    </div>
                </div>
                
                {detailsUser.lastHotmartStatus && (
                    <div className="md:col-span-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-[0.6rem] font-black text-primary uppercase mb-1">Integração Hotmart</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">Status: {detailsUser.lastHotmartStatus}</span>
                            <span className="text-[0.65rem] text-muted-foreground">Atualizado em: {formatDate(detailsUser.lastHotmartUpdate)}</span>
                        </div>
                    </div>
                )}
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setDetailsUser(null)} className="rounded-xl h-10 px-8 font-bold">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => !isDeleting && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-card border-border/50 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Excluir Permanente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Esta ação removerá o usuário do banco de dados e cortará o acesso dele imediatamente. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sim, Excluir Agora'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
