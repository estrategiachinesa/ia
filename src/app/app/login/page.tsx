
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Loader2, Eye, EyeOff, UserCog } from 'lucide-react';
import AffiliateLink from '@/components/app/affiliate-link';
import { useFirebase, useAppConfig } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const router = useAffiliateRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { auth, isUserLoading, user } = useFirebase();
  const { config, isConfigLoading, affiliateId } = useAppConfig();

  const telegramUrl = config?.telegramUrl || '#'; 

  // Redirect to analyzer if user is already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/app/analisador');
    }
  }, [user, isUserLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    if (!credentials.email || !credentials.password) {
        toast({
            variant: 'destructive',
            title: 'Campos Vazios',
            description: 'Por favor, preencha o e-mail e a senha.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        const loggedInUser = userCredential.user;

        localStorage.setItem('loginTimestamp', Date.now().toString());
        
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o analisador...',
        });
        
        // The useEffect hook will handle the redirect after state update
    } catch (error: any) {
      console.error("Login error:", error);
      let description = 'Ocorreu um erro inesperado.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = 'E-mail ou senha incorretos.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, credentials, auth, toast, router]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleLogin();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleLogin]);
  
  if (isUserLoading || user) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando...</p>
          </div>
      )
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
            <CardTitle className="font-headline text-3xl">Estratégia Chinesa</CardTitle>
            <CardDescription>Acesse com suas credenciais ou teste gratuitamente.</CardDescription>
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
                placeholder="********"
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
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                    <AffiliateLink href="/demo">Sinal Grátis</AffiliateLink>
                </Button>
                <Button onClick={handleLogin} disabled={isLoading} className="bg-primary/90 hover:bg-primary text-primary-foreground font-bold">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                </Button>
              </div>
               <Button variant="link" size="sm" className="w-full text-blue-400 text-xs h-auto pt-2" asChild>
                  <AffiliateLink href={telegramUrl} target="_blank">
                    Problemas com o acesso? Fale conosco
                  </AffiliateLink>
                </Button>
            </div>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    ou
                    </span>
                </div>
            </div>

             <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem uma licença?{' '}
                  <AffiliateLink href="/demo/vip" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Clique aqui
                  </AffiliateLink>
                </p>
            </div>
          </CardContent>
        </Card>
        <footer className="w-full text-center text-xs text-foreground/50 p-4 mt-8">
          <p>© 2026 ESTRATÉGia CHINESA. Todos os direitos reservados.</p>
           <AffiliateLink href="/legal" className="underline underline-offset-2">
            Termos de Uso e Privacidade
          </AffiliateLink>
        </footer>
      </div>
    </>
  );
}
