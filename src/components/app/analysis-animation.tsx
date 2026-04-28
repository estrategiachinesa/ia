
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Cpu } from 'lucide-react';

const analysisSteps = [
  'Conectando aos servidores quânticos...',
  'Analisando volatilidade do mercado...',
  'Aplicando modelos de predição neural...',
  'Calculando probabilidade de confluência...',
  'Verificando zonas de liquidez assimétrica...',
  'Finalizando análise de sinal...'
];

export function AnalysisAnimation() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep < analysisSteps.length - 1) {
          return prevStep + 1;
        }
        clearInterval(interval);
        return prevStep;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center h-full w-full">
        <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-[spin_4s_linear_infinite_reverse]"></div>
            {/* Middle ring */}
            <div className="absolute inset-6 rounded-full border-dashed border-2 border-primary/30 animate-spin-slow"></div>
            {/* Inner ring (faster spin) */}
            <div className="absolute inset-12 rounded-full border-t-2 border-primary animate-spin"></div>
            {/* Icon */}
            <Cpu className="h-12 w-12 text-primary" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary)))' }} />
        </div>
      <p className="mt-8 text-lg font-semibold text-foreground tracking-wider">
        {analysisSteps[currentStep]}
      </p>
       <div className="w-full max-w-xs mt-4">
        <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary transition-all duration-700 ease-out" 
                style={{ width: `${((currentStep + 1) / analysisSteps.length) * 100}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
}
