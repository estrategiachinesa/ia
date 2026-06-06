'use client';

import { Asset } from '@/app/analisador/page';

// Todos os horários estão em America/Sao_Paulo (UTC-3)
// Sincronizado com IQ Option: Domingo 19:00 - Sexta 18:00
// Pausa diária: 18:00 - 19:00
type TimeRange = { start: number; end: number }; 
type Schedule = {
  [day: number]: TimeRange[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
};

const marketSchedules: Record<string, Schedule> = {
  'EUR/USD': {
    0: [{ start: 19, end: 24 }], 
    1: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    2: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    3: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    4: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    5: [{ start: 0, end: 18 }], 
    6: [],
  },
  'EUR/JPY': {
    0: [{ start: 19, end: 24 }],
    1: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    2: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    3: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    4: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    5: [{ start: 0, end: 18 }],
    6: [],
  },
};

function getSaoPauloNow() {
    const now = new Date();
    const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    const saoPauloTimezoneOffset = -3;
    
    let saoPauloHour = utcHour + saoPauloTimezoneOffset;
    let saoPauloDay = now.getUTCDay();

    if (saoPauloHour < 0) {
        saoPauloHour += 24;
        saoPauloDay = (saoPauloDay - 1 + 7) % 7;
    } else if (saoPauloHour >= 24) {
        saoPauloHour -= 24;
        saoPauloDay = (saoPauloDay + 1) % 7;
    }
    
    return { day: saoPauloDay, hour: saoPauloHour, date: now };
}

export function isMarketOpenForAsset(asset: Asset): boolean {
  if (asset.includes('(OTC)')) return true;
  const schedule = marketSchedules[asset as keyof typeof marketSchedules];
  if (!schedule) return false;

  const { day, hour } = getSaoPauloNow();
  const daySchedule = schedule[day];
  if (!daySchedule) return false;

  return daySchedule.some(range => hour >= range.start && hour < range.end);
}

export function getNextOpeningTime(asset: Asset): Date | null {
    if (asset.includes('(OTC)')) return null;
    const schedule = marketSchedules[asset as keyof typeof marketSchedules];
    if (!schedule) return null;

    const { day: currentDay, hour: currentHour, date: nowDate } = getSaoPauloNow();

    // Procuramos o próximo slot de abertura nos próximos 7 dias
    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const daySlots = schedule[checkDay];
        
        if (!daySlots || daySlots.length === 0) continue;

        // Ordenar slots por horário de início
        const sortedSlots = [...daySlots].sort((a, b) => a.start - b.start);

        for (const slot of sortedSlots) {
            // Se for o dia atual, só interessa se o slot começar depois da hora atual
            if (i === 0 && slot.start <= currentHour) continue;

            // Criar data de abertura
            const openDate = new Date(nowDate);
            openDate.setDate(nowDate.getDate() + i);
            
            const hours = Math.floor(slot.start);
            const minutes = Math.round((slot.start - hours) * 60);
            
            openDate.setHours(hours + 3, minutes, 0, 0); // +3 para voltar de SP para UTC para o objeto Date
            
            // Ajuste fino para garantir que o horário de Brasília seja respeitado no objeto Date
            const brDate = new Date(nowDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
            const targetBrDate = new Date(brDate);
            targetBrDate.setDate(brDate.getDate() + i);
            targetBrDate.setHours(hours, minutes, 0, 0);

            // Converter a diferença de volta para o timestamp local
            const diff = targetBrDate.getTime() - brDate.getTime();
            return new Date(nowDate.getTime() + diff);
        }
    }

    return null;
}
