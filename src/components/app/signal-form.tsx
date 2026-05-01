'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Info, Loader2, Lock, Send, Timer, Crown, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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


/**
 * Widget de Calendário Económico detalhado, integrado diretamente no painel de comando.
 * Filtra por moedas e importância, focado em EUR, USD e JPY.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  if (asset.includes('(OTC)')) return null;

  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  // IDs dos países: USA: 5, Euro Zone: 72, Japan: 35
  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-8 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl group animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="px-5 py-3 bg-primary/5 border-b border-white/5 flex items-center justify-between group-hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[0.65rem] font-black text-primary uppercase tracking-[0.15em]">Calendário Económico Real</span>
        </div>
        <span className="text-[0.55rem] text-muted-foreground uppercase font-black opacity-30 tracking-tighter">Live Feed</span>
      </div>
      <div className="h-[320px] w-full overflow-hidden relative bg-[#0a0a0a]">
         <div className="absolute inset-0 scale-[1.1] origin-top">
            <iframe 
              src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=2,3&features=timezone&countries=${countries}&calType=day&timeZone=12&lang=12`} 
              width="100%" 
              height="400" 
              frameBorder="0" 
              allowTransparency={true}
              className="filter invert hue-rotate-180 brightness-[0.7] contrast-[1.3] saturate-[0.8]"
              style={{ backgroundColor: 'transparent' }}
            ></iframe>
         </div>
         {/* Gradientes de desvanecimento para integração visual */}
         <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none" />
         <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>
      <div className="px-5 py-2 bg-white/5 flex justify-between items-center">
         <span className="text-[0.55rem] text-primary/50 font-bold uppercase tracking-widest">Fonte: Investing.com</span>
         <div className="flex gap-2">
            <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-yellow-500" />
                <span className="text-[0.5rem] text-muted-foreground font-bold">MED</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-red-500" />
                <span className="text-[0.5rem] text-muted-foreground font-bold">ALTA</span>
            </div>
         </div>
      </div>
    </div>
  );
}


type VipStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'DEPOSIT_PENDING' | 'APPROVED' | 'REJECTED' | 'PREMIUM';

type FormData = {
  asset: Asset;
  expirationTime: ExpirationTime;
};

type SignalFormProps = {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
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

  const assets = showOTC 
    ? allAssets.filter(a => a.includes('(OTC)')) 
    : allAssets.filter(a => !a.includes('(OTC)'));

  useEffect(() => {
    if (hasReachedLimit && !isPremium) {
      setVipModalOpen(true);
    }
     if (vipStatus === 'PREMIUM' || vipStatus === 'APPROVED') {
        const hasSeenWelcome = localStorage.getItem('hasSeenVipWelcome');
        if (!hasSeenWelcome) {
            setVipModalOpen(true);
        }
    }
  }, [hasReachedLimit, isPremium, vipStatus, setVipModalOpen]);

  useEffect(() => {
    if (showOTC && !formData.asset.includes('(OTC)')) {
      const otcAsset = `${formData.asset} (OTC)` as Asset;
      if (allAssets.includes(otcAsset)) {
        setFormData(prev => ({ ...prev, asset: otcAsset }));
      }
    } else if (!showOTC && formData.asset.includes('(OTC)')) {
      const normalAsset = formData.asset.replace(' (OTC)', '') as Asset;
      if (allAssets.includes(normalAsset)) {
        setFormData(prev => ({ ...prev, asset: normalAsset }));
      }
    }
  }, [showOTC, setFormData]);

  useEffect(() => {
    if (vipStatus === 'PENDING') {
      setWaitingMessage('Analisando cadastro para prioridade PREMIUM.');
    } else if (vipStatus === 'AWAITING_DEPOSIT') {
      setWaitingMessage('Cadastro ok! Aguardando depósito para liberar acesso.');
    } else if (vipStatus === 'DEPOSIT_PENDING') {
      setWaitingMessage('Verificando confirmação de depósito.');
    } else {
      setWaitingMessage('');
    }
  }, [vipStatus]);
  
  useEffect(() => {
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
      default:
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
      <div className="w-full space-y-8 text-center">
        
        <EconomicCalendarWidget asset={formData.asset} />

        <div className="space-y-3">
          <p className="text-[0.75rem] text-foreground/50 font-bold uppercase tracking-widest">
            Configuração de Ativo
          </p>
          <div className="h-px w-12 bg-primary/30 mx-auto" />
        </div>

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-2.5 rounded-xl">
                <Timer className="h-4 w-4 text-primary" />
                <AlertDescription className="text-[0.7rem] font-bold text-primary/80">
                    {waitingMessage}
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="asset-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ativo Selecionado:</Label>
              <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">
                  exibir (OTC)
                </Label>
                <Switch
                  id="otc-switch"
                  checked={showOTC}
                  onCheckedChange={setShowOTC}
                  disabled={isLoading}
                  className="scale-75"
                />
              </div>
            </div>
            <Select
              value={formData.asset}
              onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-14 text-base rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-lg" id="asset-select">
                <SelectValue asChild>
                  <div className="flex items-center gap-3">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-bold tracking-tight">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-xl focus:bg-primary/10">
                    <div className="flex items-center gap-3">
                      <CurrencyFlags asset={asset} />
                      <span className="font-bold">{asset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showOTC && config && (
              <Alert className="mt-4 border-primary/20 bg-primary/10 rounded-2xl">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-[0.65rem] text-primary font-bold leading-relaxed">
                  MODO OTC ATIVO: Sinais exclusivos para corretoras{' '}
                  <AffiliateLink href={config.iqOptionUrl} target="_blank" className="underline hover:opacity-80">IQ Option</AffiliateLink> ou{' '}
                  <AffiliateLink href={config.exnovaUrl} target="_blank" className="underline hover:opacity-80">Exnova</AffiliateLink>.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="expiration-select" className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Tempo de Expiração:</Label>
            <Select
              value={formData.expirationTime}
              onValueChange={(value) => setFormData({ ...formData, expirationTime: value as '1m' | '5m' })}
              disabled={isLoading}
            >
              <SelectTrigger className="h-14 text-base rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-lg" id="expiration-select">
                <SelectValue placeholder="Selecione o Tempo" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl">
                <SelectItem value="1m" className="rounded-xl focus:bg-primary/10 font-bold">1 minuto (M1)</SelectItem>
                <SelectItem value="5m" className="rounded-xl focus:bg-primary/10 font-bold">5 minutos (M5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full space-y-4 pt-4">
            <Button
              size="lg"
              className="w-full h-16 text-lg font-black bg-primary text-primary-foreground shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 pulse-strong rounded-2xl uppercase tracking-tighter"
              onClick={onSubmit}
              disabled={buttonDisabled}
            >
              {isLoading ? (
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              ) : !isMarketOpen ? (
                <Lock className="mr-3 h-6 w-6" />
              ) : (hasReachedLimit && !isPremium) || waitingMessage ? (
                 <Timer className="mr-3 h-6 w-6" />
              ) : (
                <BarChart className="mr-3 h-6 w-6" />
              )}
              {isLoading ? 'Analisando Mercado...' : !isMarketOpen ? 'Mercado Fechado' : (hasReachedLimit && !isPremium) || waitingMessage ? 'Aguardando Liberação' : 'Analisar Agora'}
            </Button>
            {!isPremium && (
              isFreeSignalPage ? (
                <Button variant="link" className="w-full flex-col h-auto text-yellow-400 hover:text-yellow-300 group" asChild>
                  <AffiliateLink href="/vip">
                    <Trophy className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em]">Upgrade para VIP</span>
                  </AffiliateLink>
                </Button>
              ) : (
                <Button variant="link" className="w-full flex-col h-auto text-purple-400 hover:text-purple-300 group" onClick={() => {
                  if (vipStatus) {
                    setVipModalOpen(true);
                  } else {
                    setUpgradeModalOpen(true);
                  }
                }}>
                    <Crown className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[0.6rem] font-black uppercase tracking-[0.2em]">Seja Membro PREMIUM</span>
                </Button>
              )
            )}
        </div>
      </div>

      <Dialog open={isVipModalOpen} onOpenChange={setVipModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-white/10 bg-card/95 backdrop-blur-2xl">
          {getVipModalContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
