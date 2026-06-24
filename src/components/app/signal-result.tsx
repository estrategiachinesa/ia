'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import type { SignalData } from '@/app/analisador/page';
import { CurrencyFlags } from './currency-flags';
import { cn } from '@/lib/utils';

type SignalResultProps = {
  data: SignalData;
  onReset: () => void;
};

export function SignalResult({ data, onReset }: SignalResultProps) {
  const isCall = data.signal.includes('CALL');
  const isFinished = data.operationStatus === 'finished';
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const renderStatus = () => {
    if (data.operationStatus === 'pending' && data.countdown !== null && data.countdown > 0) {
      return <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-40">Iniciar em: <span className="text-yellow-400 font-mono text-base ml-1">{formatTime(data.countdown)}</span></p>;
    }
    if (data.operationStatus === 'active' && data.operationCountdown !== null && data.operationCountdown > 0) {
        const isPurchaseTimeOver = data.operationCountdown <= 29;
        const isBlinking = data.operationCountdown <= 3;

        return (
          <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-40">
            Finalizando em:{' '}
            <span className={cn(
                "font-mono text-base ml-1",
                isPurchaseTimeOver ? 'text-red-500' : 'text-blue-400',
                isBlinking && 'animate-pulse'
            )}>
              {formatTime(data.operationCountdown)}
            </span>
          </p>
        );
    }
    if (data.operationStatus === 'finished') {
        return (
            <div className="flex items-center justify-center gap-2 text-green-500 animate-in zoom-in-95 duration-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Operação Finalizada</span>
            </div>
        );
    }
     return <p className="text-[0.5rem] font-black uppercase opacity-20">Aguardando Engine...</p>;
  };


  return (
    <div className="w-full max-w-sm space-y-4 md:space-y-6 text-center">
      <Card
        className={cn(
          'border-white/5 bg-black/40 backdrop-blur-2xl rounded-[2rem] overflow-hidden shadow-2xl',
          data.operationStatus === 'active' && (isCall ? 'border-green-500/20 shadow-green-500/5' : 'border-red-500/20 shadow-red-500/5')
        )}
      >
        <div className={cn(
            "h-1 w-full",
            isCall ? "bg-green-500" : "bg-red-500"
        )} />
        <CardHeader className="pt-4 pb-1">
          <CardTitle className="text-[0.55rem] md:text-[0.6rem] font-black uppercase tracking-[0.4em] opacity-30">
            Sinal Gerado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 md:space-y-4 px-4 md:px-6 pb-6 md:pb-8">
          <div className="space-y-1.5 md:space-y-3">
              <div className="flex justify-between items-center bg-white/5 p-2 md:p-3 rounded-xl border border-white/5">
                <span className="text-[0.5rem] md:text-[0.55rem] font-black text-white/30 uppercase">Ativo</span>
                <span className="font-black text-[0.7rem] md:text-sm flex items-center gap-2">
                    <CurrencyFlags asset={data.asset} />
                    {data.asset.replace(' (OTC)', '')}
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 md:p-3 rounded-xl border border-white/5">
                <span className="text-[0.5rem] md:text-[0.55rem] font-black text-white/30 uppercase">Tempo</span>
                <span className="font-black text-[0.7rem] md:text-sm uppercase">{data.expirationTime}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 md:p-3 rounded-xl border border-white/5">
                <span className="text-[0.5rem] md:text-[0.55rem] font-black text-white/30 uppercase">Entrada</span>
                <span className="font-black text-[0.7rem] md:text-sm font-mono">{data.targetTime}</span>
              </div>
          </div>
          
          <div
            className={cn(
                "flex flex-col items-center justify-center p-3 md:p-5 rounded-2xl border shadow-inner transition-all duration-700",
                isCall 
                    ? "bg-green-500/10 border-green-500/20 text-green-500" 
                    : "bg-red-500/10 border-red-500/20 text-red-500"
            )}
          >
            <span className="text-[0.5rem] font-black uppercase tracking-[0.4em] mb-1 opacity-60">Ação Sugerida</span>
            <span className="text-xl md:text-2xl font-black uppercase tracking-tighter">
              {data.signal}
            </span>
          </div>

          <div className="pt-1">
             {renderStatus()}
          </div>
        </CardContent>
      </Card>

      {/* Botão NOVA ANÁLISE - Exibido apenas após finalizar */}
      {isFinished && (
          <div className="px-4 pb-2 animate-in slide-in-from-bottom-4 duration-1000">
            <Button 
              onClick={onReset} 
              className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] bg-primary text-primary-foreground hover:scale-[1.02] shadow-2xl shadow-primary/20 transition-all"
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                NOVA ANÁLISE
            </Button>
          </div>
      )}
    </div>
  );
}
