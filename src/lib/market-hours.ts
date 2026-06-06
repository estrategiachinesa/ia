'use client';

import { Asset } from '@/app/analisador/page';

// Todos os horários estão em America/Sao_Paulo (UTC-3)
// Sincronizado com IQ Option / Exnova: Domingo 19:00 - Sexta 18:00
type TimeRange = { start: number; end: number }; 
type Schedule = {
  [day: number]: TimeRange[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
};

const marketSchedules: Record<string, Schedule> = {
  'EUR/USD': {
    0: [{ start: 19, end: 24 }], // Abre Domingo às 19:00
    1: [{ start: 0, end: 18 }, { start: 19, end: 24 }], // Manutenção diária 18:00-19:00
    2: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    3: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    4: [{ start: 0, end: 18 }, { start: 19, end: 24 }],
    5: [{ start: 0, end: 18 }], // Fecha Sexta às 18:00
    6: [], // Sábado Fechado
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

/**
 * Verifica se o mercado está aberto para um ativo baseado no horário de Brasília (UTC-3).
 */
export function isMarketOpenForAsset(asset: Asset): boolean {
  if (asset.includes('(OTC)')) {
    return true;
  }

  const schedule = marketSchedules[asset as keyof typeof marketSchedules];
  if (!schedule) return false;

  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;

  // Conversão para Brasília (UTC-3)
  const saoPauloTimezoneOffset = -3;
  let saoPauloHour = utcHour + saoPauloTimezoneOffset;
  let saoPauloDay = utcDay;

  if (saoPauloHour < 0) {
    saoPauloHour += 24;
    saoPauloDay = (saoPauloDay - 1 + 7) % 7;
  } else if (saoPauloHour >= 24) {
    saoPauloHour -= 24;
    saoPauloDay = (saoPauloDay + 1) % 7;
  }

  const daySchedule = schedule[saoPauloDay];
  if (!daySchedule || daySchedule.length === 0) return false;

  return daySchedule.some(range => saoPauloHour >= range.start && saoPauloHour < range.end);
}
