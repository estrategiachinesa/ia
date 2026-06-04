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
  targetDate?: Date; // Opcional: se não enviado, calcula o próximo
};

export type GenerateSignalOutput = {
  signal: 'CALL 🔼' | 'PUT 🔽';
  targetTime: string;
  source: 'Aleatório';
  targetDate: Date;
  accuracy: number;
  confluence: number;
  strategy: string;
};

const STRATEGIES = ["Price Action PRO", "MHI Calibrada", "Fluxo de Tendência", "Reversão de Exaustão"];

/**
 * Função central de geração determinística.
 * Garante que para o MESMO ATIVO e MESMO HORÁRIO, o sinal seja SEMPRE IGUAL.
 */
export function generateSignal(input: GenerateSignalInput): GenerateSignalOutput {
    const { 
        expirationTime, 
        invertSignal = false,
        asset,
        targetDate: inputDate
    } = input;

    const now = new Date();
    let targetDate: Date;

    // 1. Calcular o próximo bloco de tempo se não for fornecido
    if (inputDate) {
        targetDate = new Date(inputDate);
    } else {
        targetDate = new Date(now);
        if (expirationTime === '1m') {
            targetDate.setSeconds(0, 0);
            targetDate.setMinutes(targetDate.getMinutes() + 1);
        } else { // 5m
            const minutes = targetDate.getMinutes();
            const remainder = minutes % 5;
            const minutesToAdd = (remainder === 0) ? 5 : (5 - remainder);
            targetDate.setMinutes(minutes + minutesToAdd, 0, 0);
        }
    }

    // 2. Criar uma Seed baseada no ativo e no tempo redondo (timestamp)
    const timestamp = targetDate.getTime();
    const assetSeed = asset.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const combinedSeed = timestamp + assetSeed;

    // 3. Motor de Tendência (Onda Senoidal)
    // Cria oscilações de mercado que duram alguns blocos, parecendo tendências reais.
    const waveFreq = expirationTime === '1m' ? 600000 : 1800000; // Ondas de 10 ou 30 min
    const trendValue = Math.sin(combinedSeed / waveFreq);
    
    let signal: 'CALL 🔼' | 'PUT 🔽' = trendValue >= 0 ? 'CALL 🔼' : 'PUT 🔽';

    // 4. Detalhes Determinísticos (Assertividade e Estratégia)
    // Usamos o módulo da seed para garantir que os valores sejam sempre os mesmos para aquele sinal
    const accuracy = 84 + (Math.abs(Math.floor(Math.sin(combinedSeed) * 12)));
    const confluence = 3 + (Math.abs(Math.floor(Math.cos(combinedSeed) * 3)));
    const strategy = STRATEGIES[Math.abs(combinedSeed) % STRATEGIES.length];

    // 5. Inverter sinal (Global Config)
    if (invertSignal) {
        signal = signal === 'CALL 🔼' ? 'PUT 🔽' : 'CALL 🔼';
    }

    const targetTimeString = targetDate.toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });

    return {
        signal,
        targetTime: targetTimeString,
        source: 'Aleatório' as const,
        targetDate,
        accuracy,
        confluence,
        strategy
    };
}
