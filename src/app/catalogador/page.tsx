'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Copy, 
  ArrowLeft, 
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  ShieldCheck,
  Cpu,
  Target,
  BarChart4,
  Activity,
  Layers,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyFlags } from '@/components/app/currency-flags';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { generateSignal, Asset, ExpirationTime } from '@/lib/signal-generator';
import { useAppConfig } from '@/firebase/config-provider';
import { Badge } from '@/components/ui/badge';

type Timeframe = ExpirationTime;
type Direction = 'CALL' | 'PUT' | 'BOTH';

interface Signal {
  id: string;
  time: string;
  asset: Asset;
  direction: 'CALL 🔼' | 'PUT 🔽';
  timeframe: Timeframe;
  accuracy: number;
  confluence: number;
  strategy: string;
}

const AVAILABLE_ASSETS: Asset[] = ['EUR/USD', 'EUR/USD (OTC)', 'EUR/JPY', 'EUR/JPY (OTC)'];

const SCAN_STEPS = [
  "Iniciando varredura de ativos...",
  "Analisando médias móveis (MA20, MA100, MA200)...",
  "Verificando indicadores de Momentum (RSI & Estocástico)...",
  "Identificando zonas de suporte e resistência institucional...",
  "Mapeando padrões de velas (Engolfo, Martelo, Doji)...",
  "Calculando probabilidade de confluência estatística...",
  "Filtrando sinais de alta assertividade (> 82%)...",
  "Sincronizando com motor central de análise..."
];

export default function CatalogadorPage() {
  const { user, isUserLoading } = useFirebase();
  const { config } = useAppConfig();
  const router = useAffiliateRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(['EUR/USD']);
  const [direction, setDirection] = useState<Direction>('BOTH');
  const [quantity, setQuantity] = useState('12');
  const [signals, setSignals] = useState<Signal[]>([]);

  // Bloqueio de acesso para não logados
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const toggleAsset = (asset: Asset) => {
    setSelectedAssets(prev => 
      prev.includes(asset) 
        ? (prev.length > 1 ? prev.filter(a => a !== asset) : prev) 
        : [...prev, asset]
    );
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setSignals([]);
    setLoadingStep(0);
    setProgress(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setLoadingStep(i);
      const targetProgress = ((i + 1) / SCAN_STEPS.length) * 100;
      
      const steps = 10;
      const startProgress = progress;
      const increment = (targetProgress - startProgress) / steps;
      
      for(let s = 0; s < steps; s++) {
        setProgress(prev => Math.min(prev + increment, 100));
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }

    const newSignals: Signal[] = [];
    const now = new Date();
    
    const startTime = new Date(now);
    const intervalMinutes = timeframe === '1m' ? 1 : 5;
    
    if (timeframe === '1m') {
        startTime.setSeconds(0, 0);
        startTime.setMinutes(startTime.getMinutes() + 1);
    } else {
        const minutes = startTime.getMinutes();
        const remainder = minutes % 5;
        const minutesToAdd = (remainder === 0) ? 5 : (5 - remainder);
        startTime.setMinutes(minutes + minutesToAdd, 0, 0);
    }

    const qty = parseInt(quantity);
    const signalsPerAsset = Math.max(1, Math.floor(qty / selectedAssets.length));

    selectedAssets.forEach((assetName) => {
      const assetTime = new Date(startTime);
      for (let i = 0; i < signalsPerAsset; i++) {
        const result = generateSignal({
            asset: assetName,
            expirationTime: timeframe,
            targetDate: assetTime,
            invertSignal: config?.invertSignal
        });

        const matchesDirection = direction === 'BOTH' || 
                               (direction === 'CALL' && result.signal.includes('CALL')) ||
                               (direction === 'PUT' && result.signal.includes('PUT'));

        if (matchesDirection) {
            newSignals.push({
                id: `${assetName}-${result.targetTime}-${i}`,
                time: result.targetTime,
                asset: assetName,
                direction: result.signal,
                timeframe: timeframe,
                accuracy: result.accuracy,
                confluence: result.confluence,
                strategy: result.strategy
            });
        }

        const gap = 15 + (Math.abs(assetTime.getTime()) % 15);
        assetTime.setMinutes(assetTime.getMinutes() + gap);
      }
    });

    setSignals(newSignals.sort((a, b) => a.time.localeCompare(b.time)));
    setIsLoading(false);
    toast({
      title: 'Lista PRO Sincronizada!',
      description: `${newSignals.length} sinais catalogados com sucesso.`,
    });
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({ title, description: 'Copiado para a área de transferência.' });
  };

  const handleCopySingleSignal = (s: Signal) => {
    const text = `🎯 *SINAL ESTRATÉGIA CHINESA*\n\n⏰ HORA: *${s.time}*\n📊 ATIVO: *${s.asset}*\n⏱️ TEMPO: *${s.timeframe}*\n🚀 AÇÃO: *${s.direction}*\n✅ PRECISÃO: *${s.accuracy}%*\n🔥 ESTRATÉGIA: *${s.strategy}*\n\n⚠️ _Sinal sincronizado com o Analisador Live._`;
    copyToClipboard(text, 'Sinal Único Copiado!');
  };

  const handleCopyList = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const header = `📊 *LISTA VIP - ESTRATÉGIA CHINESA*\n📅 DATA: ${today}\n⏱️ TIME: ${timeframe}\n\n`;
    const list = signals.map(s => `✅ ${s.time} | ${s.asset.padEnd(12)} | ${s.direction} | ${s.accuracy}%`).join('\n');
    const footer = `\n\n🎯 *Instruções:* Entrar no início da vela.\n⚠️ Opere sempre com gestão de banca.`;
    copyToClipboard(header + list + footer, 'Lista VIP Copiada!');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-body pb-20">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => router.push('/analisador')} className="rounded-full hover:bg-white/5">
                <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex flex-col">
                <h1 className="text-lg font-black uppercase tracking-tighter text-primary flex items-center gap-2">
                   Scanner de Elite <Badge variant="outline" className="bg-primary/20 text-primary border-none text-[0.5rem] px-1.5 h-4">ELITE SYNC</Badge>
                </h1>
                <p className="text-[0.6rem] font-bold opacity-40 uppercase tracking-widest">Sincronizado com Analisador Live</p>
             </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 shadow-lg shadow-primary/5">
             <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
             <span className="text-[0.6rem] font-black uppercase tracking-widest text-primary">CORE ENGINE SYNC</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card/40 border-white/5 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden shine-effect">
            <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-full" />
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-70">
                <Cpu className="h-4 w-4 text-primary" /> Configurar Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-8">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Timeframe (Sync)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['1m', '5m'].map((t) => (
                    <Button
                      key={t}
                      variant={timeframe === t ? 'default' : 'outline'}
                      onClick={() => setTimeframe(t as Timeframe)}
                      className={cn(
                        "h-10 text-xs font-black transition-all rounded-xl",
                        timeframe === t ? "bg-primary text-black" : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      {t === '1m' ? 'M1 (1 Min)' : 'M5 (5 Min)'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Ativos para Varredura</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_ASSETS.map((assetName) => (
                    <Button
                      key={assetName}
                      variant="outline"
                      onClick={() => toggleAsset(assetName)}
                      className={cn(
                        "h-12 justify-between px-4 font-bold text-xs transition-all rounded-xl",
                        selectedAssets.includes(assetName) ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CurrencyFlags asset={assetName} />
                        <span className="tracking-tight">{assetName}</span>
                      </div>
                      {selectedAssets.includes(assetName) ? <Check className="h-4 w-4" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Direção Predominante</Label>
                <div className="grid grid-cols-1 gap-2">
                   {[
                     { id: 'CALL', label: 'Tendência de Alta (CALL)', icon: TrendingUp, color: 'text-green-500' },
                     { id: 'PUT', label: 'Tendência de Baixa (PUT)', icon: TrendingDown, color: 'text-red-500' },
                     { id: 'BOTH', label: 'Modo Híbrido (Call/Put)', icon: Zap, color: 'text-primary' },
                   ].map((d) => (
                      <Button
                        key={d.id}
                        variant={direction === d.id ? 'default' : 'outline'}
                        onClick={() => setDirection(d.id as Direction)}
                        className={cn(
                          "h-12 justify-start gap-4 px-4 font-bold text-xs transition-all rounded-xl",
                          direction === d.id ? "bg-primary text-black border-primary" : "bg-white/5 border-white/5"
                        )}
                      >
                        <div className={cn("p-1.5 rounded-lg bg-black/40", direction === d.id ? "text-black" : d.color)}>
                            <d.icon className="h-4 w-4" />
                        </div>
                        {d.label}
                      </Button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Capacidade de Extração</Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-12 font-mono rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-white/10 rounded-xl">
                    {[5, 12, 18, 24].map(q => (
                      <SelectItem key={q} value={q.toString()} className="font-mono">{q} Sinais de Elite</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="w-full h-14 bg-primary text-black font-black uppercase tracking-tighter text-base shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all rounded-xl"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Sincronizar Scanner'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/30 border-white/5 min-h-[650px] flex flex-col overflow-hidden rounded-3xl relative">
            
            {isLoading ? (
               <div className="flex-grow flex flex-col items-center justify-center p-10 space-y-10 animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full border-[3px] border-primary/10 border-t-primary animate-spin" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary/10 p-5 rounded-full">
                        <Cpu className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="w-full max-w-md space-y-5">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
                          {SCAN_STEPS[loadingStep]}
                        </p>
                        <p className="text-[0.55rem] font-bold text-muted-foreground uppercase opacity-40">Motor de Análise Unificado Ativo</p>
                      </div>
                      <p className="text-xl font-black font-mono tracking-tighter text-primary">{Math.round(progress)}%</p>
                    </div>
                    <Progress value={progress} className="h-2 bg-white/5 border border-white/5 rounded-full" />
                  </div>
               </div>
            ) : signals.length > 0 ? (
               <>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md sticky top-0 z-10">
                   <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                      <div className="flex flex-col">
                        <h2 className="text-sm font-black uppercase tracking-widest">Sinais Sincronizados</h2>
                        <span className="text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-tighter">Mesmo resultado do Analisador Live</span>
                      </div>
                   </div>
                   <Button variant="outline" size="sm" onClick={handleCopyList} className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black rounded-full h-10 px-6 text-[0.65rem] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/5">
                     <Copy className="h-4 w-4 mr-2" /> Copiar Lista VIP
                   </Button>
                </div>
                <CardContent className="flex-grow p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                      {signals.map((signal) => (
                        <div 
                          key={signal.id} 
                          onClick={() => handleCopySingleSignal(signal)}
                          className="flex items-center justify-between p-5 bg-card/50 backdrop-blur-xl rounded-2xl border border-white/5 hover:border-primary/40 cursor-pointer transition-all group relative overflow-hidden active:scale-95 shadow-xl"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           <div className="flex items-center gap-4 relative z-10">
                              <div className="p-3.5 bg-black/60 rounded-xl border border-white/5 group-hover:border-primary/30 transition-all shadow-inner">
                                 <Clock className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-xl font-black font-mono tracking-tighter group-hover:text-primary transition-colors">{signal.time}</span>
                                 <div className="flex items-center gap-2 mt-0.5">
                                   <Badge variant="outline" className="text-[0.5rem] font-black uppercase py-0 border-white/10 opacity-60">{signal.timeframe}</Badge>
                                   <div className="flex items-center gap-1">
                                      <ShieldCheck className="h-3 w-3 text-green-500/70" />
                                      <span className="text-[0.55rem] font-black text-green-500/70">{signal.confluence}x Confirmações</span>
                                   </div>
                                 </div>
                              </div>
                           </div>

                           <div className="text-right flex flex-col items-end gap-1.5 relative z-10">
                              <div className="flex items-center gap-2">
                                 <CurrencyFlags asset={signal.asset} />
                                 <span className="text-xs font-black uppercase tracking-tight">{signal.asset}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[0.6rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                  signal.direction.includes('CALL') 
                                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                )}>
                                  {signal.direction}
                                </span>
                                <div className="px-2 py-0.5 bg-primary/20 rounded-md border border-primary/30 shadow-lg shadow-primary/5">
                                   <span className="text-[0.65rem] font-black text-primary">{signal.accuracy}%</span>
                                </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
               </>
            ) : (
               <div className="flex-grow flex flex-col items-center justify-center text-center p-12 space-y-6">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative bg-black/40 p-10 rounded-full border border-white/5 shadow-2xl">
                        <BarChart4 className="h-20 w-20 text-white/10" />
                        <Zap className="absolute -top-1 -right-1 h-10 w-10 text-primary animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-2 max-w-sm">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Scanner de Elite Sincronizado</h3>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed opacity-60">
                        Escolha os ativos e o timeframe. A lista gerada será idêntica à análise em tempo real do Analisador Live.
                      </p>
                  </div>
               </div>
            )}
          </Card>
        </div>

      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex justify-center gap-10 z-40">
         <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-primary transition-all" asChild>
            <a href="/analisador">Analisador Live</a>
         </Button>
         <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary relative" disabled>
            Scanner de Elite
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
         </Button>
         <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-primary transition-all" asChild>
            <a href="/sessaochinesa">Sessão Chinesa</a>
         </Button>
      </footer>
    </div>
  );
}
