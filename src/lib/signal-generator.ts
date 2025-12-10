
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

// --- Seeded "Analysis" Function ---
function pseudoAnalysis(asset: Asset, targetTime: Date): 'CALL 🔼' | 'PUT 🔽' {
    const timeSeed = targetTime.getTime();
    const minute = targetTime.getMinutes();
    const second = targetTime.getSeconds(); // Though usually 0
    const assetChars = asset.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

    // Combine factors to create a more complex seed. This simulates different analysis inputs.
    // It's still deterministic: same inputs will always produce the same output.
    const combinedSeed = timeSeed * 0.4 + assetChars * 0.3 + (minute * 1000) * 0.2 + (second * 100) * 0.1;

    // Use a simple sine function to create a pseudo-oscillating pattern, like an RSI or MACD.
    const analysisValue = Math.sin(combinedSeed);

    // Add another layer based on even/odd minutes to simulate market phases.
    if (minute % 2 === 0) {
        // Even minutes might favor CALL on positive sine, PUT on negative
        return analysisValue > 0 ? 'CALL 🔼' : 'PUT 🔽';
    } else {
        // Odd minutes might have an inverted logic or different threshold
        return analysisValue > -0.1 ? 'PUT 🔽' : 'CALL 🔼';
    }
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

    // 2. Generate a deterministic signal based on the pseudo-analysis of the target time and asset.
    let signal = pseudoAnalysis(asset, targetTime);

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
        source: 'Aleatório' as const, // Keeping source as is, for now.
        targetDate: targetTime,
    };
}
