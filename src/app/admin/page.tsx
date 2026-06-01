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
  ShieldAlert,
  Key,
  Trash2,
  LayoutDashboard,
  UserCheck,
  UserX,
  ArrowUpDown,
  MoreVertical,
  Mail
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // Queries - Only run if admin
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdmin]);

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'vipRequests');
  }, [firestore, isAdmin]);

  const { data: rawUsers, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: rawRequests } = useCollection(requestsQuery);

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, isUserLoading, router]);

  const handleToggleAccount = async (userId: string, currentStatus: string | undefined) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    try {
      await updateDoc(doc(firestore, 'users', userId), { accountStatus: newStatus });
      toast({ 
        title: 'Status Alterado', 
        description: `Conta ${newStatus === 'DISABLED' ? 'Suspensa' : 'Ativada'}` 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao alterar status' });
    }
  };

  const handleUpdateSubscription = async (userId: string, currentStatus: string | undefined) => {
    if (!firestore) return;
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateDoc(doc(firestore, 'users', userId), { subscriptionStatus: newStatus });
      toast({ 
        title: 'Plano Alterado', 
        description: `Usuário agora é ${newStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'}` 
      });
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
      const req = rawRequests?.find(r => r.id === u.id || r.userId === u.id);
      return {
        ...u,
        brokerId: req?.brokerId || '---',
      };
    }).filter(u => 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.brokerId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      let valA = a[sortConfig.key as keyof typeof a] as any;
      let valB = b[sortConfig.key as keyof typeof b] as any;
      if (valA?.seconds) valA = valA.seconds;
      if (valB?.seconds) valB = valB.seconds;
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rawUsers, rawRequests, searchTerm, sortConfig]);

  const formatDate = (ts: any) => {
    if (!ts) return '---';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
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
            <h1 className="text-xl font-headline font-black tracking-tight uppercase">Gestão Estratégia Chinesa</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-full border border-white/10">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
            <Card className="bg-card/40 border-white/5 p-4 min-w-[140px]">
              <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">Membros</p>
              <div className="text-2xl font-black">{isUsersLoading ? '...' : rawUsers?.length || 0}</div>
            </Card>
            <Card className="bg-card/40 border-white/5 p-4 min-w-[140px]">
              <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">Premium</p>
              <div className="text-2xl font-black text-purple-500">{rawUsers?.filter(u => u.subscriptionStatus === 'ACTIVE').length || 0}</div>
            </Card>
             <Card className="bg-card/40 border-white/5 p-4 min-w-[140px]">
              <p className="text-[0.6rem] uppercase tracking-widest text-muted-foreground font-bold">Suspensos</p>
              <div className="text-2xl font-black text-destructive">{rawUsers?.filter(u => u.accountStatus === 'DISABLED').length || 0}</div>
            </Card>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar E-mail ou ID..." 
              className="pl-10 rounded-xl bg-white/5 border-white/10 h-11" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="bg-card/40 border-white/5 overflow-hidden rounded-2xl">
          <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest">Lista Única de Membros</h2>
            <p className="text-[0.6rem] text-muted-foreground uppercase font-bold">Mostrando {mergedUsers.length} registos</p>
          </div>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Data/Hora {renderSortIcon('createdAt')}</div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort('email')}>
                  <div className="flex items-center text-[0.6rem] uppercase font-bold">Identificador {renderSortIcon('email')}</div>
                </TableHead>
                <TableHead className="text-[0.6rem] uppercase font-bold">ID Corretora</TableHead>
                <TableHead className="text-[0.6rem] uppercase font-bold">Status Atual</TableHead>
                <TableHead className="text-[0.6rem] uppercase font-bold">Plano</TableHead>
                <TableHead className="text-right text-[0.6rem] uppercase font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedUsers.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell className="text-[0.7rem] opacity-60">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">{u.email}</span>
                        {u.displayName && <span className="text-[0.6rem] text-muted-foreground">{u.displayName}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-primary font-bold">{u.brokerId}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                          <Badge 
                            variant={u.accountStatus === 'DISABLED' ? 'destructive' : 'outline'} 
                            className="cursor-pointer text-[0.6rem] font-black tracking-tighter"
                          >
                            {u.accountStatus === 'DISABLED' ? 'SUSPENSO' : 'ATIVA'}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-black/95 border-white/10">
                        <DropdownMenuItem onClick={() => handleToggleAccount(u.id, u.accountStatus)} className="text-xs font-bold">
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
                            className={`cursor-pointer text-[0.6rem] font-black tracking-tighter ${
                              u.subscriptionStatus === 'ACTIVE' 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                            }`}
                          >
                            {u.subscriptionStatus === 'ACTIVE' ? 'PREMIUM' : 'VIP'}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-black/95 border-white/10">
                        <DropdownMenuItem onClick={() => handleUpdateSubscription(u.id, u.subscriptionStatus)} className="text-xs font-bold">
                           {u.subscriptionStatus === 'ACTIVE' ? <UserX className="h-3 w-3 mr-2" /> : <UserCheck className="h-3 w-3 mr-2 text-green-500" />}
                           {u.subscriptionStatus === 'ACTIVE' ? 'Rebaixar para VIP' : 'Ativar PREMIUM'}
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
                          <Key className="h-3.5 w-3.5 mr-2 opacity-60" /> Redefinir Senha
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAccount(u.id, u.accountStatus)} className="text-xs">
                          {u.accountStatus === 'DISABLED' ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" /> Ativar Conta</>
                          ) : (
                            <><ShieldAlert className="h-3.5 w-3.5 mr-2 text-destructive" /> Suspender Conta</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-destructive text-xs font-bold" onClick={() => setDeleteUserId(u.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {mergedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Mail className="h-10 w-10" />
                      <p className="text-sm font-bold uppercase tracking-widest">Nenhum utilizador encontrado</p>
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
            <AlertDialogTitle className="text-xl font-headline font-black uppercase tracking-tight">Excluir Conta?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Esta ação é **irreversível**. Todos os dados do utilizador serão removidos permanentemente do sistema.
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
