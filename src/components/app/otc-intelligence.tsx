'use client';

import React from 'react';
import { Cpu, Activity, Target, ShieldCheck } from 'lucide-react';

export function OtcIntelligence() {
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
      
      <div className="flex-grow p-4 flex flex-col justify-around">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-primary/60" />
            <span className="text-[0.6rem] font-bold uppercase text-muted-foreground">Confiança IA</span>
          </div>
          <span className="text-sm font-mono font-black text-primary tracking-tighter">94.8%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-primary/60" />
            <span className="text-[0.6rem] font-bold uppercase text-muted-foreground">Volatilidade OTC</span>
          </div>
          <div className="flex items-center gap-1">
             <div className="w-1 h-3 bg-primary rounded-full" />
             <div className="w-1 h-3 bg-primary rounded-full" />
             <div className="w-1 h-3 bg-primary/20 rounded-full" />
             <span className="text-[0.55rem] font-black ml-1">MÉDIA</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-primary/60" />
            <span className="text-[0.6rem] font-bold uppercase text-muted-foreground">Status do Filtro</span>
          </div>
          <span className="text-[0.6rem] font-black text-green-500 uppercase px-2 py-0.5 bg-green-500/10 rounded">Protegido</span>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex justify-center items-center">
         <span className="text-[0.5rem] font-black text-primary/40 uppercase tracking-[0.3em] animate-pulse">Algoritmo V.2026 Otimizado</span>
      </div>
    </div>
  );
}