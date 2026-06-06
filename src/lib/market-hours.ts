'use client';

import { Asset } from '@/app/analisador/page';

/**
 * Horários sincronizados com a imagem fornecida (IQ Option).
 * Todos os horários estão em America/Sao_Paulo (UTC-3).
 */
export type TimeRange = { start: number; end: number }; 
export type Schedule = {
  [day: number]: TimeRange[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
};

// Padrão solicitado na imagem
const defaultSchedule: Schedule = {
  0: [{ start: 21, end: 24 }], // Domingo abre às 21h
  1: [{ start: 0, end: 17 }, { start: 21, end: 24 }], // Seg a Qui: Pausa das 17h às 21h
  2: [{ start: 0, end: 17 }, { start: 21, end: 24 }],
  3: [{ start: 0, end: 17 }, { start: 21, end: 24 }],
  4: [{ start: 0, end: 17 }, { start: 21, end: 24 }],
  5: [{ start: 0, end: 15.5 }], // Sexta fecha às 15:30
  6: [], // Sábado fechado
};

const marketSchedules: Record<string, Schedule> = {
  'EUR/USD': defaultSchedule,
  'EUR/JPY': defaultSchedule,
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

export function isMarketOpenForAsset(asset: Asset, customSchedules?: Record<string, Schedule>): boolean {
  if (asset.includes('(OTC)')) return true;
  
  const baseAsset = asset.replace(' (OTC)', '');
  const schedule = (customSchedules && customSchedules[baseAsset]) || marketSchedules[baseAsset];
  if (!schedule) return false;

  const { day, hour } = getSaoPauloNow();
  const daySchedule = schedule[day];
  if (!daySchedule) return false;

  return daySchedule.some(range => hour >= range.start && hour < range.end);
}

export function getNextOpeningTime(asset: Asset, customSchedules?: Record<string, Schedule>): Date | null {
    if (asset.includes('(OTC)')) return null;
    
    const baseAsset = asset.replace(' (OTC)', '');
    const schedule = (customSchedules && customSchedules[baseAsset]) || marketSchedules[baseAsset];
    if (!schedule) return null;

    const { day: currentDay, hour: currentHour, date: nowDate } = getSaoPauloNow();

    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const daySlots = schedule[checkDay];
        
        if (!daySlots || daySlots.length === 0) continue;

        const sortedSlots = [...daySlots].sort((a, b) => a.start - b.start);

        for (const slot of sortedSlots) {
            if (i === 0 && slot.start <= currentHour) continue;

            const openDate = new Date(nowDate);
            openDate.setDate(nowDate.getDate() + i);
            
            const hours = Math.floor(slot.start);
            const minutes = Math.round((slot.start - hours) * 60);
            
            const brDate = new Date(nowDate.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
            const targetBrDate = new Date(brDate);
            targetBrDate.setDate(brDate.getDate() + i);
            targetBrDate.setHours(hours, minutes, 0, 0);

            const diff = targetBrDate.getTime() - brDate.getTime();
            return new Date(nowDate.getTime() + diff);
        }
    }

    return null;
}