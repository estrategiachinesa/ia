
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ user: '', password: '' });

  // Effect to set up initial credentials if they don't exist
  useEffect(() => {
    const setupInitialCredentials = async () => {
      if (!firestore) return;
      const credsDocRef = doc(firestore, 'shared-access', 'credentials');
      const credsDoc = await getDoc(credsDocRef);
      if (!credsDoc.exists()) {
        try {
          await setDoc(credsDocRef, {
            user: 'admin',
            password: 'admin',
          });
          console.log('Initial credentials (admin/admin) have been set in Firestore.');
        } catch (error) {
          console.error("Error setting initial credentials:", error);
           toast({
            variant: 'destructive',
            title: 'Erro de Configuração Inicial',
            description: 'Não foi possível definir as credenciais iniciais. Verifique as regras de segurança do Firestore.',
          });
        }
      }
    };
    setupInitialCredentials();
  }, [firestore, toast]);


  useEffect(() => {
    // Check if user is already logged in via local storage
    if (localStorage.getItem('isLoggedIn') === 'true') {
       const loginTime = localStorage.getItem('loginTimestamp');
       if (loginTime) {
         const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
         if (hoursSinceLogin < 1) {
            router.push('/analisador');
         } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('loginTimestamp');
         }
       }
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setIsLoading(true);

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro de Configuração',
        description: 'O serviço de banco de dados não está disponível.',
      });
      setIsLoading(false);
      return;
    }
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
      // 1. Fetch the shared credentials from Firestore
      const credsDocRef = doc(firestore, 'shared-access', 'credentials');
      const credsDoc = await getDoc(credsDocRef);

      if (!credsDoc.exists()) {
        throw new Error('Documento de credenciais não encontrado. Tente novamente em alguns segundos.');
      }

      const { user: correctUser, password: correctPassword } = credsDoc.data();

      // 2. Compare with the entered credentials
      if (credentials.user === correctUser && credentials.password === correctPassword) {
        // 3. On success, set a session flag and redirect
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTimestamp', Date.now().toString());
        toast({
          title: 'Login bem-sucedido!',
          description: 'Redirecionando para o analisador...',
        });
        router.push('/analisador');
      } else {
        // 4. On failure, show an error
        toast({
          variant: 'destructive',
          title: 'Falha no Login',
          description: 'Usuário ou senha incorretos.',
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: error.message || 'Não foi possível verificar as credenciais. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardDescription>Acesse com as credenciais compartilhadas</CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleLogin} disabled={isLoading} className="w-full">
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
