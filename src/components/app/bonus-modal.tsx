
'use client';

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
import { useAppConfig } from '@/firebase';
import { Gift } from 'lucide-react';

type BonusModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onShowInstructions?: () => void;
};

export function BonusModal({ isOpen, onOpenChange, onShowInstructions }: BonusModalProps) {
  const { config } = useAppConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="text-center items-center">
          <Gift className="h-12 w-12 text-primary" />
          <DialogTitle className="text-2xl font-headline">Você ganhou $10.000 para treinar!</DialogTitle>
          <DialogDescription className="text-base">
           Para ter acesso aos sinais da Estratégia Chinesa e começar a operar, resgate seu bônus de treinamento agora.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
            <Button asChild className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg hover:to-yellow-600">
              <Link href={config?.exnovaUrl || '#'} target="_blank" onClick={() => onOpenChange(false)}>
                RESGATAR BÔNUS AGORA
              </Link>
            </Button>
            {onShowInstructions && (
                <Button variant="outline" onClick={onShowInstructions}>
                    Ver Instruções
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
