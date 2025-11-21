'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { setAdminClaim } from './actions';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
});

export default function AdminPage() {
  const router = useRouter();
  const { user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        // If not logged in, redirect to login page
        router.push('/login');
        return;
      }
      // Check for admin claim
      user.getIdTokenResult().then(idTokenResult => {
        if (idTokenResult.claims.admin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      });
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await setAdminClaim(values.email);
    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
        className: 'bg-green-600 border-green-600 text-white',
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result.message,
      });
    }
  }

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-2 text-2xl font-bold">Painel de Administrador</CardTitle>
          <CardDescription>Conceda permissões de administrador a um usuário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tornar Administrador
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
