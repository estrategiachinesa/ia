'use client';

import { useState, useMemo } from 'react';
import { useFirebase } from '@/firebase';
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
  FileSearch, 
  Copy, 
  ArrowLeft, 
  LineChart,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CurrencyFlags } from '@/components/app/currency-flags';
import { cn } from '@/lib/utils';

type Timeframe = '1m' | '5m' | '15m';
type Asset = 'EUR/USD' | 'EUR/USD (OTC)' | 'EUR/JPY' | 'EUR/JPY (OTC)';
type Direction = 'CALL' | 'PUT' | 'BOTH';

interface Signal {
  id: string;
  time: string;
  asset: Asset;
  direction: 'CALL 🔼' | 'PUT 🔽';
  timeframe: Timeframe;
}

const AVAILABLE_ASSETS: Asset[] = ['EUR/USD', 'EUR/USD (OTC)', 'EUR/JPY', 'EUR/JPY (OTC)'];

// Deterministic Direction Generator
function getDeterministicDirection(asset: string, time: string, dateStr: string): 'CALL 🔼' | 'PUT 🔽' {
  const seed = asset + time + dateStr;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2 === 0 ? 'CALL 🔼' : 'PUT 🔽';
}

export default function CatalogadorPage() {
  const { isUserLoading } = useFirebase();
  const router = useAffiliateRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(['EUR/USD']);
  const [direction, setDirection] = useState<Direction>('BOTH');
  const [quantity, setQuantity] = useState('10');
  const [signals, setSignals] = useState<Signal[]>([]);

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

    await new Promise(resolve => setTimeout(resolve, 2000));

    const newSignals: Signal[] = [];
    const today = new Date();
    const dateStr = today.toDateString();
    
    // Base time: next round 5 minutes
    const startTime = new Date(today);
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / 5) * 5, 0, 0);

    const qty = parseInt(quantity);
    const signalsPerAsset = Math.max(1, Math.floor(qty / selectedAssets.length));

    selectedAssets.forEach((assetName) => {
      const assetTime = new Date(startTime);
      for (let i = 0; i < signalsPerAsset; i++) {
        // Deterministic intervals: 20, 25 or 30 mins based on asset and index
        const interval = [20, 25, 30][(assetName.length + i) % 3];
        assetTime.setMinutes(assetTime.getMinutes() + interval);

        const timeStr = assetTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let finalDir: 'CALL 🔼' | 'PUT 🔽';
        const detDir = getDeterministicDirection(assetName, timeStr, dateStr);

        if (direction === 'BOTH') {
          finalDir = detDir;
        } else {
          finalDir = direction === 'CALL' ? 'CALL 🔼' : 'PUT 🔽';
        }

        newSignals.push({
          id: `${assetName}-${timeStr}-${i}`,
          time: timeStr,
          asset: assetName,
          direction: finalDir,
          timeframe: timeframe
        });
      }
    });

    // Sort all by time
    setSignals(newSignals.sort((a, b) => a.time.localeCompare(b.time)));
    setIsLoading(false);
    toast({
      title: 'Lista Gerada!',
      description: `Sinais catalogados com sucesso para ${selectedAssets.length} ativos.`,
    });
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({ title, description: 'Copiado para a área de transferência.' });
  };

  const handleCopySingleSignal = (s: Signal) => {
    const text = `🎯 SINAL ESTRATÉGIA CHINESA\n⏰ HORA: ${s.time}\n📊 ATIVO: ${s.asset}\n⏱️ TF: ${s.timeframe}\n🚀 DIREÇÃO: ${s.direction}`;
    copyToClipboard(text, 'Sinal Copiado!');
  };

  const handleCopyList = () => {
    const header = `📊 LISTA DE SINAIS - ESTRATÉGIA CHINESA\n🎯 ATIVOS: ${selectedAssets.join(', ')}\n⏱️ TIMEFRAME: ${timeframe}\n\n`;
    const list = signals.map(s => `${s.time} - ${s.asset} - ${s.direction}`).join('\n');
    const footer = `\n\n⚠️ Opere sempre com gestão de risco.`;
    copyToClipboard(header + list + footer, 'Lista Completa Copiada!');
  };

  if (isUserLoading) {
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
             <Button variant="ghost" size="icon" onClick={() => router.push('/analisador')} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
             </Button>
             <div className="flex flex-col">
                <h1 className="text-lg font-black uppercase tracking-tighter text-primary">Catalogador PRO</h1>
                <p className="text-[0.6rem] font-bold opacity-40 uppercase tracking-widest">Sinais Determinísticos</p>
             </div>
          </div>
          <Zap className="h-5 w-5 text-primary animate-pulse" />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card/40 border-white/5 shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-primary" /> Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Timeframe</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['1m', '5m', '15m'].map((t) => (
                    <Button
                      key={t}
                      variant={timeframe === t ? 'default' : 'outline'}
                      onClick={() => setTimeframe(t as Timeframe)}
                      className={cn(
                        "h-10 text-xs font-bold transition-all",
                        timeframe === t ? "bg-primary text-black" : "bg-white/5 border-white/5"
                      )}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Ativos (Selecione um ou mais)</Label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_ASSETS.map((assetName) => (
                    <Button
                      key={assetName}
                      variant="outline"
                      onClick={() => toggleAsset(assetName)}
                      className={cn(
                        "h-11 justify-between px-4 font-bold text-xs transition-all",
                        selectedAssets.includes(assetName) ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <CurrencyFlags asset={assetName} />
                        {assetName}
                      </div>
                      {selectedAssets.includes(assetName) && <Check className="h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Direção</Label>
                <div className="grid grid-cols-1 gap-2">
                   {[
                     { id: 'CALL', label: 'Apenas CALL', icon: TrendingUp, color: 'text-green-500' },
                     { id: 'PUT', label: 'Apenas PUT', icon: TrendingDown, color: 'text-red-500' },
                     { id: 'BOTH', label: 'Misto (Call/Put)', icon: Zap, color: 'text-primary' },
                   ].map((d) => (
                      <Button
                        key={d.id}
                        variant={direction === d.id ? 'default' : 'outline'}
                        onClick={() => setDirection(d.id as Direction)}
                        className={cn(
                          "h-11 justify-start gap-3 px-4 font-bold text-xs transition-all",
                          direction === d.id ? "bg-primary text-black border-primary" : "bg-white/5 border-white/5"
                        )}
                      >
                        <d.icon className={cn("h-4 w-4", direction === d.id ? "text-black" : d.color)} />
                        {d.label}
                      </Button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Quantidade Total</Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {[5, 10, 15, 20, 24].map(q => (
                      <SelectItem key={q} value={q.toString()} className="font-mono">{q} Sinais</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="w-full h-14 bg-primary text-black font-black uppercase tracking-tighter text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Catalogar Sinais'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/30 border-white/5 min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
               <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Sinais Gerados</h2>
               </div>
               {signals.length > 0 && (
                 <Button variant="outline" size="sm" onClick={handleCopyList} className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black">
                   <Copy className="h-4 w-4 mr-2" /> Copiar Lista Completa
                 </Button>
               )}
            </div>
            <CardContent className="flex-grow flex flex-col p-6">
               {signals.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {signals.map((signal) => (
                      <div 
                        key={signal.id} 
                        onClick={() => handleCopySingleSignal(signal)}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 cursor-pointer transition-all group relative overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
                               <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-lg font-black font-mono tracking-tighter">{signal.time}</span>
                               <span className="text-[0.6rem] font-bold uppercase opacity-30">{signal.timeframe}</span>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-1 relative z-10">
                            <div className="flex items-center gap-2">
                               <CurrencyFlags asset={signal.asset} />
                               <span className="text-xs font-black uppercase">{signal.asset}</span>
                            </div>
                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                              signal.direction.includes('CALL') 
                                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                              {signal.direction}
                            </span>
                         </div>
                         <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-30 transition-opacity">
                            <Copy className="h-3 w-3" />
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex-grow flex flex-col items-center justify-center text-center opacity-20 py-20">
                    <LineChart className="h-20 w-20 mb-6 stroke-[1px]" />
                    <h3 className="text-xl font-black uppercase tracking-tighter">Pronto para Catalogar</h3>
                    <p className="text-sm font-bold max-w-xs mt-2 uppercase tracking-widest">Sinais gerados via IA são idênticos para todos os operadores.</p>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-center gap-6 z-40">
         <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-widest opacity-40 hover:opacity-100" asChild>
            <a href="/analisador">Analisador Live</a>
         </Button>
         <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-widest text-primary" disabled>
            Catalogador PRO
         </Button>
         <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-widest opacity-40 hover:opacity-100" asChild>
            <a href="/sessaochinesa">Sessão Chinesa</a>
         </Button>
      </footer>
    </div>
  );
}