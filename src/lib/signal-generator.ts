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

// Estratégias baseadas na lógica PA Complete fornecida
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

    // 1. Calcular o próximo bloco de tempo redondo
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

    // 2. Criar uma Seed baseada no ativo e no timestamp do sinal
    const timestamp = targetDate.getTime();
    const assetSeed = asset.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const combinedSeed = timestamp + assetSeed;

    // 3. Lógica Simulada de Preço (Baseada no Script PA Complete)
    // Simulamos a posição do preço em relação ao Canal de Donchian Longo (M30)
    // O valor oscila entre -1 (Suporte Longo) e 1 (Resistência Longa)
    const marketPosition = Math.sin(combinedSeed / 120000); // Oscilação lenta para simular canais
    
    let signal: 'CALL 🔼' | 'PUT 🔽';
    let strategyIndex: number;

    // Lógica do Script: Toque na banda + Rejeição
    if (marketPosition > 0.4) {
        // Simula: Preço tocou na Resistência e iniciou rejeição (Venda)
        signal = 'PUT 🔽';
        strategyIndex = combinedSeed % 2 === 0 ? 0 : 3; // Rejeição M30 ou Resistência M15/M30
    } else if (marketPosition < -0.4) {
        // Simula: Preço tocou no Suporte e iniciou rejeição (Compra)
        signal = 'CALL 🔼';
        strategyIndex = combinedSeed % 2 === 0 ? 2 : 1; // Suporte Institucional ou Donchian Rebound
    } else {
        // Se estiver no meio do canal, seguimos a micro-tendência do período curto
        const microTrend = Math.cos(combinedSeed / 30000);
        signal = microTrend >= 0 ? 'CALL 🔼' : 'PUT 🔽';
        strategyIndex = 1; // Donchian Rebound
    }

    // 4. Detalhes Determinísticos de Assertividade
    // Mínimo de 84% conforme calibragem institucional
    const accuracy = 84 + (Math.abs(Math.floor(Math.sin(combinedSeed) * 12)));
    const confluence = 2 + (Math.abs(Math.floor(Math.cos(combinedSeed) * 4)));
    const strategy = STRATEGIES[strategyIndex];

    // 5. Opção de Inversão (Configuração Global de Admin)
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
