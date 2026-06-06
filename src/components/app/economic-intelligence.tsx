'use client';

import React, { useMemo } from 'react';
import { Zap, Clock, ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateMockNewsEvents } from '@/lib/news-events';

// Bandeiras em SVG para EUR, USD e JPY
const CurrencyFlag = ({ currency }: { currency: string }) => {
  switch (currency) {
    case 'EUR':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" className="rounded-full shadow-sm">
          <circle cx="16" cy="16" r="16" fill="#003399"/>
          <g transform="translate(16,16) scale(0.6)">
            <g fill="#FFCC00">
              <path id="s" d="M0-12l1 4h-2z" transform="rotate(0) translate(0,-12)"/>
              <use href="#s" transform="rotate(30)"/>
              <use href="#s" transform="rotate(60)"/>
              <use href="#s" transform="rotate(90)"/>
              <use href="#s" transform="rotate(120)"/>
              <use href="#s" transform="rotate(150)"/>
              <use href="#s" transform="rotate(180)"/>
              <use href="#s" transform="rotate(210)"/>
              <use href="#s" transform="rotate(240)"/>
              <use href="#s" transform="rotate(270)"/>
              <use href="#s" transform="rotate(300)"/>
              <use href="#s" transform="rotate(330)"/>
            </g>
          </g>
        </svg>
      );
    case 'USD':
      return (
        <svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="rounded-full shadow-sm">
          <clipPath id="cp-usa"><circle cx="16" cy="16" r="16" /></clipPath>
          <g clipPath="url(#cp-usa)">
            <rect width="32" height="32" fill="#B22234" />
            <path d="M0,4H32 M0,10H32 M0,16H32 M0,22H32 M0,28H32" stroke="#FFFFFF" strokeWidth="3" />
            <rect width="18" height="18" fill="#3C3B6E" />
            <circle cx="5" cy="5" r="1.5" fill="#fff" /><circle cx="13" cy="5" r="1.5" fill="#fff" />
            <circle cx="9" cy="9" r="1.5" fill="#fff" /><circle cx="5" cy="13" r="1.5" fill="#fff" />
            <circle cx="13" cy="13" r="1.5" fill="#fff" />
          </g>
        </svg>
      );
    case 'JPY':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" className="rounded-full shadow-sm">
          <rect width="32" height="32" fill="#fff" rx="16"/>
          <circle cx="16" cy="16" r="8" fill="#bc002d"/>
        </svg>
      );
    default:
      return null;
  }
};

// Ícone de Estrela Customizado
const StarRating = ({ count }: { count: 1 | 2 | 3 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3].map((i) => (
      <Star 
        key={i} 
        className={cn(
          "w-2.5 h-2.5 transition-colors", 
          i <= count ? "text-primary fill-primary shadow-primary/20 shadow-sm" : "text-white/5"
        )} 
      />
    ))}
  </div>
);

export function EconomicIntelligence({ asset }: { asset: string }) {
  const allEvents = useMemo(() => generateMockNewsEvents(), []);

  // Filtra as notícias com base nas moedas do par selecionado
  const filteredEvents = useMemo(() => {
    // Remove o sufixo (OTC) e divide pelo separador /
    const currencies = asset.replace(' (OTC)', '').split('/');
    return allEvents.filter(event => currencies.includes(event.currency));
  }, [allEvents, asset]);

  return (
    <div className="w-full h-[170px] md:h-[220px] flex flex-col bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[0.7rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Impacto Econômico</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40">
           <span className="text-[0.5rem] font-bold uppercase">Live Data</span>
           <div className="w-1 h-1 rounded-full bg-primary" />
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
        {filteredEvents.length > 0 ? filteredEvents.map((event, idx) => (
          <a 
            key={idx} 
            href="https://br.investing.com/economic-calendar/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 md:p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:bg-primary hover:border-transparent transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Clock className="h-3 h-3 md:h-3.5 md:w-3.5 opacity-30 group-hover:text-black group-hover:opacity-100" />
                <span className="text-sm md:text-sm font-mono font-black tracking-tighter text-white group-hover:text-black">{event.time}</span>
              </div>
              <div className="h-4 w-px bg-white/10 group-hover:bg-black/20" />
              <div className="flex items-center gap-1.5 md:gap-2">
                <CurrencyFlag currency={event.currency} />
                <span className="text-[0.7rem] md:text-[0.7rem] font-black text-primary uppercase group-hover:text-black">{event.currency}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <StarRating count={event.impact} />
            </div>
          </a>
        )) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <Clock className="h-6 w-6 mb-1" />
            <p className="text-[0.6rem] md:text-[0.6rem] font-bold uppercase tracking-widest text-center px-4">Sem notícias relevantes</p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-1.5 bg-black/60 border-t border-white/5 flex justify-center items-center">
         <span className="text-[0.5rem] md:text-[0.5rem] font-black text-primary/40 uppercase tracking-[0.3em] animate-pulse">Sincronizado com Investing.com</span>
      </div>
    </div>
  );
}
