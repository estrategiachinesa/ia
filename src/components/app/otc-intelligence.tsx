'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Activity, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OtcIntelligence() {
  const [confidence, setConfidence] = useState('87.4%');
  const [volatility, setVolatility] = useState('MÉDIA');

  useEffect(() => {
    const updateMetrics = () => {
      // Confiança: 85.0% a 92.5% com uma casa decimal
      const conf = (85 + Math.random() * 7.5).toFixed(1);
      setConfidence(`${conf}%`);

      // Volatilidade: Alterna entre os 3 estados
      const volLevels = ['BAIXA', 'MÉDIA', 'ALTA'];
      setVolatility(volLevels[Math.floor(Math.random() * volLevels.length)]);
    };

    // Atualiza a cada 8 segundos para parecer uma leitura real de mercado
    const interval = setInterval(updateMetrics, 8000);
    updateMetrics(); // Gera os primeiros valores imediatamente

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[220px] flex flex-col bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em]">IA Metrics (OTC)</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40">
           <span className="text-[0.5rem] font-bold uppercase">Active Engine</span>
           <div className="w-1 h-1 rounded-full bg-green-500" />
        </div>
      </div>
      
      <div className="flex-grow p-4 flex flex-col justify-center gap-10">
        {/* CONFIANÇA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-primary/60" />
            <span className="text-[0.6rem] font-bold uppercase text-muted-foreground">Confiança IA</span>
          </div>
          <span className="text-sm font-mono font-black text-primary tracking-tighter transition-all duration-1000">{confidence}</span>
        </div>

        {/* VOLATILIDADE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-primary/60" />
            <span className="text-[0.6rem] font-bold uppercase text-muted-foreground">Volatilidade OTC</span>
          </div>
          <div className="flex items-center gap-2.5">
             <span className="text-[0.6rem] font-black text-white uppercase min-w-[42px] text-right transition-all duration-1000 tracking-tighter">
                {volatility}
             </span>
             <div className="flex items-center gap-1">
                <div className="w-1 h-3.5 bg-primary rounded-full shadow-[0_0_5px_rgba(251,191,36,0.3)]" />
                <div className={cn("w-1 h-3.5 rounded-full transition-colors duration-500", volatility !== 'BAIXA' ? "bg-primary shadow-[0_0_5px_rgba(251,191,36,0.3)]" : "bg-primary/20")} />
                <div className={cn("w-1 h-3.5 rounded-full transition-colors duration-500", volatility === 'ALTA' ? "bg-primary shadow-[0_0_5px_rgba(251,191,36,0.3)]" : "bg-primary/20")} />
             </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex justify-center items-center">
         <span className="text-[0.5rem] font-black text-primary/40 uppercase tracking-[0.3em] animate-pulse">Algoritmo V.2026 Otimizado</span>
      </div>
    </div>
  );
}
