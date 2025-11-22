
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminUsersPanel } from '@/components/admin/admin-users-panel';
import { VipRequestsPanel } from '@/components/admin/vip-requests-panel';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
        const adminClaim = !!idTokenResult.claims.admin;
        setIsAdmin(adminClaim);
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

  // This renders the full panel structure, but conditionally shows content
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
            <TabsTrigger value="vip-requests" disabled={!isAdmin}>Solicitações VIP</TabsTrigger>
            <TabsTrigger value="users">Usuários Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="vip-requests">
             {isAdmin ? (
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
             ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lock /> Acesso Restrito</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Alert variant="destructive">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Acesso Negado</AlertTitle>
                            <AlertDescription>
                                Esta funcionalidade é restrita a administradores. Para ganhar acesso, vá para a aba "Usuários Admin", promova sua conta e atualize a página.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
             )}
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Administradores</CardTitle>
                <CardDescription>
                  Conceda permissões de administrador. Se esta for a sua primeira vez, insira o seu próprio e-mail para se tornar o primeiro administrador.
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
