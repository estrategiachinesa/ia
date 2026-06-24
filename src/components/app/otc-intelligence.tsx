'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Cpu, Activity, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppConfig } from '@/firebase/config-provider';

/**
 * @fileOverview Painel de métricas OTC com lógica determinística.
 * Os valores mudam conforme o ATIVO e o TEMPO, mas são iguais para todos os usuários.
 */
export function OtcIntelligence({ asset }: { asset: string }) {
  const { config } = useAppConfig();
  const [confidenceVal, setConfidenceVal] = useState(87.4);
  const [volatility, setVolatility] = useState('MÉDIA');
  const [isExcellentWindow, setIsExcellentTime] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      
      const timeStep = Math.floor(now.getTime() / 15000); 
      const assetSeed = asset.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const combinedSeed = timeStep + assetSeed;

      const deterministicRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const freq = config?.otcExcellentFrequency || 4;
      const cycleGap = Math.floor(60 / freq);
      const windowDuration = 3; 
      
      const assetOffset = assetSeed % cycleGap;
      const isExcellent = ((currentMinute + assetOffset) % cycleGap) < windowDuration;
      
      setIsExcellentTime(isExcellent);

      if (isExcellent) {
          const val = 90.1 + deterministicRandom(combinedSeed) * 2.4;
          setConfidenceVal(val);
          setVolatility('MÉDIA');
      } else {
          const conf = 85.0 + deterministicRandom(combinedSeed) * 5.0;
          setConfidenceVal(conf);

          const volLevels = ['BAIXA', 'MÉDIA', 'ALTA'];
          const volIdx = Math.floor(deterministicRandom(combinedSeed + 500) * 3);
          setVolatility(volLevels[volIdx]);
      }
    };

    const interval = setInterval(updateMetrics, 15000);
    updateMetrics();

    return () => clearInterval(interval);
  }, [config?.otcExcellentFrequency, asset]);

  const idealMoment = useMemo(() => {
    if (isExcellentWindow) {
      return { 
        label: 'EXCELENTE', 
        color: 'text-green-500', 
        bg: 'bg-green-500',
        glow: 'shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse'
      };
    }
    
    if (confidenceVal > 88) {
      return { 
        label: 'CAUTELA', 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-500',
        glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]'
      };
    }

    return { 
      label: 'EVITAR', 
      color: 'text-red-500', 
      bg: 'bg-red-500',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]'
    };
  }, [confidenceVal, isExcellentWindow]);

  return (
    <div className="w-full h-full flex flex-col bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[0.7rem] font-black text-muted-foreground uppercase tracking-[0.2em]">IA Metrics (OTC)</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40">
           <span className="text-[0.5rem] font-bold uppercase">Active Engine</span>
           <div className={cn("w-1 h-1 rounded-full", isExcellentWindow ? "bg-green-500" : "bg-primary")} />
        </div>
      </div>
      
      <div className="flex-grow p-4 md:p-6 flex flex-col justify-center gap-6 md:gap-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-primary/60" />
            <span className="text-[0.65rem] font-bold uppercase text-muted-foreground">Confiança IA</span>
          </div>
          <span className={cn(
              "text-lg font-mono font-black tracking-tighter transition-all duration-1000",
              isExcellentWindow ? "text-green-500" : "text-primary"
          )}>
            {confidenceVal.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-primary/60" />
            <span className="text-[0.65rem] font-bold uppercase text-muted-foreground">Volatilidade OTC</span>
          </div>
          <div className="flex items-center gap-2.5">
             <span className="text-[0.65rem] font-black text-white uppercase min-w-[42px] text-left transition-all duration-1000 tracking-tighter">
                {volatility}
             </span>
             <div className="flex items-center gap-1">
                <div className="w-1 h-3.5 bg-primary rounded-full" />
                <div className={cn("w-1 h-3.5 rounded-full transition-colors", (volatility === 'MÉDIA' || volatility === 'ALTA') ? "bg-primary" : "bg-primary/20")} />
                <div className={cn("w-1 h-3.5 rounded-full transition-colors", volatility === 'ALTA' ? "bg-primary" : "bg-primary/20")} />
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-primary/60" />
            <span className="text-[0.65rem] font-bold uppercase text-muted-foreground">Momento Ideal</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
             <span className={cn("text-[0.65rem] font-black uppercase tracking-tighter", idealMoment.color)}>
                {idealMoment.label}
             </span>
             <div className={cn("w-2 h-2 rounded-full", idealMoment.bg, idealMoment.glow)} />
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex justify-center items-center shrink-0">
         <span className="text-[0.5rem] font-black text-primary/40 uppercase tracking-[0.3em] animate-pulse">Sincronizado: {asset}</span>
      </div>
    </div>
  );
}