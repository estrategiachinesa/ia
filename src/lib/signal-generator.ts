
'use client';

export type Asset = 
  | 'EUR/USD' | 'EUR/USD (OTC)'
  | 'EUR/JPY' | 'EUR/JPY (OTC)';

export type ExpirationTime = '1m' | '5m';

export type UserTier = 'VIP' | 'PREMIUM';

export type GenerateSignalInput = {
  asset: Asset;
  expirationTime: ExpirationTime;
  userTier?: UserTier;
  premiumMinWait?: number;
  premiumMaxWait?: number;
  vipMinWait?: number;
  vipMaxWait?: number;
  correlationChance?: number;
  invertSignal?: boolean;
};

export type GenerateSignalOutput = {
  signal: 'CALL 🔼' | 'PUT 🔽';
  targetTime: string;
  source: 'Aleatório';
  targetDate: Date;
};

// --- Seeded Pseudo-Random Number Generation ---
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// --- Main Signal Generation Function ---
export function generateSignal(input: GenerateSignalInput): GenerateSignalOutput {
    const { 
        expirationTime, 
        invertSignal = false,
    } = input;
    const now = new Date();
    let targetTime: Date;

    // 1. Calculate the next available target time, without random waits.
    if (expirationTime === '1m') {
        targetTime = new Date(now);
        targetTime.setSeconds(0, 0);
        targetTime.setMinutes(targetTime.getMinutes() + 1);
    } else { // 5m
        targetTime = new Date(now);
        const minutes = targetTime.getMinutes();
        const remainder = minutes % 5;
        const minutesToAdd = (remainder === 0) ? 5 : (5 - remainder);
        targetTime.setMinutes(minutes + minutesToAdd, 0, 0);
    }

    // 2. Generate a deterministic signal based on the target time.
    // The seed is derived from the target time, ensuring everyone gets the same signal for that specific minute.
    const timeSeed = targetTime.getTime();
    let signal: 'CALL 🔼' | 'PUT 🔽' = seededRandom(timeSeed) < 0.5 ? 'CALL 🔼' : 'PUT 🔽';

    // 3. Invert the signal if the flag is set
    if (invertSignal) {
        signal = signal === 'CALL 🔼' ? 'PUT 🔽' : 'CALL 🔼';
    }

    // 4. Format output.
    const targetTimeString = targetTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

    return {
        signal: signal,
        targetTime: targetTimeString,
        source: 'Aleatório' as const,
        targetDate: targetTime,
    };
}
