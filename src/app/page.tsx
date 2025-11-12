
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const USER_DOMAIN = 'estrategiachinesa.app';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ user: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { auth, isUserLoading, user } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/analisador');
    }
  }, [user, isUserLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setIsLoading(true);

    if (!credentials.user || !credentials.password) {
        toast({
            variant: 'destructive',
            title: 'Campos Vazios',
            description: 'Por favor, preencha o usuário e a senha.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const email = `${credentials.user.toLowerCase()}@${USER_DOMAIN}`;
        await signInWithEmailAndPassword(auth, email, credentials.password);
        
        localStorage.setItem('loginTimestamp', Date.now().toString());
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o analisador...',
        });
    } catch (error: any) {
      console.error("Login error:", error);
      let description = 'Ocorreu um erro inesperado.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = 'Usuário ou senha incorretos.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Login',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando...</p>
          </div>
      )
  }
  
  if(user) {
      return null;
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
            <CardDescription>Acesse com suas credenciais</CardDescription>
             <Button variant="link" size="sm" className="w-full text-blue-400" asChild>
                <Link href="https://t.me/Trader_Chines" target="_blank">
                  Problemas com o acesso? Fale conosco
                </Link>
              </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Usuário</Label>
              <Input
                id="user"
                name="user"
                type="text"
                placeholder="Usuário (disponível no Telegram)"
                value={credentials.user}
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
            <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
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
