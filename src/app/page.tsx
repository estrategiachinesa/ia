'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type FormFields = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/analisador');
    }
  }, [user, isUserLoading, router]);

  const handleAuthAction: SubmitHandler<FormFields> = async ({ email, password }) => {
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Cadastro bem-sucedido!',
          description: 'Você agora pode fazer login.',
        });
        setIsRegistering(false); // Switch back to login view
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o analisador.',
        });
        // The useEffect will handle the redirect
      }
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      let description = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está em uso.';
      }
      toast({
        variant: 'destructive',
        title: isRegistering ? 'Falha no Cadastro' : 'Falha no Login',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-background"></div>
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <div className="p-2 bg-primary/10 rounded-full">
                  <LineChart className="h-8 w-8 text-primary" />
               </div>
            </div>
            <CardTitle className="font-headline text-2xl">Estratégia Chinesa</CardTitle>
            <CardDescription>{isRegistering ? 'Crie sua conta para continuar' : 'Acesse sua conta para continuar'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleAuthAction)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegistering ? 'Cadastrar' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <Button variant="link" onClick={() => setIsRegistering(!isRegistering)} className="pl-1">
                {isRegistering ? 'Faça login' : 'Cadastre-se'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <footer className="w-full text-center text-[0.6rem] text-foreground/50 p-4 mt-8">
          <p>© 2025 ESTRATÉGIA CHINESA. </p>
          <p>Todos os direitos reservados.</p>
        </footer>
      </div>
    </>
  );
}
