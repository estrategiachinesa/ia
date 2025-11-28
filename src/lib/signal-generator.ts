
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


// --- 5-Minute Market Simulation Logic ---

/**
 * Determines the overall signal ('CALL' or 'PUT') for a 5-minute block.
 * This is the "master prediction" for that block.
 * @param seed - A seed based on the start time of the 5-minute block.
 */
function getFiveMinuteMasterSignal(seed: number): 'CALL 🔼' | 'PUT 🔽' {
    return seededRandom(seed) < 0.5 ? 'CALL 🔼' : 'PUT 🔽';
}

/**
 * Generates the sequence of 5 individual 1-minute signals within a 5-minute block
 * that collectively result in the master signal.
 * @param masterSignal - The target outcome for the 5-minute period.
 * @param seed - A seed based on the start time of the 5-minute block.
 */
function getOneMinuteSignalSequence(masterSignal: 'CALL 🔼' | 'PUT 🔽', seed: number): ('CALL 🔼' | 'PUT 🔽')[] {
    const sequence: ('CALL 🔼' | 'PUT 🔽')[] = [];
    const callSignal: 'CALL 🔼' = 'CALL 🔼';
    const putSignal: 'PUT 🔽' = 'PUT 🔽';

    // To ensure the master signal is met, we need more CALLs for an overall CALL, and vice-versa.
    const majoritySignal = masterSignal;
    const minoritySignal = masterSignal === callSignal ? putSignal : callSignal;

    // The sequence will have 3 majority signals and 2 minority signals.
    sequence.push(majoritySignal, majoritySignal, majoritySignal, minoritySignal, minoritySignal);

    // Shuffle the sequence pseudo-randomly so the pattern isn't always the same.
    for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }

    return sequence;
}


// --- Main Signal Generation Function ---

export function generateSignal(input: GenerateSignalInput): GenerateSignalOutput {
    const { 
        expirationTime, 
        userTier, 
        premiumMinWait = 5,
        premiumMaxWait = 10,
        vipMinWait = 10,
        vipMaxWait = 20,
    } = input;
    const now = new Date();

    // 1. Determine the random wait time based on user tier and current minute.
    const minuteSeed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime();
    
    const waitRange = userTier === 'PREMIUM' 
        ? { min: premiumMinWait, max: premiumMaxWait } 
        : { min: vipMinWait, max: vipMaxWait };

    const randomWaitMinutes = Math.floor(seededRandom(minuteSeed) * (waitRange.max - waitRange.min + 1)) + waitRange.min;

    const initialTargetTime = new Date(now.getTime() + randomWaitMinutes * 60 * 1000);

    // 2. Calculate the final, correctly aligned target time.
    let finalTargetTime: Date;

    if (expirationTime === '1m') {
        finalTargetTime = new Date(initialTargetTime);
        finalTargetTime.setSeconds(0, 0); 
        finalTargetTime.setMinutes(finalTargetTime.getMinutes() + 1); // Move to the start of the next minute
    } else { // 5m
        const minutes = initialTargetTime.getMinutes();
        const remainder = minutes % 5;
        const minutesToAdd = 5 - remainder;
        finalTargetTime = new Date(initialTargetTime.getTime());
        finalTargetTime.setMinutes(minutes + minutesToAdd, 0, 0);
    }
    
    // Ensure target time is in the future. If calculation puts it in the past, add one interval.
    if (finalTargetTime.getTime() <= now.getTime()) {
        const interval = expirationTime === '1m' ? 1 : 5;
        finalTargetTime.setMinutes(finalTargetTime.getMinutes() + interval);
    }


    // 3. Determine the signal based on the new logic.
    let finalSignal: 'CALL 🔼' | 'PUT 🔽';

    // Get the start of the 5-minute block containing the finalTargetTime.
    const blockStartMinutes = Math.floor(finalTargetTime.getMinutes() / 5) * 5;
    const fiveMinuteBlockStart = new Date(finalTargetTime);
    fiveMinuteBlockStart.setMinutes(blockStartMinutes, 0, 0);
    const fiveMinuteBlockSeed = fiveMinuteBlockStart.getTime();

    // Get the "master" prediction for that 5-minute block.
    const masterSignal = getFiveMinuteMasterSignal(fiveMinuteBlockSeed);

    if (expirationTime === '5m') {
        // For a 5m signal, we just return the master signal for that block.
        finalSignal = masterSignal;
    } else { // 1m
        // For a 1m signal, we get the sequence and find the correct signal for our target minute.
        const signalSequence = getOneMinuteSignalSequence(masterSignal, fiveMinuteBlockSeed);
        const targetMinuteInBlock = finalTargetTime.getMinutes() % 5; // Will be 0, 1, 2, 3, or 4.
        finalSignal = signalSequence[targetMinuteInBlock];
    }


    // 4. Format output.
    const targetTimeString = finalTargetTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

    return {
        signal: finalSignal,
        targetTime: targetTimeString,
        source: 'Aleatório' as const,
        targetDate: finalTargetTime,
    };
}
