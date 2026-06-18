
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import AffiliateLink from '@/components/app/affiliate-link';
import { useFirebase, useAppConfig, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { doc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/logo';

type RegistrationStep = 'codeValidation' | 'terms' | 'form';

export default function RegisterPage() {
  const router = useAffiliateRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const { auth, isUserLoading, user, firestore } = useFirebase();
  const { config, isConfigLoading } = useAppConfig();

  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('codeValidation');
  const [activationCode, setActivationCode] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);

  // Kill Switch Check
  useEffect(() => {
    if (config?.pages?.register === false) {
      router.replace('/');
    }
  }, [config, router]);

  useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/analisador');
    }
  }, [user, isUserLoading, router]);

  const handleCodeValidation = async () => {
    const trimmedCode = activationCode.trim();
    
    if (!trimmedCode) {
        toast({ variant: 'destructive', title: 'Código Inválido', description: 'Por favor, insira o código de ativação enviado pela Hotmart.' });
        return;
    }
    
    if (isConfigLoading || !config) {
        toast({ variant: 'destructive', title: 'Aguarde', description: 'A validar sistema... Tente novamente em 2 segundos.' });
        return;
    }

    setIsCodeLoading(true);
    
    if (trimmedCode === config.registrationSecret.trim()) {
        localStorage.setItem('activationCodeValidated', 'true');
        setRegistrationStep('terms');
        toast({ title: 'Código Validado!', description: 'Siga as instruções para finalizar o cadastro.' });
    } else {
        toast({ 
            variant: 'destructive', 
            title: 'Código Inválido', 
            description: 'O código inserido não corresponde a uma licença ativa. Verifique se copiou corretamente.' 
        });
    }
    setIsCodeLoading(false);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = useCallback(async () => {
    if (isLoading || !firestore) return;

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

    const isValidated = localStorage.getItem('activationCodeValidated');
    if (isValidated !== 'true') {
        toast({ variant: 'destructive', title: 'Validação Necessária', description: 'Por favor, valide seu código de ativação novamente.' });
        setRegistrationStep('codeValidation');
        return;
    }

    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
        
        const userDocRef = doc(firestore, 'users', userCredential.user.uid);
        const userProfileData = {
            email: userCredential.user.email,
            displayName: userCredential.user.email?.split('@')[0],
            subscriptionStatus: 'ACTIVE', 
            createdAt: serverTimestamp(),
            termsAccepted: true,
            termsAcceptedAt: serverTimestamp(),
            accountStatus: 'ACTIVE',
            userOrigin: 'ANALYZER'
        };

        setDocumentNonBlocking(userDocRef, userProfileData, { merge: true });

        localStorage.setItem('loginTimestamp', Date.now().toString());
        localStorage.setItem('showPremiumUpgradeOnLoad', 'true');
        localStorage.removeItem('activationCodeValidated');

        toast({
          title: 'Cadastro Realizado!',
          description: 'A sua licença foi ativada com sucesso.',
        });
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
  }, [isLoading, credentials, auth, toast, firestore]);

    useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (registrationStep === 'form') {
            handleRegister();
        } else if (registrationStep === 'codeValidation') {
            handleCodeValidation();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleRegister, handleCodeValidation, registrationStep]);

  if (config?.pages?.register === false) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-black p-6">
            <div className="text-center space-y-4 animate-in fade-in duration-500">
                <AlertTriangle className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <h2 className="text-xl font-black uppercase text-white">Registos Fechados</h2>
                <p className="text-muted-foreground text-sm">Redirecionando...</p>
                <Button variant="outline" onClick={() => router.replace('/')}>Voltar ao Início</Button>
            </div>
        </div>
    );
  }

  if (isUserLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }
  
  if (user) {
      return null;
  }

  const renderCodeValidation = () => (
      <Dialog open={true} onOpenChange={(isOpen) => !isOpen && router.push('/login')}>
        <DialogContent className="bg-[#0a0a0a] border-white/10" hideCloseButton={false}>
          <DialogHeader className="text-center items-center">
            <DialogTitle className="text-2xl font-headline font-black uppercase">Ativação de Licença</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Insira o código de ativação vitalícia que recebeu no seu e-mail após a compra.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-4">
            <Label htmlFor="activation-code" className="text-[0.65rem] font-black uppercase tracking-widest opacity-60">Código de Ativação</Label>
            <Input
                id="activation-code"
                placeholder="XXXX-XXXX-XXXX"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                disabled={isCodeLoading}
                className="h-12 bg-white/5 border-white/10 font-mono text-center tracking-widest text-lg"
            />
          </div>
          <DialogFooter className="pt-6">
              <Button className="w-full h-12 font-black uppercase tracking-tighter" onClick={handleCodeValidation} disabled={isCodeLoading}>
                {isCodeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Validar Licença Vitalícia'}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );

  const renderTerms = () => (
      <Dialog open={true}>
        <DialogContent className="bg-[#0a0a0a] border-white/10" hideCloseButton={true}>
          <DialogHeader className="text-center items-center">
            <DialogTitle className="text-2xl font-headline font-black uppercase">Atenção!</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Utilize obrigatoriamente o **mesmo e-mail** da sua compra na Hotmart para que o sistema valide o seu acesso vitalício.
            </DialogDescription>
          </DialogHeader>
           <div className="flex items-center space-x-3 pt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                <Checkbox id="terms" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
                <label
                    htmlFor="terms"
                    className="text-xs font-bold leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase opacity-80"
                >
                    Li e concordo com os <AffiliateLink href="/legal" target="_blank" className="text-primary underline">Termos de Uso</AffiliateLink>.
                </label>
            </div>
          <DialogFooter className="pt-6">
              <Button className="w-full h-12 font-black uppercase tracking-tighter" onClick={() => setRegistrationStep('form')} disabled={!hasAgreed}>
                Prosseguir para Cadastro
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );

  return (
    <>
      {registrationStep === 'codeValidation' && renderCodeValidation()}
      {registrationStep === 'terms' && renderTerms()}
      
      <div className="fixed inset-0 -z-10 h-full w-full grid-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />
      </div>

      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-background/50 backdrop-blur-md border-white/10 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-6">
               <Logo size={80} showText={false} />
            </div>
            <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">Criar Conta</CardTitle>
            <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-50">Estratégia Chinesa V.2026</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Hotmart</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={credentials.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-11"
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password">Senha de Acesso</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={credentials.password}
                onChange={handleInputChange}
                disabled={isLoading}
                className="pr-10 bg-white/5 border-white/10 h-11"
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
                className="bg-white/5 border-white/10 h-11"
              />
            </div>
            <div className="space-y-2 pt-4">
              <Button onClick={handleRegister} disabled={isLoading} className="w-full h-12 bg-primary text-black font-black uppercase tracking-tighter hover:bg-primary/90 shadow-lg shadow-primary/20">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Finalizar Ativação
              </Button>
            </div>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[0.6rem] uppercase font-black tracking-widest">
                    <span className="bg-[#0a0a0a] px-3 text-muted-foreground">
                    Já possui acesso?
                    </span>
                </div>
            </div>

             <div className="text-center">
                 <Button variant="outline" className="w-full border-white/10 rounded-xl font-bold h-11" asChild>
                    <AffiliateLink href="/login">
                      Fazer Login
                    </AffiliateLink>
                 </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </>
  );
}
