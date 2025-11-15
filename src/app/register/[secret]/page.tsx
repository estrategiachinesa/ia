
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useFirebase, useAppConfig } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { auth, isUserLoading, user } = useFirebase();
  const { config, isConfigLoading } = useAppConfig();
  const [isSecretValid, setIsSecretValid] = useState<boolean | null>(null);

  const secret = params.secret;

  useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/analisador');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!isConfigLoading && config) {
      if (secret === config.registrationSecret) {
        setIsSecretValid(true);
      } else {
        setIsSecretValid(false);
        toast({
          variant: 'destructive',
          title: 'Link de Cadastro Inválido',
          description: 'O link que você usou para se registrar é inválido ou expirou.',
        });
        router.push('/');
      }
    }
  }, [secret, config, isConfigLoading, toast, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    if (isLoading) return;

    if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
        toast({ variant: 'destructive', title: 'Campos Vazios', description: 'Por favor, preencha todos os campos.' });
        return;
    }
    if (credentials.password !== credentials.confirmPassword) {
        toast({ variant: 'destructive', title: 'Senhas não coincidem', description: 'A senha e a confirmação de senha devem ser iguais.' });
        return;
    }
    if (credentials.password.length < 6) {
        toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.' });
        return;
    }

    setIsLoading(true);
    try {
        await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
        localStorage.setItem('loginTimestamp', Date.now().toString());
        toast({
          title: 'Cadastro bem-sucedido!',
          description: 'Redirecionando para o analisador...',
        });
        // The useEffect hook will handle the redirect
    } catch (error: any) {
      console.error("Registration error:", error);
      let description = 'Ocorreu um erro inesperado.';
      if (error.code === 'auth/email-already-in-use') {
          description = 'Este e-mail já está em uso. Tente fazer login.';
      } else if (error.code === 'auth/invalid-email') {
          description = 'O formato do e-mail é inválido.';
      }
      toast({ variant: 'destructive', title: 'Falha no Cadastro', description });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || isConfigLoading || isSecretValid === null) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Verificando link...</p>
          </div>
      )
  }
  
  if (user || !isSecretValid) {
      return null; // Redirects are handled in useEffect
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full grid-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />
      </div>

      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                  <LineChart className="h-8 w-8 text-primary" />
               </div>
            </div>
            <CardTitle className="font-headline text-3xl">Criar Conta</CardTitle>
            <CardDescription>Crie sua conta para acessar a Estratégia Chinesa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={credentials.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita sua senha"
                value={credentials.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2 pt-2">
              <Button onClick={handleRegister} disabled={isLoading} className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-bold">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Conta
              </Button>
            </div>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Já tem uma conta?
                    </span>
                </div>
            </div>

             <div className="text-center">
                 <Button variant="outline" asChild>
                    <Link href="/">
                      Fazer Login
                    </Link>
                 </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </>
  );
}
