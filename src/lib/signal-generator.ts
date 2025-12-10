
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

// --- Seeded "Analysis" Functions ---

/**
 * Generates the base signal for a 5-minute interval.
 * This acts as the "main trend" for the 5-minute candle.
 */
function getM5Signal(asset: Asset, targetTime: Date): 'CALL 🔼' | 'PUT 🔽' {
    // We need a consistent time for the entire 5-minute block.
    // So, we find the beginning of the 5-minute interval.
    const intervalStart = new Date(targetTime);
    intervalStart.setMinutes(Math.floor(intervalStart.getMinutes() / 5) * 5, 0, 0);

    const timeSeed = intervalStart.getTime();
    const assetSeed = asset.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

    // A simple deterministic seed.
    const combinedSeed = timeSeed + assetSeed;
    
    // Use a sine function to create a predictable oscillating pattern.
    const analysisValue = Math.sin(combinedSeed / 100000); // Slower oscillation

    if (analysisValue > 0.1) {
        return 'CALL 🔼';
    } else if (analysisValue < -0.1) {
        return 'PUT 🔽';
    } else {
        // For values in the middle, decide based on even/odd hour.
        return intervalStart.getHours() % 2 === 0 ? 'CALL 🔼' : 'PUT 🔽';
    }
}


/**
 * Generates a 1-minute signal that is correlated with the 5-minute signal.
 */
function getM1Signal(asset: Asset, targetTime: Date): 'CALL 🔼' | 'PUT 🔽' {
    // First, determine the trend of the parent 5-minute candle.
    const m5Trend = getM5Signal(asset, targetTime);
    const minute = targetTime.getMinutes();
    
    // This creates a simple pattern within the 5-minute candle.
    // E.g., maybe the first and last minute follow the trend, but the middle ones might be corrections.
    const minuteWithinInterval = minute % 5;

    // This is a simple logic to simulate corrections within the main trend.
    // 0: First minute - follows trend
    // 1: Second minute - follows trend
    // 2: Third minute (middle) - counter-trend (correction)
    // 3: Fourth minute - follows trend
    // 4: Fifth minute - follows trend
    if (minuteWithinInterval === 2) { 
        // Simulate a "correction" in the middle of the 5-min candle
        return m5Trend === 'CALL 🔼' ? 'PUT 🔽' : 'CALL 🔼';
    }
    
    // For all other minutes, follow the main 5-minute trend.
    return m5Trend;
}


// --- Main Signal Generation Function ---
export function generateSignal(input: GenerateSignalInput): GenerateSignalOutput {
    const { 
        expirationTime, 
        invertSignal = false,
        asset,
    } = input;
    const now = new Date();
    let targetTime: Date;

    // 1. Calculate the next available target time.
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

    // 2. Generate a deterministic signal based on the timeframe.
    let signal = expirationTime === '1m'
      ? getM1Signal(asset, targetTime)
      : getM5Signal(asset, targetTime);

    // 3. Invert the signal if the global flag is set
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
