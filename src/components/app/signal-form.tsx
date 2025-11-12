
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Info, Loader2, Lock, Send, Timer } from 'lucide-react';
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
  vipStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
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
}: SignalFormProps) {
  const { toast } = useToast();
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);
  const [brokerId, setBrokerId] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState('');

  const assets = showOTC ? allAssets : allAssets.filter(a => !a.includes('(OTC)'));

  useEffect(() => {
    // Open the modal if the limit is reached, the user is not premium, and their status is not pending.
    if (hasReachedLimit && !isPremium && vipStatus !== 'PENDING') {
      setPremiumModalOpen(true);
    }
  }, [hasReachedLimit, isPremium, vipStatus]);

  useEffect(() => {
    // If OTC is turned off and an OTC asset is selected, reset to a default non-OTC asset
    if (!showOTC && formData.asset.includes('(OTC)')) {
      setFormData({ ...formData, asset: 'EUR/JPY' });
    }
  }, [showOTC, formData, setFormData]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    // Show waiting message if limit is reached but modal is not (or cannot be) open
    if (hasReachedLimit && !isPremiumModalOpen) {
        let queuePosition = 5;
        const messages = [
            `Estamos na fila, aguardando o melhor momento... (Posição: #${queuePosition})`,
            "Analisando volatilidade do mercado...",
            "Servidores com alto tráfego, aguarde um instante.",
        ];
        
        const updateMessage = () => {
            if (queuePosition > 1) {
                queuePosition--;
            }
            setWaitingMessage(`Estamos na fila, aguardando o melhor momento... (Posição: #${queuePosition})`);
        };
        
        // Show a specific message if their request is pending
        if(vipStatus === 'PENDING') {
            setWaitingMessage('Seu acesso PREMIUM está em análise. Enquanto isso, aguarde na fila.');
        } else {
            setWaitingMessage(messages[0]);
            interval = setInterval(updateMessage, 8000);
        }

    } else {
        setWaitingMessage('');
    }
    return () => clearInterval(interval);
  }, [hasReachedLimit, isPremiumModalOpen, vipStatus]);

  const handleIdSubmit = async () => {
    if (!/^\d{8,}$/.test(brokerId)) {
      toast({
        variant: 'destructive',
        title: 'ID Inválido',
        description: 'O ID da corretora deve conter apenas números e ter no mínimo 8 dígitos.',
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
      const premiumRequestRef = doc(firestore, 'vipRequests', user.uid);
      
      setDocumentNonBlocking(premiumRequestRef, {
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
      setPremiumModalOpen(false);
      setBrokerId('');

    } catch (error) {
      console.error("Error submitting Premium ID:", error);
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

  return (
    <>
      <div className="w-full space-y-8 text-center">
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
      </div>

      <Dialog open={isPremiumModalOpen} onOpenChange={setPremiumModalOpen}>
        <DialogContent className="sm:max-w-lg">
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
                Use um dos nossos links para garantir seu acesso. Deposite o valor mínimo para ativar sua conta.
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
                Após o cadastro e depósito, insira o ID da sua conta da corretora abaixo para solicitar a liberação.
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
            <Button variant="outline" onClick={() => setPremiumModalOpen(false)}>
              Continuar na Fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    
