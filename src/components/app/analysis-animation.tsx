'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Cpu, Zap, Activity, ShieldCheck, Search, Database } from 'lucide-react';

const analysisSteps = [
  'INICIALIZANDO ANÁLISE...',
  'FILTRANDO RUÍDO DO MERCADO...',
  'MAPEANDO FLUXO INSTITUCIONAL...',
  'IDENTIFICANDO CONFLUÊNCIAS...',
  'CALCULANDO ASSERTIVIDADE...',
  'SINCRONIZANDO SINAL...',
];

export function AnalysisAnimation({ showProgressBar = true }: { showProgressBar?: boolean }) {
  const [currentText, setCurrentText] = useState(analysisSteps[0]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let textIndex = 0;
    const interval = setInterval(() => {
      textIndex++;
      if (textIndex < analysisSteps.length) {
        setCurrentText(analysisSteps[textIndex]);
        setProgress((textIndex / (analysisSteps.length - 1)) * 100);
      } else {
        clearInterval(interval);
      }
    }, 850);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full max-w-2xl overflow-hidden rounded-3xl bg-black/40 backdrop-blur-xl border border-primary/20 flex flex-col items-center justify-center p-8 gap-8 transition-all duration-500 shadow-2xl shadow-primary/5 min-h-[350px]">
      
      {/* Background Elements */}
      <div className="absolute inset-0 grid-bg opacity-10 animate-pulse" />
      
      {/* Visual Core Analysis */}
      <div className="relative flex items-center justify-center scale-110 md:scale-125 mb-4">
        {/* Rotating Outer technical ring */}
        <div className="absolute h-44 w-44 rounded-full border border-dashed border-primary/30 animate-[spin_12s_linear_infinite]" />
        
        {/* Pulse expansion effect */}
        <div className="absolute h-32 w-32 rounded-full border-2 border-primary/10 animate-ping opacity-20" />
        
        {/* Fast rotating mid-ring */}
        <div className="absolute h-36 w-36 rounded-full border-t-2 border-b-2 border-primary/20 animate-spin" />

        {/* Scanning Sweep Effect */}
        <div className="absolute h-56 w-56 rounded-full bg-gradient-to-t from-transparent via-primary/5 to-transparent animate-[spin_2.5s_linear_infinite]" />

        {/* Central AI Processor Icon */}
        <div className="relative z-10 bg-black/80 p-6 rounded-full border border-primary/40 shadow-[0_0_40px_rgba(255,0,0,0.25)] flex items-center justify-center group overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            <Cpu className="h-10 w-10 text-primary relative z-10 animate-pulse" />
            <Zap className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-bounce fill-primary/20" />
        </div>
        
        {/* Satellite Data Nodes */}
        <div className="absolute h-full w-full animate-[spin_15s_linear_infinite]">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary/40" />
        </div>
      </div>

      {/* Dynamic Analysis Text */}
      <div className="w-full space-y-6 z-10 text-center">
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                <Search className="h-3.5 w-3.5 text-primary/60 animate-bounce" />
                <span className="text-[0.65rem] md:text-[0.7rem] font-black text-primary uppercase tracking-[0.3em] font-mono">
                    {currentText}
                </span>
            </div>
            
            <div className="flex items-center gap-6 opacity-40">
                <div className="flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-primary" />
                    <span className="text-[0.55rem] font-bold uppercase tracking-tighter">Fluxo: Ativo</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    <span className="text-[0.55rem] font-bold uppercase tracking-tighter">Sync: Seguro</span>
                </div>
            </div>
        </div>

        {showProgressBar && (
          <div className="w-full max-w-sm mx-auto space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex justify-between items-end px-1">
                <div className="flex flex-col items-start">
                  <span className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none">Processamento Deep-Scan</span>
                  <span className="text-[0.6rem] font-bold text-white/60 uppercase">Motor V.2026</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-lg font-mono font-black text-primary leading-none">{Math.round(progress)}%</span>
                </div>
            </div>
            
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                    className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,0,0,0.4)] relative"
                    style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-[-20deg]" />
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Interface Corner Ornaments (HUD Style) */}
      <div className="absolute top-5 left-5 h-6 w-6 border-t-[3px] border-l-[3px] border-primary/40 rounded-tl-lg" />
      <div className="absolute top-5 right-5 h-6 w-6 border-t-[3px] border-r-[3px] border-primary/40 rounded-tr-lg" />
      <div className="absolute bottom-5 left-5 h-6 w-6 border-b-[3px] border-l-[3px] border-primary/40 rounded-bl-lg" />
      <div className="absolute bottom-5 right-5 h-6 w-6 border-b-[3px] border-r-[3px] border-primary/40 rounded-br-lg" />
      
      {/* Decorative vertical lines */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 w-0.5 h-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-1/2 right-4 -translate-y-1/2 w-0.5 h-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
      
    </div>
  );
}