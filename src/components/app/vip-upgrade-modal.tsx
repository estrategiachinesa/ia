
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Gift, Send, Loader2, Crown } from 'lucide-react';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Auth } from 'firebase/auth';
import { Firestore, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AppConfig } from '@/firebase';

type VipUpgradeModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  firestore: Firestore | null;
  config: AppConfig | null;
};

type ModalStep = 'bonus' | 'member';

export function VipUpgradeModal({
  isOpen,
  onOpenChange,
  user,
  firestore,
  config
}: VipUpgradeModalProps) {
  const [step, setStep] = useState<ModalStep>('bonus');
  const [brokerId, setBrokerId] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    onOpenChange(false);
    // Reset to first step after a short delay
    setTimeout(() => setStep('bonus'), 300);
  };

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
      setBrokerId('');
      handleClose();

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


  const renderBonusStep = () => (
    <>
      <DialogHeader className="text-center items-center">
        <Gift className="h-12 w-12 text-primary" />
        <DialogTitle className="text-2xl font-headline">Você ganhou $10.000 para treinar!</DialogTitle>
        <DialogDescription className="text-base text-center">
          Para ter acesso aos sinais da Estratégia Chinesa e começar a operar, resgate seu bônus de treinamento agora.
          Tenha acesso prioritário e ilimitado aos sinais, sem filas ou limites.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="pt-4">
        <Button onClick={() => setStep('member')} className="w-full">
            Resgatar Bônus e Acessar
        </Button>
      </DialogFooter>
    </>
  );

  const renderMemberStep = () => (
     <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline text-primary">Torne-se MEMBRO</DialogTitle>
        <DialogDescription>
            Cadastre-se na corretora por nosso link para se tornar um membro, resgatar seu bônus e reduzir a fila de espera.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <Button className="w-full" asChild>
            <Link href={config?.exnovaUrl || '#'} target="_blank">
                Cadastrar na Corretora
            </Link>
        </Button>
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
      <DialogFooter className='sm:justify-between'>
        <Button variant="ghost" onClick={handleClose}>
            Resgatar Depois
        </Button>
        <Button className="w-full sm:w-auto" asChild>
            <Link href="/vip">
              <Crown className="mr-2" /> Quero o Acesso VIP (Via Pagamento)
            </Link>
        </Button>
      </DialogFooter>
    </>
  );


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        {step === 'bonus' ? renderBonusStep() : renderMemberStep()}
      </DialogContent>
    </Dialog>
  );
}
