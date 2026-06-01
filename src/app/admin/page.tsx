
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  Loader2, 
  LogOut,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Key,
  Trash2,
  LayoutDashboard,
  UserCheck,
  UserX,
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [userSort, setUserSort] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [requestSort, setRequestSort] = useState<SortConfig>({ key: 'submittedAt', direction: 'desc' });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
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
      }
      toast({ title: 'Sucesso', description: `Status alterado para ${newStatus}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar.' });
    }
  };

  const handleToggleAccount = async (userId: string, currentStatus: string | undefined) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await updateDoc(doc(firestore, 'users', userId), { accountStatus: newStatus });
      toast({ title: 'Status Alterado', description: `Conta ${newStatus === 'DISABLED' ? 'Suspensa' : 'Ativada'}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status' });
    }
  };

  const handleUpdateSubscription = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', userId), { subscriptionStatus: newStatus });
      toast({ title: 'Plano Alterado', description: `Usuário agora é ${newStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao alterar plano' });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'E-mail Enviado', description: `Link de redefinição enviado para ${email}` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao enviar e-mail' });
    }
  };

  const handleDeleteUser = async () => {
    if (!firestore || !deleteUserId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore, 'users', deleteUserId));
      toast({ title: 'Utilizador Eliminado' });
      setDeleteUserId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao eliminar' });
    } finally {
      setIsDeleting(false);
    }
  };

  const mergedUsers = useMemo(() => {
    if (!rawUsers) return [];
    return rawUsers.map(u => {
      const req = rawRequests?.find(r => r.id === u.id);
      return {
        ...u,
        brokerId: req?.brokerId || '---',
        requestStatus: req?.status || 'NONE'
      };
    }).filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.brokerId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      let valA = a[userSort.key as keyof typeof a] as any;
      let valB = b[userSort.key as keyof typeof b] as any;
      if (valA?.seconds) valA = valA.seconds;
      if (valB?.seconds) valB = valB.seconds;
      if (valA < valB) return userSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return userSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawUsers, rawRequests, searchTerm, userSort]);

  const sortedRequests = useMemo(() => {
    if (!rawRequests) return [];
    return rawRequests.filter(r => 
      r.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.brokerId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      let valA = a[requestSort.key as keyof typeof a] as any;
      let valB = b[requestSort.key as keyof typeof b] as any;
      if (valA?.seconds) valA = valA.seconds;
      if (valB?.seconds) valB = valB.seconds;
      if (valA < valB) return requestSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return requestSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawRequests, searchTerm, requestSort]);

  const formatDate = (ts: any) => {
    if (!ts) return '---';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const renderSortIcon = (config: SortConfig, key: string) => {
    if (config.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return config.direction === 'asc' ? <ChevronUp className="ml-1 h-3 w-3 text-primary" /> : <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
  };

  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
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
            <h1 className="text-xl font-headline font-black tracking-tight">ADMIN GESTÃO</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-full border border-white/10">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Total Usuários</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black">{isUsersLoading ? '...' : rawUsers?.length || 0}</div></CardContent>
          </Card>
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Pedidos Pendentes</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-yellow-500">{isRequestsLoading ? '...' : rawRequests?.filter(r => ['PENDING', 'DEPOSIT_PENDING'].includes(r.status)).length || 0}</div></CardContent>
          </Card>
          <Card className="bg-card/40 border-white/5">
            <CardHeader className="pb-2"><CardTitle className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Contas Suspensas</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-black text-destructive">{rawUsers?.filter(u => u.accountStatus === 'DISABLED').length || 0}</div></CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <TabsList className="bg-white/5 p-1 rounded-full">
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="bg-transparent">
                <TabsTrigger value="requests" className="rounded-full px-6 data-[state=active]:bg-primary">Solicitações VIP</TabsTrigger>
                <TabsTrigger value="users" className="rounded-full px-6 data-[state=active]:bg-primary">Lista de Membros</TabsTrigger>
              </TabsList>
            </Tabs>
          </TabsList>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="E-mail ou ID Corretora..." 
              className="pl-10 rounded-full bg-white/5 border-white/10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsContent value="requests">
            <Card className="bg-card/40 border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="cursor-pointer" onClick={() => setRequestSort({ key: 'submittedAt', direction: requestSort.direction === 'asc' ? 'desc' : 'asc' })}>
                      <div className="flex items-center text-[0.6rem] uppercase font-bold">Data/Hora {renderSortIcon(requestSort, 'submittedAt')}</div>
                    </TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">Identificador</TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">ID Corretora</TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">Status Atual</TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">Plano</TableHead>
                    <TableHead className="text-right text-[0.6rem] uppercase font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRequests.map((req) => (
                    <TableRow key={req.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-xs">{formatDate(req.submittedAt)}</TableCell>
                      <TableCell className="text-xs font-bold">{req.userEmail}</TableCell>
                      <TableCell className="text-xs font-mono text-primary">{req.brokerId}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0">
                              <Badge className="cursor-pointer text-[0.6rem]" variant={req.status === 'PREMIUM' || req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                {req.status}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black/90 border-white/10">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, req.userId, 'PENDING')}>Pendente</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, req.userId, 'AWAITING_DEPOSIT')}>Aguardando Depósito</DropdownMenuItem>
                            <DropdownMenuItem className="text-green-500 font-bold" onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}>Aprovar PREMIUM</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateStatus(req.id, req.userId, 'REJECTED')}>Rejeitar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.6rem]">---</Badge></TableCell>
                      <TableCell className="text-right">
                        {['PENDING', 'DEPOSIT_PENDING', 'AWAITING_DEPOSIT'].includes(req.status) && (
                          <Button size="sm" className="h-7 px-3 text-[0.6rem] bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-card/40 border-white/5 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="cursor-pointer" onClick={() => setUserSort({ key: 'createdAt', direction: userSort.direction === 'asc' ? 'desc' : 'asc' })}>
                      <div className="flex items-center text-[0.6rem] uppercase font-bold">Data/Hora {renderSortIcon(userSort, 'createdAt')}</div>
                    </TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">Identificador</TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">ID Corretora</TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">Status Atual</TableHead>
                    <TableHead className="text-[0.6rem] uppercase font-bold">Plano</TableHead>
                    <TableHead className="text-right text-[0.6rem] uppercase font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mergedUsers.map((u) => (
                    <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-xs">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-xs font-bold">{u.email}</TableCell>
                      <TableCell className="text-xs font-mono opacity-60">{u.brokerId}</TableCell>
                      <TableCell>
                        <Badge variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'} className="text-[0.6rem]">
                          {u.accountStatus === 'DISABLED' ? 'SUSPENSO' : 'ATIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0">
                              <Badge className="cursor-pointer text-[0.6rem]" variant={u.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                                {u.subscriptionStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black/90 border-white/10">
                            <DropdownMenuItem onClick={() => handleUpdateSubscription(u.id, 'ACTIVE')}><UserCheck className="h-3 w-3 mr-2 text-green-500" /> Ativar PREMIUM</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateSubscription(u.id, 'INACTIVE')}><UserX className="h-3 w-3 mr-2 text-muted-foreground" /> Rebaixar para VIP</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ChevronDown className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
                            <DropdownMenuItem onClick={() => handleResetPassword(u.email)}><Key className="h-3 w-3 mr-2" /> Reset Senha</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAccount(u.id, u.accountStatus)}>
                              {u.accountStatus === 'DISABLED' ? <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" /> : <ShieldAlert className="h-3 w-3 mr-2 text-destructive" />}
                              {u.accountStatus === 'DISABLED' ? 'Reativar' : 'Suspender'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="text-destructive font-bold" onClick={() => setDeleteUserId(u.id)}><Trash2 className="h-3 w-3 mr-2" /> Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => !isDeleting && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-[#0d0d0d] border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente e removerá todos os dados do utilizador do sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive text-white">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sim, Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
