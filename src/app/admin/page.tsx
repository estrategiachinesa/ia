'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminUsersPanel } from '@/components/admin/admin-users-panel';
import { VipRequestsPanel } from '@/components/admin/vip-requests-panel';

export default function AdminPage() {
  const router = useRouter();
  const { user, isUserLoading } = useFirebase();
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      user.getIdTokenResult().then(idTokenResult => {
        setIsAdmin(!!idTokenResult.claims.admin);
      });
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Acesso Negado</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Esta página é restrita a administradores. Se você acredita que isso é um erro, entre em contato com o suporte.
        </p>
        <Button onClick={() => router.push('/analisador')} className="mt-6">
          Voltar para o Analisador
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="mb-8 text-center">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-headline">Painel de Administrador</h1>
            <p className="text-muted-foreground mt-2">Gerencie as funcionalidades da aplicação.</p>
        </header>

        <Tabs defaultValue="vip-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vip-requests">Solicitações VIP</TabsTrigger>
            <TabsTrigger value="users">Usuários Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vip-requests">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Acesso VIP/PREMIUM</CardTitle>
                <CardDescription>
                  Aprove ou rejeite as solicitações de usuários para o acesso prioritário.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VipRequestsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Administradores</CardTitle>
                <CardDescription>
                  Conceda ou revogue permissões de administrador para outros usuários.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminUsersPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
