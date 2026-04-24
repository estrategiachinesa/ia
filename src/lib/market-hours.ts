
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

/**
 * Checks if a market is open for a given asset based on the current UTC time.
 * This function is safe for both server-side and client-side rendering as it avoids
 * environment-specific timezone functions.
 * @param asset The asset to check, e.g., 'EUR/USD'.
 * @returns boolean - true if the market is open, false otherwise.
 */
export function isMarketOpenForAsset(asset: Asset): boolean {
  // OTC markets are considered always open in this application's context.
  if (asset.includes('(OTC)')) {
    return true;
  }

  const schedule = marketSchedules[asset as keyof typeof marketSchedules];
  if (!schedule) {
    return false; // Default to closed if no schedule is defined for a non-OTC asset.
  }

  // Use current UTC time to ensure consistency between server and client.
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;

  // Convert UTC time to America/Sao_Paulo time (which is UTC-3).
  const saoPauloTimezoneOffset = -3;
  let saoPauloHour = utcHour + saoPauloTimezoneOffset;
  let saoPauloDay = utcDay;

  // Adjust day if the hour calculation wraps around.
  if (saoPauloHour < 0) {
    saoPauloHour += 24; // Go to the previous day in Sao Paulo.
    saoPauloDay = (saoPauloDay - 1 + 7) % 7; // (day - 1) mod 7, handling Sunday.
  } else if (saoPauloHour >= 24) {
    saoPauloHour -= 24; // Go to the next day in Sao Paulo (less common for UTC-3).
    saoPauloDay = (saoPauloDay + 1) % 7;
  }

  const daySchedule = schedule[saoPauloDay];
  if (!daySchedule || daySchedule.length === 0) {
    return false; // Market is closed on this day.
  }

  for (const range of daySchedule) {
    if (saoPauloHour >= range.start && saoPauloHour < range.end) {
      return true; // Current time is within an open range.
    }
  }

  return false; // Current time is not in any open range.
}
