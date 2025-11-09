'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Loader2 } from 'lucide-react';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.816,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If the user is loaded and exists, redirect them to the analyzer.
    // The analyzer page will be responsible for checking access claims.
    if (!isUserLoading && user) {
      router.push('/analisador');
    }
  }, [user, isUserLoading, router]);

 const ensureUserProfile = async (user: User) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    // Use getDoc to prevent overwriting existing user data on re-login
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // User profile doesn't exist, create it.
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || '',
        createdAt: serverTimestamp(),
      };
      // Use the non-blocking update which handles its own errors
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Serviço de autenticação não está pronto.' });
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await ensureUserProfile(result.user);
        toast({
            title: 'Login bem-sucedido!',
            description: 'Redirecionando para o analisador...',
        });
        // The useEffect hook will handle redirection.
    } catch (error: any) {
        console.error("Google sign-in error:", error);
         let description = 'Não foi possível fazer login com o Google. Tente novamente.';
        if (error.code === 'auth/popup-closed-by-user') {
            description = 'A janela de login foi fechada antes da conclusão.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            description = 'Múltiplas tentativas de login. Por favor, tente novamente.';
        } else if (error.code === 'auth/operation-not-allowed') {
            description = 'Login com Google não está habilitado. Contate o suporte.';
        }
        
        toast({
            variant: 'destructive',
            title: 'Falha no Login',
            description: description,
        });
    }
  };

  // Show a loading spinner while checking for a user session
  if (isUserLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  // If user is not logged in, show the login page.
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
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <GoogleIcon className="mr-2" />
                Entrar com Google
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
