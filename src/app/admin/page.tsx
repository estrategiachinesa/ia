
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  LayoutDashboard,
  LogOut,
  Search
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
import { useToast } from '@/hooks/use-toast';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';

const ADMIN_EMAIL = 'chines@trader.com';

export default function AdminDashboard() {
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useAffiliateRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Authorized check
  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vipRequests'), orderBy('submittedAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: requests, isLoading: isRequestsLoading } = useCollection(requestsQuery);

  const handleUpdateStatus = async (requestId: string, userId: string, newStatus: string) => {
    if (!firestore) return;

    try {
      // Update request status
      const requestRef = doc(firestore, 'vipRequests', requestId);
      await updateDoc(requestRef, { status: newStatus });

      // If approved, update user subscriptionStatus
      if (newStatus === 'PREMIUM' || newStatus === 'APPROVED') {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, { subscriptionStatus: 'ACTIVE' });
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

  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Autenticando administrador...</p>
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => ['PENDING', 'DEPOSIT_PENDING'].includes(r.status)) || [];
  
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isUsersLoading ? '...' : users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isRequestsLoading ? '...' : pendingRequests.length}</div>
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
                <CardDescription>Gerencie quem submeteu o ID da corretora para upgrade.</CardDescription>
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
                            <Badge variant={
                              req.status === 'PREMIUM' || req.status === 'APPROVED' ? 'success' :
                              req.status === 'REJECTED' ? 'destructive' :
                              req.status === 'PENDING' ? 'secondary' : 'outline'
                            }>
                              {req.status}
                            </Badge>
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
                            {req.status !== 'REJECTED' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleUpdateStatus(req.id, req.userId, 'REJECTED')}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Recusar
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
                  <CardDescription>Lista completa de membros cadastrados no sistema.</CardDescription>
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
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">ID Interno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-bold">{u.displayName || 'Sem Nome'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.subscriptionStatus === 'ACTIVE' ? 'success' : 'secondary'}>
                              {u.subscriptionStatus || 'INACTIVE'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                             {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '---'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                            {u.id}
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
    </div>
  );
}
