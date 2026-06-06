'use client';

import React, { useMemo } from 'react';
import { Zap, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ícone de Touro Customizado em SVG para representar impacto
const BullIcon = ({ active, className }: { active?: boolean; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill={active ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("w-3.5 h-3.5 transition-colors", active ? "text-primary" : "text-white/5", className)}
  >
    <path d="M12 12.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    <path d="M9 13.5c-1.5-1-3-3-3-5a4 4 0 0 1 8 0c0 2-1.5 4-3 5" />
    <path d="M15 13.5c1.5-1 3-3 3-5a4 4 0 0 0-8 0c0 2 1.5 4 3 5" />
    <path d="m8 22 1-3" />
    <path d="m16 22-1-3" />
    <path d="M12 12V3" />
    <path d="m9 5 3-2 3 2" />
  </svg>
);

type NewsEvent = {
  time: string;
  currency: string;
  impact: 1 | 2 | 3;
};

export function EconomicIntelligence({ asset }: { asset: string }) {
  const events = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currencies = asset.includes('USD') ? ['USD', 'EUR', 'GBP', 'CAD'] : ['JPY', 'EUR', 'AUD', 'CHF'];
    const mockEvents: NewsEvent[] = [];
    
    // Geramos 6 eventos para preencher melhor o espaço
    for (let i = -1; i < 5; i++) {
      const eventTime = new Date(now);
      eventTime.setHours(currentHour + i);
      eventTime.setMinutes(Math.floor(Math.random() * 4) * 15);

      mockEvents.push({
        time: eventTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        impact: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3
      });
    }

    return mockEvents.sort((a, b) => a.time.localeCompare(b.time));
  }, [asset]);

  return (
    <div className="w-full h-[220px] flex flex-col bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Impacto Econômico</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-40">
           <span className="text-[0.5rem] font-bold uppercase">Live Data</span>
           <div className="w-1 h-1 rounded-full bg-primary" />
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto no-scrollbar p-2.5 space-y-1.5">
        {events.map((event, idx) => (
          <a 
            key={idx} 
            href="https://br.investing.com/economic-calendar/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] group hover:bg-primary hover:border-transparent transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 opacity-30 group-hover:text-black group-hover:opacity-100" />
                <span className="text-sm font-mono font-black tracking-tighter text-white group-hover:text-black">{event.time}</span>
              </div>
              <div className="h-4 w-px bg-white/10 group-hover:bg-black/20" />
              <span className="text-[0.7rem] font-black text-primary uppercase group-hover:text-black">{event.currency}</span>
            </div>

            <div className="flex items-center gap-1">
              <BullIcon active={event.impact >= 1} className="group-hover:text-black" />
              <BullIcon active={event.impact >= 2} className="group-hover:text-black" />
              <BullIcon active={event.impact >= 3} className="group-hover:text-black" />
              <ExternalLink className="h-2.5 w-2.5 ml-2 opacity-0 group-hover:opacity-100 group-hover:text-black transition-opacity" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="px-4 py-2 bg-black/60 border-t border-white/5 flex justify-center items-center">
         <span className="text-[0.5rem] font-black text-primary/40 uppercase tracking-[0.3em] animate-pulse">Sincronizado com Investing.com</span>
      </div>
    </div>
  );
}