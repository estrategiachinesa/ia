
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LineChart } from 'lucide-react';

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
    }, 800); // Change text a bit faster

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center h-full w-full">
        <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-t-primary animate-spin"></div>
            <LineChart className="h-12 w-12 text-primary" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }} />
        </div>
      <p className="mt-8 text-lg font-semibold text-foreground">
        {analysisSteps[currentStep]}
      </p>
       <div className="w-full max-w-xs mt-4">
        <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary transition-all duration-700 ease-out" 
                style={{ width: `${(currentStep + 1) / analysisSteps.length * 100}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
}
