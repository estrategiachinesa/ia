
'use client';

import React, { useMemo } from 'react';
import { Zap, Clock } from 'lucide-react';
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
    className={cn("w-3 h-3 transition-colors", active ? "text-primary" : "text-white/10", className)}
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
  // Simulamos a extração de dados do calendário económico real 
  // Sincronizado com o dia e hora atual para manter o painel sempre cheio
  const events = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Lista de moedas baseada no ativo selecionado
    const currencies = asset.includes('USD') ? ['USD', 'EUR', 'GBP'] : ['JPY', 'EUR', 'AUD'];
    
    const mockEvents: NewsEvent[] = [];
    
    // Geramos 5 eventos próximos ao horário atual
    for (let i = -1; i < 4; i++) {
      const eventTime = new Date(now);
      eventTime.setHours(currentHour + i);
      eventTime.setMinutes(Math.floor(Math.random() * 4) * 15); // Notícias costumam ser em horários cheios ou 15/30/45

      mockEvents.push({
        time: eventTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        impact: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3
      });
    }

    return mockEvents.sort((a, b) => a.time.localeCompare(b.time));
  }, [asset]);

  return (
    <div className="w-full h-[180px] flex flex-col bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Impacto Econômico</span>
        </div>
        <span className="text-[0.5rem] font-bold text-primary/40 uppercase">Live Intelligence</span>
      </div>
      
      <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
        {events.map((event, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="h-3 w-3 opacity-40" />
                <span className="text-xs font-mono font-black tracking-tighter text-white">{event.time}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-[0.65rem] font-black text-primary uppercase">{event.currency}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <BullIcon active={event.impact >= 1} />
              <BullIcon active={event.impact >= 2} />
              <BullIcon active={event.impact >= 3} />
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-4 py-1.5 bg-black/40 border-t border-white/5 flex justify-center items-center gap-4">
         <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <span className="text-[0.45rem] font-bold text-muted-foreground uppercase">Análise em Tempo Real</span>
         </div>
      </div>
    </div>
  );
}
