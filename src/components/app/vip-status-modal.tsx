
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, Send, CheckCircle2 } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useFirebase } from '@/firebase';
import { useAppConfig } from '@/firebase/config-provider';
import { useToast } from '@/hooks/use-toast';

type VipStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'DEPOSIT_PENDING' | 'APPROVED' | 'REJECTED' | 'PREMIUM';

type VipStatusModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  vipStatus?: VipStatus;
  rejectedBrokerId?: string;
};

export function VipStatusModal({
  isOpen,
  onOpenChange,
  vipStatus,
  rejectedBrokerId,
}: VipStatusModalProps) {
  const { user, firestore } = useFirebase();
  const { config } = useAppConfig();
  const { toast } = useToast();
  
  const [brokerId, setBrokerId] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState(false);
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);
  const [showDepositLinks, setShowDepositLinks] = useState(false);

  useEffect(() => {
    if (!isOpen || vipStatus !== 'AWAITING_DEPOSIT') {
        setShowDepositLinks(false);
    }
  }, [isOpen, vipStatus]);

  const handleIdSubmit = async () => {
    if (!/^\d{5,}$/.test(brokerId)) {
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
        title: 'ID já analisado',
        description: 'Este ID já foi recusado. Por favor, insira um novo ID válido.',
      });
      return;
    }

    if (!user || !firestore) return;

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
        description: 'Seu ID está em análise. A liberação pode levar algumas horas.',
      });
      onOpenChange(false);
      setBrokerId('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: 'Tente novamente mais tarde.',
      });
    } finally {
      setIsSubmittingId(false);
    }
  };

  const handleConfirmDeposit = async () => {
     if (!user || !firestore) return;
     setIsConfirmingDeposit(true);
     try {
      const vipRequestRef = doc(firestore, 'vipRequests', user.uid);
      await setDoc(vipRequestRef, { status: 'DEPOSIT_PENDING' }, { merge: true });
      toast({
        title: 'Confirmação Recebida!',
        description: 'Estamos verificando seu depósito.',
      });
      onOpenChange(false);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro na Confirmação' });
    } finally {
      setIsConfirmingDeposit(false);
    }
  };

  const renderContent = () => {
    if (!config) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    switch (vipStatus) {
      case 'PREMIUM':
      case 'APPROVED':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary flex items-center gap-2">
                <CheckCircle2 className="text-green-500" /> Acesso Liberado!
              </DialogTitle>
              <DialogDescription>
                Você agora tem acesso prioritário e ilimitado a todos os sinais da Estratégia Chinesa.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button className="w-full" onClick={() => {
                localStorage.setItem('hasSeenVipWelcome', 'true');
                onOpenChange(false);
              }}>
                Começar Operações
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
                Estamos a validar o seu cadastro na nossa rede de afiliados.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center space-y-4">
              <div className="relative inline-block">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
              <p className="text-xs text-muted-foreground uppercase font-black tracking-widest opacity-60">Sincronizando com a Corretora...</p>
            </div>
            <DialogFooter>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Fechar Janela</Button>
            </DialogFooter>
          </>
        );
      case 'AWAITING_DEPOSIT':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Cadastro Verificado! ✅</DialogTitle>
              <DialogDescription>
                Seu ID foi encontrado. Agora, realize um depósito para ativar os sinais ilimitados.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {showDepositLinks && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in">
                  <Button variant="outline" className="h-12" asChild>
                    <a href={config.iqOptionPremiumUrl} target="_blank" rel="noopener noreferrer">IQ Option</a>
                  </Button>
                  <Button variant="outline" className="h-12" asChild>
                    <a href={config.exnovaPremiumUrl} target="_blank" rel="noopener noreferrer">Exnova</a>
                  </Button>
                </div>
              )}
               <Alert className="bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs">
                    Após o depósito, clique em "Já depositei" para a liberação final.
                  </AlertDescription>
               </Alert>
            </div>
             <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
                {!showDepositLinks && (
                    <Button className="w-full" onClick={() => setShowDepositLinks(true)}>Ir para Depósito</Button>
                )}
                <Button variant={showDepositLinks ? 'default' : 'outline'} className="w-full" onClick={handleConfirmDeposit} disabled={isConfirmingDeposit}>
                    {isConfirmingDeposit ? <Loader2 className="animate-spin"/> : "Já fiz o depósito"}
                </Button>
            </DialogFooter>
          </>
        );
       case 'DEPOSIT_PENDING':
        return (
           <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Confirmando Saldo</DialogTitle>
              <DialogDescription>
                Recebemos o seu aviso de depósito. O acesso PREMIUM será libertado assim que o valor for processado pela corretora.
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary opacity-50" />
            </div>
            <DialogFooter>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Entendido</Button>
            </DialogFooter>
          </>
        );
      case 'REJECTED':
        return (
           <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-destructive">Falha na Vinculação</DialogTitle>
              <DialogDescription>
                O seu ID não foi encontrado sob a nossa rede. Isto acontece se já tinha conta ou se não usou o nosso link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-white/5 rounded-xl space-y-3 border border-white/5">
                <p className="text-xs font-bold uppercase opacity-60">Tente novamente:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={config.exnovaPremiumUrl} target="_blank" rel="noopener noreferrer">Nova Conta</a>
                  </Button>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Novo ID"
                      value={brokerId}
                      onChange={(e) => setBrokerId(e.target.value.replace(/\D/g, ''))}
                      className="h-9 bg-black/40"
                    />
                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleIdSubmit} disabled={isSubmittingId || brokerId.length < 5}>
                      {isSubmittingId ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </>
        )
      default:
        return (
           <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline text-primary">Acesso Premium</DialogTitle>
              <DialogDescription>
                Para sinais ilimitados e sem filas, vincule a sua conta da corretora à nossa inteligência artificial.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
               <Button className="w-full h-12 font-black" asChild>
                  <a href={config.exnovaPremiumUrl} target="_blank" rel="noopener noreferrer">CRIAR CONTA NA CORRETORA</a>
               </Button>
               <div className="flex gap-2">
                  <Input 
                    placeholder="Insira seu ID aqui" 
                    value={brokerId}
                    onChange={(e) => setBrokerId(e.target.value.replace(/\D/g, ''))}
                    className="h-12 bg-white/5"
                  />
                  <Button className="h-12 px-6" onClick={handleIdSubmit} disabled={isSubmittingId || brokerId.length < 5}>
                    {isSubmittingId ? <Loader2 className="animate-spin" /> : 'ATIVAR'}
                  </Button>
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Depois</Button>
            </DialogFooter>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-white/10 bg-card/95 backdrop-blur-2xl">
        <div className="theme-premium">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
