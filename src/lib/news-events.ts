'use client';

export type NewsEvent = {
  time: string;
  currency: string;
  impact: 1 | 2 | 3;
  date: Date;
};

/**
 * Generates deterministic mock news events for the current day.
 * Filtering only EUR, USD, JPY.
 */
export function generateMockNewsEvents(): NewsEvent[] {
  const now = new Date();
  const currentDayStr = now.toDateString();
  const currencies = ['EUR', 'USD', 'JPY'];
  const mockEvents: NewsEvent[] = [];
  
  // Use day string as seed for consistency throughout the day
  const seed = currentDayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate 8 events throughout the day
  for (let i = 0; i < 8; i++) {
    const eventTime = new Date(now);
    // Random hour between 0 and 23, but deterministic for the day
    const hour = (seed + (i * 7)) % 24;
    // Minutes rounded to 00, 15, 30, 45
    const mins = ((seed * (i + 1)) % 4) * 15;
    
    eventTime.setHours(hour, mins, 0, 0);

    mockEvents.push({
      time: eventTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      currency: currencies[(seed + i) % currencies.length],
      impact: ((seed + i) % 3 + 1) as 1 | 2 | 3,
      date: eventTime
    });
  }

  return mockEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Checks if there is a news event currently active.
 * A news event is active if now is between event start and start + durationMinutes.
 */
export function isNewsCurrentlyActive(events: NewsEvent[], durationMinutes: number): boolean {
  const now = new Date();
  return events.some(event => {
    const startTime = event.date.getTime();
    const endTime = startTime + (durationMinutes * 60 * 1000);
    return now.getTime() >= startTime && now.getTime() < endTime;
  });
}
