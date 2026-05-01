'use client';

import React from 'react';

type EconomicCalendarProps = {
  asset?: string;
};

/**
 * @fileOverview Widget de Calendário Económico da Investing.com.
 * Configurado para fuso horário UTC-3 (Brasília) e língua Portuguesa.
 * Refinado para melhor enquadramento e harmonia visual.
 */
export function EconomicCalendar({ asset }: EconomicCalendarProps) {
  const isEurUsd = asset?.includes('EUR/USD');
  const isEurJpy = asset?.includes('EUR/JPY');
  const isOtc = asset?.includes('(OTC)');

  // IDs dos países na Investing.com: USA: 5, Euro Zone: 72, Japan: 35
  let countries = "5,72,35"; 
  
  if (isEurUsd && !isOtc) countries = "5,72";
  else if (isEurJpy && !isOtc) countries = "72,35";

  const displayTitle = asset && !isOtc 
    ? `Impacto Económico: ${asset.replace(' (OTC)', '')}` 
    : 'Calendário Económico Global';

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">
      <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">
                {displayTitle}
            </h3>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[0.6rem] text-muted-foreground uppercase font-black opacity-30 tracking-widest hidden sm:block">Real-time Data Stream</span>
            <div className="h-4 w-px bg-border/20 hidden sm:block" />
            <span className="text-[0.6rem] text-primary/60 uppercase font-black tracking-tighter">Powered by Investing.com</span>
        </div>
      </div>
      <div className="w-full h-[550px] relative bg-[#0a0a0a]">
        <iframe 
          src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=2,3&features=datepicker,timezone&countries=${countries}&calType=day&timeZone=12&lang=12`} 
          width="100%" 
          height="100%" 
          frameBorder="0" 
          allowTransparency={true}
          className="filter invert hue-rotate-180 brightness-[0.75] contrast-[1.25] saturate-[0.8]"
          style={{ backgroundColor: 'transparent' }}
        ></iframe>
        {/* Overlay para suavizar as bordas do iframe */}
        <div className="absolute inset-0 pointer-events-none border-[12px] border-[#0a0a0a]/20" />
      </div>
      <div className="px-8 py-4 bg-white/5 border-t border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[0.65rem] text-primary/50 font-bold uppercase tracking-wide">
                Zona de Risco: +/- 15 min de notícias 3 touros
            </p>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    <span className="text-[0.6rem] text-muted-foreground font-bold uppercase">Média Volatilidade</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[0.6rem] text-muted-foreground font-bold uppercase">Alta Volatilidade</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}