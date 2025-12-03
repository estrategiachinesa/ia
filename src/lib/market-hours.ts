
'use client';

import { Asset } from '@/app/analisador/page';

// All times are in America/Sao_Paulo (UTC-3)
type TimeRange = { start: number; end: number }; // Hour as a number (e.g., 21.5 for 9:30 PM)
type Schedule = {
  [day: number]: TimeRange[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
};

const marketSchedules: Record<string, Schedule> = {
  'EUR/USD': {
    0: [{ start: 22, end: 24 }], // Sunday
    1: [{ start: 0, end: 18 }, { start: 22, end: 24 }], // Monday
    2: [{ start: 0, end: 18 }, { start: 22, end: 24 }], // Tuesday
    3: [{ start: 0, end: 18 }, { start: 22, end: 24 }], // Wednesday
    4: [{ start: 0, end: 18 }, { start: 22, end: 24 }], // Thursday
    5: [{ start: 0, end: 16.5 }], // Friday 00:00 - 16:30
    6: [], // Saturday
  },
  'EUR/JPY': {
    0: [{ start: 21, end: 24 }], // Sunday
    1: [{ start: 0, end: 18 }, { start: 21, end: 24 }], // Monday
    2: [{ start: 0, end: 18 }, { start: 21, end: 24 }], // Tuesday
    3: [{ start: 0, end: 18 }, { start: 21, end: 24 }], // Wednesday
    4: [{ start: 0, end: 18 }, { start: 21, end: 24 }], // Thursday
    5: [{ start: 0, end: 18 }], // Friday - This might need review based on broker
    6: [], // Saturday
  },
};

export function isMarketOpenForAsset(asset: Asset): boolean {
  // OTC markets are always open
  if (asset.includes('(OTC)')) {
    return true;
  }

  const schedule = marketSchedules[asset as keyof typeof marketSchedules];
  if (!schedule) {
    return false; // Default to closed if no schedule is defined for a non-OTC asset
  }

  let now: Date;
  try {
    // Attempt to use a specific timezone. This works in most modern environments.
    now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  } catch (error) {
    // Fallback for environments that don't support the timeZone option well.
    // This creates a less accurate UTC-3 offset but is better than crashing.
    console.warn('Timezone conversion failed, using UTC offset fallback.', error);
    now = new Date();
    const utcOffset = -3 * 60; // UTC-3 in minutes
    now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + utcOffset);
  }

  const currentDay = now.getDay();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const daySchedule = schedule[currentDay];
  if (!daySchedule || daySchedule.length === 0) {
    return false; // Market is closed on this day
  }

  for (const range of daySchedule) {
    if (currentHour >= range.start && currentHour < range.end) {
      return true; // Current time is within an open range
    }
  }

  return false; // Current time is not in any open range
}
