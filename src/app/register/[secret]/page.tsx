
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ShieldAlert, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { useFirebase, useAppConfig } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

type PageState = 'validating' | 'valid' | 'invalid';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { auth } = useFirebase();
  const { config, isConfigLoading } = useAppConfig();

  const [pageState, setPageState] = useState<PageState>('validating');
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [isWarningModalOpen, setWarningModalOpen] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);

  const secret = params.secret as string;

  useEffect(() => {
    if (isConfigLoading || !config) return;

    if (config.registrationSecret === secret) {
      setPageState('valid');
    } else {
      setPageState('invalid');
    }
  }, [secret, config, isConfigLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    setIsLoading(true);

    if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
      toast({ variant: 'destructive', title: 'Campos Vazios', description: 'Por favor, preencha todos os campos.' });
      setIsLoading(false);
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      toast({ variant: 'destructive', title: 'Senhas não conferem', description: 'A senha e a confirmação de senha devem ser iguais.' });
      setIsLoading(false);
      return;
    }

    if (credentials.password.length < 6) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.' });
      setIsLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // Explicitly sign in to ensure session is active before redirect
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      localStorage.setItem('loginTimestamp', Date.now().toString());

      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      let description = 'Ocorreu um erro inesperado ao criar sua conta.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este e-mail já está em uso. Por favor, faça login ou use outro e-mail.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'O e-mail fornecido não é válido.';
      }
      toast({
        variant: 'destructive',
        title: 'Falha no Cadastro',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRedirectToAnalyzer = () => {
    router.push('/analisador');
  };

  if (pageState === 'validating' || isConfigLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold">Validando link de convite...</h1>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <Card className="w-full max-w-sm bg-destructive/10 border-destructive/50">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="p-3 bg-destructive/10 rounded-full border border-destructive/20">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-destructive text-2xl">Link Inválido ou Expirado</CardTitle>
          <CardDescription className="text-destructive/80">Este link de registro não é mais válido. Por favor, entre em contato com o suporte se você acredita que isso é um erro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/')} className="w-full" variant="destructive">
            Voltar para a Página Inicial
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={isWarningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <AlertTriangle className="h-16 w-16 text-primary mb-4" />
            <DialogTitle className="text-2xl font-headline">Atenção!</DialogTitle>
            <DialogDescription className="text-base px-4">
              Para validar seu acesso, utilize no cadastro o <strong>mesmo e-mail</strong> que você usou ao realizar a compra na Hotmart.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 justify-center pt-4">
            <Checkbox id="terms" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Li e concordo com a instrução acima.
            </label>
          </div>
          <DialogFooter className="pt-4">
            <Button 
              onClick={() => setWarningModalOpen(false)} 
              disabled={!hasAgreed}
              className="w-full"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isSuccessModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleRedirectToAnalyzer();
        }
        setSuccessModalOpen(isOpen);
      }}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <CheckCircle className="h-16 w-16 text-success mb-4" />
            <DialogTitle className="text-2xl font-headline">Conta Criada com Sucesso!</DialogTitle>
            <DialogDescription>
              Parabéns! Seja bem-vindo à Estratégia Chinesa. Você será redirecionado para o analisador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleRedirectToAnalyzer} className="w-full">Ir para o Analisador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    
      <Card className="w-full max-w-sm bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
              <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
          </div>
          <CardTitle className="font-headline text-3xl">Crie sua Conta</CardTitle>
          <CardDescription>Defina suas credenciais de acesso para a Estratégia Chinesa.</CardDescription>
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
          <div className="space-y-2 relative">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repita sua senha"
              value={credentials.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
              onClick={() => setShowConfirmPassword(prev => !prev)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="pt-2">
              <Button onClick={handleRegister} disabled={isLoading} className="w-full bg-primary/90 hover:bg-primary text-primary-foreground font-bold">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Criar Conta
              </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
