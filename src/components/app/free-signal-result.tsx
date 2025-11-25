
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, HelpCircle } from 'lucide-react';
import { CurrencyFlags } from './currency-flags';
import AffiliateLink from './affiliate-link';
import { SignalData } from '@/app/demo/page';
import { cn } from '@/lib/utils';
import { Asset } from '@/app/analisador/page';
import { useAppConfig } from '@/firebase';

type FreeSignalResultProps = {
  data: SignalData;
  onReset: () => void;
  isMarketMode: boolean;
  isSignalFinished: boolean;
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const renderStatus = (data: SignalData) => {
    if (data.operationStatus === 'pending' && data.countdown !== null && data.countdown > 0) {
      return <p>Iniciar em: <span className="text-yellow-400">{formatTime(data.countdown)}</span></p>;
    }
    if (data.operationStatus === 'active' && data.operationCountdown !== null && data.operationCountdown > 0) {
        
        const isPurchaseTimeOver = data.operationCountdown <= 29;
        const isBlinking = data.operationCountdown <= 3;

        return (
          <p>
            Finalizando em:{' '}
            <span className={cn(
                isPurchaseTimeOver ? 'text-red-500' : 'text-blue-400',
                isBlinking && 'animate-pulse'
            )}>
              {formatTime(data.operationCountdown)}
            </span>
          </p>
        );
    }
    if (data.operationStatus === 'finished') {
        return <p>✅ Operação finalizada!</p>
    }
     return <p>⏱️ Aguardando início...</p>;
  };

export function FreeSignalResult({ data, onReset, isMarketMode, isSignalFinished }: FreeSignalResultProps) {
  const { asset, expirationTime, targetTime, signal } = data;
  const { config } = useAppConfig();
  const isCall = signal?.includes('CALL');

  const actionContent = () => {
    if (isMarketMode && signal && signal !== '?') {
      return (
        <div
            className={`flex justify-between items-center text-2xl font-bold p-3 rounded-lg ${
              isCall ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
            }`}
          >
            <span>Ação:</span>
            <span>
              {signal}
            </span>
          </div>
      );
    }
    return (
      <>
        <div className="flex justify-between items-center text-2xl font-bold p-3 rounded-lg bg-muted/50 text-foreground">
          <span>Ação:</span>
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
      
        <div className="pt-4 space-y-2">
          <p className="text-sm text-primary font-semibold">Revele este sinal e tenha acesso ILIMITADO!</p>
          <Button asChild className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold hover:to-yellow-600 shadow-lg">
            <AffiliateLink href="/vip">
              Adquirir Licença VIP
            </AffiliateLink>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <AffiliateLink href={config?.exnovaUrl || '#'} target="_blank">
              Revelar Sinal Grátis (Via Cadastro)
            </AffiliateLink>
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <Card className={cn(
          'border-primary/30 bg-background/50',
           isMarketMode && isCall && signal !== '?' && 'border-success/50 bg-success/10',
           isMarketMode && !isCall && signal !== '?' && 'border-destructive/50 bg-destructive/10'
        )}>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Sinal Gerado!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-lg">
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Ativo:</span>
            <span className="font-bold flex items-center gap-2">
                <CurrencyFlags asset={asset as Asset} />
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
          
          {actionContent()}

          {isMarketMode && (
             <div className="text-center font-bold text-xl pt-2">
                {renderStatus(data)}
             </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={onReset} 
          className="w-full text-muted-foreground"
          disabled={isMarketMode && !isSignalFinished}
        >
            <RefreshCw className="mr-2 h-4 w-4" />
            Analisar Outro Ativo
        </Button>
      </div>
    </div>
  );
}
