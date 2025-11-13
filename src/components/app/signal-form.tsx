
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Info, Loader2, Lock, Send, Timer, Crown } from 'lucide-react';
import type { FormData, Asset } from '@/app/analisador/page';
import { CurrencyFlags } from './currency-flags';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type VipStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'APPROVED' | 'REJECTED';

type SignalFormProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  showOTC: boolean;
  setShowOTC: (show: boolean) => void;
  isMarketOpen: boolean;
  hasReachedLimit: boolean;
  user: User | null;
  firestore: Firestore;
  isVip: boolean;
  vipStatus?: VipStatus;
  isVipModalOpen: boolean;
  setVipModalOpen: (isOpen: boolean) => void;
  rejectedBrokerId?: string;
};

const allAssets: Asset[] = [
  'EUR/JPY', 'EUR/JPY (OTC)',
  'EUR/USD', 'EUR/USD (OTC)',
];


export function SignalForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  showOTC,
  setShowOTC,
  isMarketOpen,
  hasReachedLimit,
  user,
  firestore,
  isVip,
  vipStatus,
  isVipModalOpen,
  setVipModalOpen,
  rejectedBrokerId,
}: SignalFormProps) {
  const { toast } = useToast();
  const [brokerId, setBrokerId] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');

  const assets = showOTC ? allAssets : allAssets.filter(a => !a.includes('(OTC)'));

  useEffect(() => {
    // Open the modal if the limit is reached, the user is not vip, and the status is not APPROVED
    if (hasReachedLimit && !isVip) {
      setVipModalOpen(true);
    }
     // Also open modal if user becomes approved and hasn't seen the welcome message
     if (vipStatus === 'APPROVED') {
        const hasSeenWelcome = localStorage.getItem('hasSeenPremiumWelcome');
        if (!hasSeenWelcome) {
            setVipModalOpen(true);
        }
    }
  }, [hasReachedLimit, isVip, vipStatus, setVipModalOpen]);

  useEffect(() => {
    // If OTC is turned off and an OTC asset is selected, reset to a default non-OTC asset
    if (!showOTC && formData.asset.includes('(OTC)')) {
      setFormData({ ...formData, asset: 'EUR/JPY' });
    }
  }, [showOTC, formData, setFormData]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    // Show waiting message if limit is reached but modal is not (or cannot be) open
    if (hasReachedLimit && !isVipModalOpen) {
        let queuePosition = 5;
        
        const updateMessage = () => {
            if (queuePosition > 1) {
                queuePosition--;
            }
            setWaitingMessage(`Estamos na fila, aguardando o melhor momento... (Posição: #${queuePosition})`);
        };
        
        if (vipStatus === 'PENDING') {
            setWaitingMessage('Seu acesso PREMIUM está em análise. Enquanto isso, aguarde na fila.');
        } else if (vipStatus === 'AWAITING_DEPOSIT') {
            setWaitingMessage('Cadastro verificado! Aguardando depósito para liberar seu acesso PREMIUM.');
        } else {
            setWaitingMessage(`Estamos na fila, aguardando o melhor momento... (Posição: #${queuePosition})`);
            interval = setInterval(updateMessage, 8000);
        }

    } else {
        setWaitingMessage('');
    }
    return () => clearInterval(interval);
  }, [hasReachedLimit, isVipModalOpen, vipStatus]);

  const handleIdSubmit = async () => {
    if (!/^\d{8,}$/.test(brokerId)) {
      toast({
        variant: 'destructive',
        title: 'ID Inválido',
        description: 'O ID da corretora deve conter apenas números e ter no mínimo 8 dígitos.',
      });
      return;
    }
    
    // Check if user is re-submitting a rejected ID
    if (vipStatus === 'REJECTED' && rejectedBrokerId && brokerId === rejectedBrokerId) {
      toast({
        variant: 'destructive',
        title: 'ID já recusado',
        description: 'Este ID já foi analisado e recusado. Por favor, insira um novo ID válido.',
      });
      return;
    }

    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado. Por favor, faça login novamente.',
      });
      return;
    }

    setIsSubmittingId(true);
    try {
      const vipRequestRef = doc(firestore, 'vipRequests', user.uid);
      
      setDocumentNonBlocking(vipRequestRef, {
        brokerId: brokerId,
        userId: user.uid,
        userEmail: user.email,
        status: 'PENDING',
        submittedAt: serverTimestamp(),
      }, { merge: true });


      toast({
        title: 'Solicitação Enviada!',
        description: 'Seu ID foi recebido e está em análise. A liberação do acesso PREMIUM pode levar algumas horas.',
      });
      setVipModalOpen(false);
      setBrokerId('');

    } catch (error) {
      console.error("Error submitting VIP ID:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: 'Não foi possível enviar sua solicitação. Tente novamente mais tarde.',
      });
    } finally {
      setIsSubmittingId(false);
    }
  };

  const buttonDisabled = isLoading || !isMarketOpen || (hasReachedLimit && !waitingMessage);

  const getPremiumModalContent = () => {
    switch (vipStatus) {
      case 'APPROVED':
        return (
             <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">🎉 Parabéns! Acesso PREMIUM Liberado!</DialogTitle>
              <DialogDescription>
                Você agora tem acesso prioritário e ilimitado a todos os sinais. Toque em "Começar" e aproveite ao máximo!
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <Crown className="h-16 w-16 mx-auto text-primary animate-pulse" />
            </div>
            <DialogFooter>
              <Button onClick={() => {
                localStorage.setItem('hasSeenPremiumWelcome', 'true');
                setVipModalOpen(false);
              }}>
                Começar a Usar
              </Button>
            </DialogFooter>
          </>
        );
      case 'PENDING':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Análise em Andamento</DialogTitle>
              <DialogDescription>
                Seu cadastro foi recebido. Estamos verificando suas informações e seu acesso será liberado em breve.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Verificando seu cadastro na corretora...</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVipModalOpen(false)}>
                Entendido
              </Button>
            </DialogFooter>
          </>
        );
      case 'AWAITING_DEPOSIT':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">🎉 Cadastro Verificado!</DialogTitle>
              <DialogDescription>
                Falta apenas um passo! Faça seu primeiro depósito na corretora para ativar seu Acesso PREMIUM ilimitado.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Use os mesmos links abaixo para acessar sua conta e realizar o depósito.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button className="w-full" asChild>
                  <Link href="https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                    Acessar IQ Option
                  </Link>
                </Button>
                 <Button className="w-full" asChild>
                  <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                    Acessar Exnova
                  </Link>
                </Button>
              </div>
            </div>
             <DialogFooter>
              <Button variant="outline" onClick={() => setVipModalOpen(false)}>
                Continuar na Fila
              </Button>
            </DialogFooter>
          </>
        );
      case 'REJECTED':
        return (
           <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-destructive">Solicitação Rejeitada</DialogTitle>
              <DialogDescription>
                Sua solicitação de acesso PREMIUM foi rejeitada. Isso geralmente ocorre se o cadastro não foi feito através do nosso link de afiliado ou se o e-mail já estava registrado na corretora.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Por favor, crie uma nova conta na corretora usando nosso link de afiliado e um e-mail diferente, depois envie seu novo ID abaixo.
                </AlertDescription>
              </Alert>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-bold mb-2">PASSO 1: Cadastre-se (Novamente)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button className="w-full" asChild>
                    <Link href="https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                      Cadastrar na IQ Option
                    </Link>
                  </Button>
                   <Button className="w-full" asChild>
                    <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                      Cadastrar na Exnova
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-bold mb-2">PASSO 2: Valide seu Novo Acesso</h3>
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Seu NOVO ID da Corretora"
                    value={brokerId}
                    onChange={(e) => setBrokerId(e.target.value.replace(/\D/g, ''))}
                    pattern="[0-9]*"
                    minLength={8}
                    disabled={isSubmittingId}
                  />
                  <Button type="submit" size="icon" onClick={handleIdSubmit} disabled={isSubmittingId || brokerId.length < 8}>
                    {isSubmittingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVipModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        )
      default: // No status
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Acesso PREMIUM Ilimitado</DialogTitle>
              <DialogDescription>
                Nossos servidores estão ocupados para garantir a melhor análise. Obtenha acesso prioritário e ilimitado com o Acesso PREMIUM.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-bold mb-2">PASSO 1: Cadastre-se na Corretora</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use um dos nossos links para se cadastrar na corretora. É crucial que você use um e-mail novo, que nunca tenha sido usado na corretora antes, para garantir que seu cadastro seja vinculado corretamente.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button className="w-full" asChild>
                    <Link href="https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                      Cadastrar na IQ Option
                    </Link>
                  </Button>
                   <Button className="w-full" asChild>
                    <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                      Cadastrar na Exnova
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="font-bold mb-2">PASSO 2: Valide seu Acesso</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Após o cadastro, insira o ID da sua conta da corretora abaixo para verificarmos seu cadastro.
                </p>
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="ID da Corretora (mín. 8 dígitos)"
                    value={brokerId}
                    onChange={(e) => setBrokerId(e.target.value.replace(/\D/g, ''))}
                    pattern="[0-9]*"
                    minLength={8}
                    disabled={isSubmittingId}
                  />
                  <Button type="submit" size="icon" onClick={handleIdSubmit} disabled={isSubmittingId || brokerId.length < 8}>
                    {isSubmittingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVipModalOpen(false)}>
                Continuar na Fila
              </Button>
            </DialogFooter>
          </>
        );
    }
  }


  return (
    <>
      <div className="w-full space-y-6 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
            ESTRATÉGIA CHINESA
          </h1>
          <p className="mt-4 text-lg text-foreground/80">
            Escolha o ativo e o tempo de expiração para receber seus sinais.
          </p>
        </div>

        {waitingMessage && (
            <Alert className="text-center">
                <Timer className="h-4 w-4" />
                <AlertDescription>
                    {waitingMessage}
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-6 text-left">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="asset-select">Ativo:</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="otc-switch" className="text-xs text-muted-foreground">
                  exibir (OTC)
                </Label>
                <Switch
                  id="otc-switch"
                  checked={showOTC}
                  onCheckedChange={setShowOTC}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Select
              value={formData.asset}
              onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-12 text-base" id="asset-select">
                <SelectValue asChild>
                  <div className="flex items-center gap-2">
                    <CurrencyFlags asset={formData.asset} />
                    <span>{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset}>
                    <div className="flex items-center gap-2">
                      <CurrencyFlags asset={asset} />
                      <span>{asset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showOTC && (
              <Alert className="mt-4 border-primary/20 bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-primary/80">
                  Sinais OTC são para as corretoras
                  <Link href="https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=" target="_blank" className="font-bold underline hover:text-primary mx-1">
                    IQ Option
                  </Link>
                  e
                  <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank" className="font-bold underline hover:text-primary ml-1">
                    Exnova
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration-select">Tempo de expiração:</Label>
            <Select
              value={formData.expirationTime}
              onValueChange={(value) => setFormData({ ...formData, expirationTime: value as '1m' | '5m' })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-12 text-base" id="expiration-select">
                <SelectValue placeholder="Selecione o Tempo de Expiração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 minuto (1m)</SelectItem>
                <SelectItem value="5m">5 minutos (5m)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full space-y-2">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary/80 to-primary hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 transform hover:scale-105"
              onClick={onSubmit}
              disabled={buttonDisabled}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : !isMarketOpen ? (
                <Lock className="mr-2 h-5 w-5" />
              ) : hasReachedLimit ? (
                 <Timer className="mr-2 h-5 w-5" />
              ) : (
                <BarChart className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Analisando...' : !isMarketOpen ? 'Mercado Fechado' : hasReachedLimit ? 'Aguardando...' : 'Analisar Mercado'}
            </Button>
            {!isVip && (
                <Button variant="link" className="w-full flex-col h-auto text-purple-400 hover:text-purple-300" onClick={() => setVipModalOpen(true)}>
                    <Crown className="h-5 w-5 mb-0.5" />
                    PREMIUM
                </Button>
            )}
        </div>
      </div>

      <Dialog open={isVipModalOpen} onOpenChange={setVipModalOpen}>
        <DialogContent className="sm:max-w-lg">
          {getPremiumModalContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}

    