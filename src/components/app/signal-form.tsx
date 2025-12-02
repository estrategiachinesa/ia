
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Info, Loader2, Lock, Send, Timer, Crown, Trophy } from 'lucide-react';
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
import { Asset, ExpirationTime } from '@/app/analisador/page';
import { useAppConfig } from '@/firebase';
import AffiliateLink from './affiliate-link';


type VipStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'DEPOSIT_PENDING' | 'APPROVED' | 'REJECTED' | 'PREMIUM';

type FormData = {
  asset: Asset;
  expirationTime: ExpirationTime;
};

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
  isPremium: boolean;
  vipStatus?: VipStatus;
  isVipModalOpen: boolean;
  setVipModalOpen: (isOpen: boolean) => void;
  setUpgradeModalOpen: (isOpen: boolean) => void;
  rejectedBrokerId?: string;
  isFreeSignalPage?: boolean;
  setBonusModalOpen?: (isOpen: boolean) => void;
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
  isPremium,
  vipStatus,
  isVipModalOpen,
  setVipModalOpen,
  setUpgradeModalOpen,
  rejectedBrokerId,
  isFreeSignalPage = false,
}: SignalFormProps) {
  const { toast } = useToast();
  const { config } = useAppConfig();
  const [brokerId, setBrokerId] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState(false);
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');
  const [showDepositLinks, setShowDepositLinks] = useState(false);


  const assets = showOTC ? allAssets : allAssets.filter(a => !a.includes('(OTC)'));

  useEffect(() => {
    // Open the modal if the limit is reached, the user is not vip, and the status is not PREMIUM
    if (hasReachedLimit && !isPremium) {
      setVipModalOpen(true);
    }
     // Also open modal if user becomes approved and hasn't seen the welcome message
     if (vipStatus === 'PREMIUM' || vipStatus === 'APPROVED') {
        const hasSeenWelcome = localStorage.getItem('hasSeenVipWelcome');
        if (!hasSeenWelcome) {
            setVipModalOpen(true);
        }
    }
  }, [hasReachedLimit, isPremium, vipStatus, setVipModalOpen]);

  useEffect(() => {
    // If OTC is turned off and an OTC asset is selected, reset to a default non-OTC asset
    if (!showOTC && formData.asset.includes('(OTC)')) {
      setFormData({ ...formData, asset: 'EUR/JPY' });
    }
  }, [showOTC, formData, setFormData]);

  useEffect(() => {
    // This effect shows a contextual waiting message directly on the dashboard.
    // It's clearer than only showing status inside a modal.
    if (vipStatus === 'PENDING') {
      setWaitingMessage('Analisando seu cadastro para ser PREMIUM e ter acesso prioritário, e evitar filas.');
    } else if (vipStatus === 'AWAITING_DEPOSIT') {
      setWaitingMessage('Cadastro verificado! Aguardando depósito para liberar seu acesso PREMIUM.');
    } else if (vipStatus === 'DEPOSIT_PENDING') {
      setWaitingMessage('Confirmação de depósito em análise. Em breve seu acesso PREMIUM será liberado.');
    } else {
      setWaitingMessage('');
    }
  }, [vipStatus]);
  
  useEffect(() => {
    // Reset showDepositLinks state when modal is closed or vipStatus changes
    if (!isVipModalOpen || vipStatus !== 'AWAITING_DEPOSIT') {
        setShowDepositLinks(false);
    }
  }, [isVipModalOpen, vipStatus]);


  const handleIdSubmit = async () => {
    if (!/^\d{8,}$/.test(brokerId)) {
      toast({
        variant: 'destructive',
        title: 'ID Inválido',
        description: 'O ID da corretora deve conter apenas números.',
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
        description: 'Seu ID foi recebido e está em análise. A liberação do seu acesso pode levar algumas horas.',
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

  const handleConfirmDeposit = async () => {
     if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado.',
      });
      return;
    }
    setIsConfirmingDeposit(true);
     try {
      const vipRequestRef = doc(firestore, 'vipRequests', user.uid);
      await setDoc(vipRequestRef, { status: 'DEPOSIT_PENDING' }, { merge: true });
      toast({
        title: 'Confirmação Recebida!',
        description: 'Estamos verificando seu depósito. Seu acesso VIP será liberado em breve.',
      });
      setVipModalOpen(false);
    } catch (error) {
       console.error("Error confirming deposit:", error);
       toast({
        variant: 'destructive',
        title: 'Erro na Confirmação',
        description: 'Não foi possível confirmar seu depósito. Tente novamente.',
      });
    } finally {
      setIsConfirmingDeposit(false);
    }
  }

  const buttonDisabled = isLoading || !isMarketOpen || (hasReachedLimit && !waitingMessage && !isPremium);

  const getVipModalContent = () => {
    if (!config) {
        return (
             <div className="py-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Carregando configuração...</p>
            </div>
        )
    }

    switch (vipStatus) {
      case 'PREMIUM':
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
                localStorage.setItem('hasSeenVipWelcome', 'true');
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
                Sua solicitação de acesso PREMIUM foi recebida. Estamos verificando seu ID e seu acesso será liberado em breve.
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
                Falta apenas um passo para o Acesso PREMIUM! Faça seu primeiro depósito de qualquer valor na corretora para ativar o modo prioritário.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {showDepositLinks && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
                  <Button className="w-full" asChild>
                    <Link href={config.iqOptionUrl} target="_blank">
                      Acessar IQ Option
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href={config.exnovaUrl} target="_blank">
                      Acessar Exnova
                    </Link>
                  </Button>
                </div>
              )}
               <Alert className="text-center">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Após depositar, volte aqui e clique em "Já fiz o depósito" para a verificação final.
                  </AlertDescription>
               </Alert>
            </div>
             <DialogFooter className="grid grid-cols-2 gap-2">
                {!showDepositLinks ? (
                    <Button variant="outline" onClick={() => setShowDepositLinks(true)} disabled={isConfirmingDeposit}>
                        Vou depositar
                    </Button>
                ) : (
                    <Button variant="outline" onClick={() => setVipModalOpen(false)} disabled={isConfirmingDeposit}>
                        Fechar
                    </Button>
                )}
                <Button onClick={handleConfirmDeposit} disabled={isConfirmingDeposit}>
                    {isConfirmingDeposit ? <Loader2 className="animate-spin"/> : "Já fiz o depósito"}
                </Button>
            </DialogFooter>
          </>
        );
       case 'DEPOSIT_PENDING':
        return (
           <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Verificação Final</DialogTitle>
              <DialogDescription>
                Recebemos a confirmação do seu depósito. Estamos fazendo a última verificação e seu acesso PREMIUM será liberado em breve.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Analisando confirmação do depósito...</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVipModalOpen(false)}>
                Entendido
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
                Sua solicitação de acesso foi rejeitada. Isso geralmente ocorre se o cadastro não foi feito através do nosso link de afiliado ou se o e-mail já estava registrado na corretora.
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
                    <Link href={config.iqOptionUrl} target="_blank">
                      Cadastrar na IQ Option
                    </Link>
                  </Button>
                   <Button className="w-full" asChild>
                    <Link href={config.exnovaUrl} target="_blank">
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
      default: // No status or limit reached
        return (
          <div className="theme-premium">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline text-primary">Torne-se PREMIUM</DialogTitle>
                    <DialogDescription>
                    No momento, nosso sistema está sobrecarregado e analisando a melhor operação para você. Para evitar filas, torne-se PREMIUM e tenha acesso prioritário.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Cadastre-se na corretora pelo nosso link para se tornar PREMIUM, resgatar seu bônus, evitar a fila de espera e ter sinais ilimitados.
                    </p>
                    <Button className="w-full" asChild>
                        <AffiliateLink href={config.exnovaUrl} target="_blank">
                        Cadastrar na Corretora
                        </AffiliateLink>
                    </Button>
                    <div className="flex w-full items-center space-x-2">
                        <Input
                        type="text"
                        placeholder="ID da Corretora"
                        value={brokerId}
                        onChange={(e) => setBrokerId(e.target.value.replace(/\D/g, ''))}
                        pattern="[0-9]*"
                        disabled={isSubmittingId}
                        />
                        <Button type="submit" size="icon" onClick={handleIdSubmit} disabled={isSubmittingId || brokerId.length < 8}>
                        {isSubmittingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setVipModalOpen(false)}>
                    Resgatar Depois
                    </Button>
                </DialogFooter>
            </DialogContent>
          </div>
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
            {showOTC && config && (
              <Alert className="mt-4 border-primary/20 bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs text-primary/80">
                  <span className="sm:inline">Sinais OTC são para as corretoras</span>
                  <br className="sm:hidden" />
                  <AffiliateLink href={config.iqOptionUrl} target="_blank" className="font-bold underline hover:text-primary mx-1">
                    IQ Option
                  </AffiliateLink>
                  e
                  <AffiliateLink href={config.exnovaUrl} target="_blank" className="font-bold underline hover:text-primary ml-1">
                    Exnova
                  </AffiliateLink>
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
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground shadow-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 pulse-strong"
              onClick={onSubmit}
              disabled={buttonDisabled}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : !isMarketOpen ? (
                <Lock className="mr-2 h-5 w-5" />
              ) : (hasReachedLimit && !isPremium) || waitingMessage ? (
                 <Timer className="mr-2 h-5 w-5" />
              ) : (
                <BarChart className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Analisando...' : !isMarketOpen ? 'Mercado Fechado' : (hasReachedLimit && !isPremium) || waitingMessage ? 'Aguardando...' : 'Analisar Mercado'}
            </Button>
            {!isPremium && (
              isFreeSignalPage ? (
                <Button variant="link" className="w-full flex-col h-auto text-yellow-400 hover:text-yellow-300" asChild>
                  <AffiliateLink href="/vip">
                    <Trophy className="h-5 w-5 mb-0.5" />
                    SEJA VIP
                  </AffiliateLink>
                </Button>
              ) : (
                <Button variant="link" className="w-full flex-col h-auto text-purple-400 hover:text-purple-300" onClick={() => {
                  if (vipStatus) {
                    setVipModalOpen(true);
                  } else {
                    setUpgradeModalOpen(true);
                  }
                }}>
                    <Crown className="h-5 w-5 mb-0.5" />
                    SEJA PREMIUM
                </Button>
              )
            )}
        </div>
      </div>

      <Dialog open={isVipModalOpen} onOpenChange={setVipModalOpen}>
        <DialogContent className="sm:max-w-lg">
          {getVipModalContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}

    