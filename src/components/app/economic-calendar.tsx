'use client';

import React from 'react';

type EconomicCalendarProps = {
  asset?: string;
};

/**
 * @fileOverview Widget de Calendário Económico da Investing.com.
 * Configurado para fuso horário UTC-3 (Brasília) e língua Portuguesa.
 * Filtra automaticamente os países com base no ativo selecionado.
 */
export function EconomicCalendar({ asset }: EconomicCalendarProps) {
  const isEurUsd = asset?.includes('EUR/USD');
  const isEurJpy = asset?.includes('EUR/JPY');
  const isOtc = asset?.includes('(OTC)');

  // IDs dos países na Investing.com:
  // USA: 5, Euro Zone: 72, Japan: 35, Brasil: 32
  // Default: Principais economias relacionadas ao app
  let countries = "5,72,35"; 
  
  if (isEurUsd && !isOtc) {
      countries = "5,72";
  } else if (isEurJpy && !isOtc) {
      countries = "72,35";
  }

  const displayTitle = asset && !isOtc 
    ? `Impacto Económico: ${asset.replace(' (OTC)', '')}` 
    : 'Calendário Económico Global';

  return (
    <div className="w-full bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                {displayTitle}
            </h3>
        </div>
        <span className="text-[0.6rem] text-muted-foreground uppercase font-bold tracking-tighter opacity-50">Powered by Investing.com</span>
      </div>
      <div className="w-full h-[500px] relative">
        <iframe 
          src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=2,3&features=datepicker,timezone&countries=${countries}&calType=day&timeZone=12&lang=12`} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          allowTransparency={true}
          className="filter invert hue-rotate-180 brightness-[0.8] contrast-[1.2]"
          style={{ backgroundColor: 'transparent' }}
        ></iframe>
      </div>
      <div className="px-6 py-3 bg-white/5 border-t border-white/5">
        <p className="text-[0.65rem] text-muted-foreground text-center font-semibold uppercase tracking-tight">
            Atenção: Evite operar 15 minutos antes e depois de notícias de 3 touros (Alta Volatilidade).
        </p>
      </div>
    </div>
  );
}
