
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
        return prevStep;
      });
    }, 1500); // Change text every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center h-full w-full">
        <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary/50 animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse"></div>
            </div>
        </div>
      <p className="mt-6 text-lg font-semibold text-foreground animate-pulse">
        {analysisSteps[currentStep]}
      </p>
    </div>
  );
}
