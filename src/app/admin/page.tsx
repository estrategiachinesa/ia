
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  LayoutDashboard,
  LogOut,
  Search,
  ChevronDown,
  UserCheck,
  UserX,
  MoreHorizontal,
  Key,
  UserMinus,
  Trash2,
  AlertTriangle
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
import { useToast } from '@/hooks/use-toast';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';

const ADMIN_EMAILS = ['chines@trader.com', 'estrategiachinesa@gmail.com'];

export default function AdminDashboard() {
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useAffiliateRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for modals
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdmin]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'vipRequests'), orderBy('submittedAt', 'desc'));
  }, [firestore, isAdmin]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

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

  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Autenticando administrador...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => ['PENDING', 'DEPOSIT_PENDING', 'AWAITING_DEPOSIT'].includes(r.status)) || [];
  
  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-headline font-bold tracking-tight">Painel Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-primary uppercase">Administrador</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => auth.signOut()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isUsersLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isRequestsLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : pendingRequests.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status do Sistema</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 italic">ONLINE</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/20">
            <TabsTrigger value="requests">Solicitações VIP</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Solicitações de Acesso PREMIUM</CardTitle>
                <CardDescription>Gerencie quem submeteu o ID da corretora para upgrade. Clique no status para mudar manualmente.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail / Usuário</TableHead>
                      <TableHead>ID Corretora</TableHead>
                      <TableHead>Status Atual</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isRequestsLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : requests?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum pedido encontrado.</TableCell></TableRow>
                    ) : (
                      requests?.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="font-bold">{req.userEmail}</div>
                            <div className="text-xs text-muted-foreground">{req.userId}</div>
                          </TableCell>
                          <TableCell className="font-mono">{req.brokerId}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                  <Badge className="cursor-pointer gap-1" variant={
                                    req.status === 'PREMIUM' || req.status === 'APPROVED' ? 'success' :
                                    req.status === 'REJECTED' ? 'destructive' :
                                    req.status === 'PENDING' ? 'secondary' : 'outline'
                                  }>
                                    {req.status} <ChevronDown className="h-3 w-3" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, req.userId, 'PENDING')}>PENDING</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, req.userId, 'AWAITING_DEPOSIT')}>AWAITING_DEPOSIT</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(req.id, req.userId, 'DEPOSIT_PENDING')}>DEPOSIT_PENDING</DropdownMenuItem>
                                <DropdownMenuItem className="text-green-600 font-bold" onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}>PREMIUM (Ativar)</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive font-bold" onClick={() => handleUpdateStatus(req.id, req.userId, 'REJECTED')}>REJECTED</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {req.submittedAt ? new Date(req.submittedAt.seconds * 1000).toLocaleDateString() : '---'}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {req.status === 'PENDING' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                                onClick={() => handleUpdateStatus(req.id, req.userId, 'AWAITING_DEPOSIT')}
                              >
                                <Clock className="h-4 w-4 mr-1" /> Depósito
                              </Button>
                            )}
                            {(req.status === 'PENDING' || req.status === 'DEPOSIT_PENDING' || req.status === 'AWAITING_DEPOSIT') && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus(req.id, req.userId, 'PREMIUM')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
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

          <TabsContent value="users" className="mt-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Todos os Usuários</CardTitle>
                  <CardDescription>Lista completa de membros registados.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar e-mail ou nome..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Assinatura</TableHead>
                      <TableHead>Status Conta</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Gerenciar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum usuário encontrado.</TableCell></TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-bold">{u.displayName || 'Sem Nome'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                  <Badge className="cursor-pointer gap-1" variant={u.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                                    {u.subscriptionStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'} <ChevronDown className="h-3 w-3" />
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Alterar Plano</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdateUserSubscription(u.id, 'ACTIVE')}>
                                  <UserCheck className="h-4 w-4 mr-2 text-green-500" /> Ativar PREMIUM
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateUserSubscription(u.id, 'INACTIVE')}>
                                  <UserX className="h-4 w-4 mr-2 text-muted-foreground" /> Rebaixar para VIP
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'}>
                              {u.accountStatus === 'DISABLED' ? 'DESATIVADA' : 'ATIVA'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                             {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '---'}
                          </TableCell>
                          <TableCell className="text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações de Conta</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleResetPassword(u.email)}>
                                    <Key className="h-4 w-4 mr-2" /> Redefinir Senha
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleUserAccountStatus(u.id, u.accountStatus)}>
                                    {u.accountStatus === 'DISABLED' ? (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2 text-green-500" /> Ativar Conta
                                      </>
                                    ) : (
                                      <>
                                        <UserMinus className="h-4 w-4 mr-2 text-yellow-500" /> Desativar Conta
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive font-bold"
                                    onClick={() => setDeleteUserId(u.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Excluir permanentemente
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => !isDeleting && setDeleteUserId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive h-5 w-5" />
              Excluir Usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O perfil do usuário será removido permanentemente do banco de dados. 
              O acesso será revogado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
