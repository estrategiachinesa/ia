
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

/**
 * Padrão solicitado na imagem:
 * Sábado: Fechado
 * Domingo: 21:00 - 23:59
 * Seg a Qui: 00:00 - 17:00; 21:00 - 23:59
 * Sexta: 00:00 - 15:30
 */
const defaultSchedule: Schedule = {
  0: [{ start: 21, end: 23.99 }], // Domingo
  1: [{ start: 0, end: 17 }, { start: 21, end: 23.99 }], // Segunda
  2: [{ start: 0, end: 17 }, { start: 21, end: 23.99 }], // Terça
  3: [{ start: 0, end: 17 }, { start: 21, end: 23.99 }], // Quarta
  4: [{ start: 0, end: 17 }, { start: 21, end: 23.99 }], // Quinta
  5: [{ start: 0, end: 15.5 }], // Sexta
  6: [], // Sábado
};

const marketSchedules: Record<string, Schedule> = {
  'EUR/USD': defaultSchedule,
  'EUR/JPY': defaultSchedule,
};

function getSaoPauloNow() {
    const now = new Date();
    // Convert to target timezone string then back to date to get local values
    const spString = now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
    const spDate = new Date(spString);
    
    const day = spDate.getDay();
    const hour = spDate.getHours() + spDate.getMinutes() / 60 + spDate.getSeconds() / 3600;
    
    return { day, hour, date: now, spDate };
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

    const { day: currentDay, hour: currentHour, spDate } = getSaoPauloNow();

    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        const daySlots = schedule[checkDay];
        
        if (!daySlots || daySlots.length === 0) continue;

        const sortedSlots = [...daySlots].sort((a, b) => a.start - b.start);

        for (const slot of sortedSlots) {
            // Se for hoje e o slot já começou ou passou, pula
            if (i === 0 && slot.start <= currentHour) continue;

            const targetSpDate = new Date(spDate);
            targetSpDate.setDate(spDate.getDate() + i);
            
            const hours = Math.floor(slot.start);
            const minutes = Math.round((slot.start - hours) * 60);
            targetSpDate.setHours(hours, minutes, 0, 0);

            // Convert SP target date back to local system time for the countdown
            // Calculating the delta in SP time and applying to now
            const diffMs = targetSpDate.getTime() - spDate.getTime();
            return new Date(Date.now() + diffMs);
        }
    }

    return null;
}
