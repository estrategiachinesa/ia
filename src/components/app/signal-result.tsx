'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Clock, Timer, Target, Zap, Activity } from 'lucide-react';
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
  const isActive = data.operationStatus === 'active';
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const renderStatus = () => {
    if (data.operationStatus === 'pending' && data.countdown !== null && data.countdown > 0) {
      return (
        <div className="flex flex-col items-center gap-0.5 md:gap-1 animate-pulse">
            <span className="text-[0.45rem] md:text-[0.55rem] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30">Aguardando Início</span>
            <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-500/10 px-3 md:px-4 py-0.5 md:py-1 rounded-full border border-yellow-500/20">
                <Timer className="h-2.5 w-2.5 md:h-3 md:w-3 text-yellow-500" />
                <span className="text-yellow-500 font-mono font-black text-base md:text-lg tracking-tighter">{formatTime(data.countdown)}</span>
            </div>
        </div>
      );
    }
    if (data.operationStatus === 'active' && data.operationCountdown !== null && data.operationCountdown > 0) {
        const isPurchaseTimeOver = data.operationCountdown <= 29;
        const isBlinking = data.operationCountdown <= 3;

        return (
          <div className="flex flex-col items-center gap-0.5 md:gap-1">
            <span className="text-[0.45rem] md:text-[0.55rem] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-white/30">Operação em Curso</span>
            <div className={cn(
                "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-0.5 md:py-1 rounded-full border transition-all duration-500",
                isPurchaseTimeOver ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'
            )}>
              <Activity className={cn("h-2.5 w-2.5 md:h-3 md:w-3", isPurchaseTimeOver ? 'text-red-500' : 'text-blue-400')} />
              <span className={cn(
                "font-mono font-black text-base md:text-lg tracking-tighter",
                isPurchaseTimeOver ? 'text-red-500' : 'text-blue-400',
                isBlinking && 'animate-pulse'
              )}>
                {formatTime(data.operationCountdown)}
              </span>
            </div>
          </div>
        );
    }
    if (data.operationStatus === 'finished') {
        return (
            <div className="flex items-center justify-center gap-2 md:gap-3 bg-green-500/10 px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-green-500/20 animate-in zoom-in-95 duration-700 shadow-2xl shadow-green-500/5">
                <div className="bg-green-500 p-0.5 md:p-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-black" />
                </div>
                <span className="text-xs md:text-sm font-black uppercase tracking-[0.1em] text-green-500">Operação Concluída</span>
            </div>
        );
    }
     return <p className="text-[0.45rem] font-black uppercase opacity-20 tracking-widest">Sincronizando Engine...</p>;
  };


  return (
    <div className="w-full max-w-sm space-y-3 md:space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <Card
        className={cn(
          'border-white/10 bg-black/60 backdrop-blur-3xl rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl relative group transition-all duration-700',
          isActive && (isCall ? 'border-green-500/30 shadow-green-500/10' : 'border-red-500/30 shadow-red-500/10')
        )}
      >
        {/* Barra de Status Topo */}
        <div className={cn(
            "h-1 md:h-1.5 w-full transition-all duration-1000",
            isActive ? "animate-pulse" : "",
            isCall ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        )} />

        <CardHeader className="pt-3 md:pt-6 pb-1 md:pb-2">
          <CardTitle className="flex items-center justify-center gap-2">
             <Zap className={cn("h-2.5 w-2.5 md:h-3 md:w-3", isCall ? "text-green-500" : "text-red-500")} />
             <span className="text-[0.45rem] md:text-[0.6rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-white/20">Protocolo de Elite</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 md:space-y-6 px-4 md:px-8 pb-5 md:pb-8">
          
          {/* Grid de Dados Técnicos */}
          <div className="grid grid-cols-3 gap-1.5 md:gap-2">
              <div className="flex flex-col items-center bg-white/[0.03] p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-white/5 group-hover:bg-white/[0.06] transition-colors">
                <span className="text-[0.4rem] md:text-[0.45rem] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-1.5">Ativo</span>
                <div className="flex items-center gap-1 md:gap-1.5">
                    <CurrencyFlags asset={data.asset} />
                    <span className="font-black text-[0.6rem] md:text-xs text-white uppercase tracking-tighter">{data.asset.replace(' (OTC)', '')}</span>
                </div>
              </div>
              <div className="flex flex-col items-center bg-white/[0.03] p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-white/5 group-hover:bg-white/[0.06] transition-colors">
                <span className="text-[0.4rem] md:text-[0.45rem] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-1.5">Tempo</span>
                <div className="flex items-center gap-1 md:gap-1.5">
                    <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary/50" />
                    <span className="font-black text-[0.6rem] md:text-xs text-white uppercase">{data.expirationTime}</span>
                </div>
              </div>
              <div className="flex flex-col items-center bg-white/[0.03] p-1.5 md:p-2.5 rounded-xl md:rounded-2xl border border-white/5 group-hover:bg-white/[0.06] transition-colors">
                <span className="text-[0.4rem] md:text-[0.45rem] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-1.5">Entrada</span>
                <div className="flex items-center gap-1 md:gap-1.5">
                    <Target className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary/50" />
                    <span className="font-black text-[0.65rem] md:text-xs text-white font-mono">{data.targetTime}</span>
                </div>
              </div>
          </div>
          
          {/* Bloco de Ação Sugerida */}
          <div
            className={cn(
                "relative flex flex-col items-center justify-center p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border shadow-2xl transition-all duration-1000 overflow-hidden",
                isCall 
                    ? "bg-green-500/10 border-green-500/20 text-green-500 shadow-green-500/5" 
                    : "bg-red-500/10 border-red-500/20 text-red-500 shadow-red-500/5"
            )}
          >
            {/* Efeito de Brilho de Fundo */}
            <div className={cn(
                "absolute inset-0 opacity-10",
                isCall ? "bg-gradient-to-t from-green-500 to-transparent" : "bg-gradient-to-t from-red-500 to-transparent"
            )} />

            <span className="text-[0.45rem] md:text-[0.55rem] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mb-1 md:mb-2 opacity-50 relative z-10">Ação Confirmada</span>
            <span className="text-xl md:text-3xl font-black uppercase tracking-tighter relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              {data.signal}
            </span>

            {/* Partículas Decorativas HUD */}
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-current opacity-30" />
            <div className="absolute top-2 right-2 w-1 h-1 border-t border-r border-current opacity-30" />
            <div className="absolute bottom-2 left-2 w-1 h-1 border-b border-l border-current opacity-30" />
            <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-current opacity-30" />
          </div>

          {/* Status Dinâmico */}
          <div className="pt-1 md:pt-2 min-h-[35px] md:min-h-[45px] flex items-center justify-center">
             {renderStatus()}
          </div>
        </CardContent>
      </Card>

      {/* Botão de Reset Otimizado */}
      {isFinished && (
          <div className="px-2 md:px-4 pb-2 animate-in slide-in-from-bottom-6 duration-1000">
            <Button 
              onClick={onReset} 
              className="w-full h-12 md:h-16 rounded-[1rem] md:rounded-[1.5rem] text-xs md:text-sm font-black uppercase tracking-[0.1em] md:tracking-[0.2em] bg-primary text-primary-foreground hover:scale-[1.02] shadow-[0_15px_40px_rgba(255,0,0,0.2)] active:scale-95 transition-all duration-300 shine-effect"
            >
                <RefreshCw className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                NOVA ANÁLISE
            </Button>
            <p className="mt-2 md:mt-4 text-[0.4rem] md:text-[0.5rem] font-bold text-white/5 uppercase tracking-[0.2em] md:tracking-[0.3em]">IA Process Engine V.2026</p>
          </div>
      )}
    </div>
  );
}
