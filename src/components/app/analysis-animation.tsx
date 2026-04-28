'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const analysisSteps = [
  '> INICIANDO CONEXÃO SEGURA...',
  '> ACESSANDO KERNEL DA CORRETORA... [OK]',
  '> INJETANDO SCRIPT DE ANÁLISE PREDITIVA...',
  '> ANALISANDO FLUXO DE ORDENS E LIQUIDEZ...',
  '> DESVIANDO DE VOLATILIDADE MANIPULADA... [ATIVO]',
  '> CALCULANDO PONTO DE ENTRADA ASSIMÉTRICO...',
  '> SINAL CONFIRMADO. PREPARANDO PARA EXIBIÇÃO...'
];

export function AnalysisAnimation() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    // Animate lines appearing
    analysisSteps.forEach((line, index) => {
      timeouts.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
      }, index * 700)); // A bit slower for dramatic effect
    });

    // Blinking cursor effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // A classic cursor blink rate

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(cursorInterval);
    };
  }, []);

  // Auto-scroll to the bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div
      ref={containerRef}
      className="font-code text-sm sm:text-base p-4 bg-black/80 rounded-lg h-[400px] w-full max-w-md overflow-y-auto border border-primary/20 text-left"
    >
      {visibleLines.map((line, i) => (
        <p
          key={i}
          className={cn(
            'whitespace-pre-wrap',
            line.includes('[OK]') || line.includes('[ATIVO]') ? 'text-green-400' : 'text-primary'
          )}
        >
          {line}
        </p>
      ))}
      {visibleLines.length < analysisSteps.length && showCursor && <div className="animate-pulse text-green-400">_</div>}
    </div>
  );
}
