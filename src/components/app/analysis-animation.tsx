
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const analysisSteps = [
  'Conectando aos servidores...',
  'Analisando gráficos em tempo real...',
  'Identificando padrões de mercado...',
  'Calculando probabilidade de confluência...',
  'Buscando os melhores pontos de entrada...',
  'Finalizando análise...'
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
    }, 1200); // Change text every 1.2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center h-full w-full">
        <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-t-primary animate-spin-slow"></div>
            <div className="absolute inset-[25%] rounded-full bg-primary/10 animate-pulse"></div>
        </div>
      <p className="mt-8 text-lg font-semibold text-foreground">
        {analysisSteps[currentStep]}
      </p>
    </div>
  );
}

    