
'use client';

export type Asset = 
  | 'EUR/USD' | 'EUR/USD (OTC)'
  | 'EUR/JPY' | 'EUR/JPY (OTC)';

export type ExpirationTime = '1m' | '5m';

export type GenerateSignalInput = {
  asset: Asset;
  expirationTime: ExpirationTime;
  correlationChance: number; // Added correlationChance to the input
};

export type GenerateSignalOutput = {
  signal: 'CALL 🔼' | 'PUT 🔽';
  targetTime: string;
  source: 'Aleatório';
  targetDate: Date;
};

// Seeded pseudo-random number generator
function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// Client-side signal generation with market correlation
export function generateSignal(input: GenerateSignalInput): GenerateSignalOutput {
    const { asset, expirationTime, correlationChance } = input;

    // IMPORTANT: new Date() is now executed on the client.
    const now = new Date();
    
    // The seed is based on the current minute, making the signal consistent for all users within that same minute.
    const minuteSeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime();

    // --- Signal Generation Logic ---
    const marketTrendSeed = minuteSeed;
    const marketTrendRandom = seededRandom(marketTrendSeed);
    const generalMarketSignal = marketTrendRandom < 0.5 ? 'CALL 🔼' : 'PUT 🔽';

    const assetSpecificSeed = minuteSeed + asset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const assetRandom = seededRandom(assetSpecificSeed);
    const independentSignal = assetRandom < 0.5 ? 'CALL 🔼' : 'PUT 🔽';

    const correlationSeed = minuteSeed + 1;
    const correlationRandom = seededRandom(correlationSeed);
    
    let finalSignal: 'CALL 🔼' | 'PUT 🔽';

    if (correlationRandom < correlationChance) {
        finalSignal = generalMarketSignal;
    } else {
        finalSignal = independentSignal;
    }

    // --- Target Time Calculation ---
    let targetTime: Date;
    if (expirationTime === '1m') {
        const nextMinute = new Date(now);
        nextMinute.setSeconds(0, 0);
        nextMinute.setMinutes(nextMinute.getMinutes() + 1);
        targetTime = nextMinute;
    } else { // 5m
        const minutes = now.getMinutes();
        const remainder = minutes % 5;
        const minutesToAdd = 5 - remainder;
        targetTime = new Date(now.getTime());
        targetTime.setMinutes(minutes + minutesToAdd, 0, 0);
        if (targetTime.getTime() < now.getTime()) {
            targetTime.setMinutes(targetTime.getMinutes() + 5);
        }
    }

    const targetTimeString = targetTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

    return {
        signal: finalSignal,
        targetTime: targetTimeString,
        source: 'Aleatório' as const,
        targetDate: targetTime,
    };
}
