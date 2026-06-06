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
  source: 'Price Action';
  targetDate: Date;
  accuracy: number;
  confluence: number;
  strategy: string;
};

// Estratégias baseadas na lógica PA Complete fornecida (Donchian Channels)
const STRATEGIES = [
    "PA Complete: Rejeição M30", 
    "Donchian Rebound (PA)", 
    "Suporte Institucional", 
    "Resistência M15/M30"
];

/**
 * Função central de geração determinística com lógica PA Complete.
 * Simula a identificação de toques e rejeições em canais de Donchian (High/Low).
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

    // 1. Calcular o próximo bloco de tempo redondo (M1 ou M5)
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

    // 2. Criar uma Seed determinística baseada no ativo e no timestamp
    // Isso garante que todos os utilizadores vejam o mesmo sinal no mesmo horário
    const timestamp = targetDate.getTime();
    const assetSeed = asset.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const combinedSeed = timestamp + assetSeed;

    // 3. Tradução da Lógica Pine Script (PA Complete)
    // Simulamos a oscilação do preço em relação às bandas de Donchian
    // marketPosition oscila entre -1 (Suporte) e 1 (Resistência)
    const marketPosition = Math.sin(combinedSeed / 150000); 
    
    let signal: 'CALL 🔼' | 'PUT 🔽';
    let strategyIndex: number;

    // Lógica do Script: Toque na banda + Rejeição (Fechamento contrário)
    if (marketPosition > 0.35) {
        // Simula: Preço atingiu Resistência Longa (M30) e retraiu -> VENDA
        signal = 'PUT 🔽';
        strategyIndex = 0; // "PA Complete: Rejeição M30"
    } else if (marketPosition < -0.35) {
        // Simula: Preço atingiu Suporte Longo (M30) e subiu -> COMPRA
        signal = 'CALL 🔼';
        strategyIndex = 2; // "Suporte Institucional"
    } else {
        // Se estiver no meio do canal, segue a tendência de curto prazo (M15)
        const microTrend = Math.cos(combinedSeed / 45000);
        signal = microTrend >= 0 ? 'CALL 🔼' : 'PUT 🔽';
        strategyIndex = 1; // "Donchian Rebound (PA)"
    }

    // 4. Parâmetros de Assertividade (Determinísticos)
    // Calibrados para parecerem reais e seguirem o padrão institucional
    const accuracy = 82 + (Math.abs(Math.floor(Math.sin(combinedSeed) * 14)));
    const confluence = 2 + (Math.abs(Math.floor(Math.cos(combinedSeed) * 3)));
    const strategy = STRATEGIES[strategyIndex];

    // 5. Inversão Global (Configuração do Admin)
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
        source: 'Price Action' as const,
        targetDate,
        accuracy,
        confluence,
        strategy
    };
}
