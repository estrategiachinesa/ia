
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Lock, Star, HelpCircle } from 'lucide-react';
import { CurrencyFlags } from './currency-flags';
import Link from 'next/link';

type FreeSignalResultProps = {
  asset: string;
  expirationTime: string;
  targetTime: string;
  onReset: () => void;
};

export function FreeSignalResult({ asset, expirationTime, targetTime, onReset }: FreeSignalResultProps) {
  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <Card className="border-primary/30 bg-background/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Sinal Gerado!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-lg">
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Ativo:</span>
            <span className="font-bold flex items-center gap-2">
                <CurrencyFlags asset={asset} />
                {asset}
            </span>
          </div>
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Expiração:</span>
            <span className="font-bold">{expirationTime}</span>
          </div>
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Hora da entrada:</span>
            <span className="font-bold">{targetTime}</span>
          </div>

          <div className="flex justify-between items-center text-2xl font-bold p-3 rounded-lg bg-muted/50 text-foreground">
            <span>Ação:</span>
             <HelpCircle className="h-8 w-8 text-primary animate-pulse" />
          </div>
        
          <div className="pt-4 space-y-2">
            <p className="text-sm text-primary font-semibold">Revele este sinal e tenha acesso ILIMITADO!</p>
            <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold hover:to-yellow-600 shadow-lg">
              <Link href="https://pay.hotmart.com/E101943327K" target="_blank">
                <Star className="mr-2"/> Adquirir Licença VIP
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=" target="_blank">
                Revelar Sinal Grátis (Via Cadastro)
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={onReset} 
          className="w-full text-muted-foreground"
        >
            <RefreshCw className="mr-2 h-4 w-4" />
            Analisar Outro Ativo
        </Button>
      </div>
    </div>
  );
}
