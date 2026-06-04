
'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { useAppConfig } from '@/firebase/config-provider';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
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
  CheckCircle2, 
  ArrowLeft, 
  LineChart,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock
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

export default function CatalogadorPage() {
  const { user, isUserLoading } = useFirebase();
  const router = useAffiliateRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [asset, setAsset] = useState<Asset>('EUR/USD');
  const [direction, setDirection] = useState<Direction>('BOTH');
  const [quantity, setQuantity] = useState('10');
  const [signals, setSignals] = useState<Signal[]>([]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setSignals([]);

    // Simulação de processamento de IA/Estatística
    await new Promise(resolve => setTimeout(resolve, 2500));

    const newSignals: Signal[] = [];
    const now = new Date();
    // Arredonda para os próximos 5 minutos para começar
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);

    for (let i = 0; i < parseInt(quantity); i++) {
      // Incrementa o horário em intervalos de 20 a 30 minutos
      const interval = 20 + Math.floor(Math.random() * 11);
      now.setMinutes(now.getMinutes() + interval);

      let finalDir: 'CALL 🔼' | 'PUT 🔽';
      if (direction === 'BOTH') {
        finalDir = Math.random() > 0.5 ? 'CALL 🔼' : 'PUT 🔽';
      } else {
        finalDir = direction === 'CALL' ? 'CALL 🔼' : 'PUT 🔽';
      }

      newSignals.push({
        id: Math.random().toString(36).substr(2, 9),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        asset: asset,
        direction: finalDir,
        timeframe: timeframe
      });
    }

    setSignals(newSignals);
    setIsLoading(false);
    toast({
      title: 'Lista Gerada!',
      description: `${quantity} sinais catalogados para ${asset}.`,
    });
  };

  const handleCopyList = () => {
    const header = `📊 LISTA DE SINAIS - ESTRATÉGIA CHINESA\n🎯 ATIVO: ${asset}\n⏱️ TIMEFRAME: ${timeframe}\n\n`;
    const list = signals.map(s => `${s.time} - ${s.asset} - ${s.direction}`).join('\n');
    const footer = `\n\n⚠️ Opere sempre com gestão de risco.`;
    
    navigator.clipboard.writeText(header + list + footer);
    toast({
      title: 'Copiado!',
      description: 'A lista de sinais foi copiada para a área de transferência.',
    });
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
                <p className="text-[0.6rem] font-bold opacity-40 uppercase tracking-widest">Geração de Listas</p>
             </div>
          </div>
          <Zap className="h-5 w-5 text-primary animate-pulse" />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CONFIGURATION PANEL */}
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
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Ativo</Label>
                <Select value={asset} onValueChange={(v) => setAsset(v as Asset)}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                    <SelectItem value="EUR/USD (OTC)">EUR/USD (OTC)</SelectItem>
                    <SelectItem value="EUR/JPY">EUR/JPY</SelectItem>
                    <SelectItem value="EUR/JPY (OTC)">EUR/JPY (OTC)</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label className="text-[0.65rem] font-bold uppercase opacity-60">Quantidade de Sinais</Label>
                <Select value={quantity} onValueChange={setQuantity}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-11 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/10">
                    {[1, 5, 10, 15, 20, 24].map(q => (
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

        {/* RESULTS AREA */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/30 border-white/5 min-h-[600px] flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
               <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Sinais Catalogados</h2>
               </div>
               {signals.length > 0 && (
                 <Button variant="outline" size="sm" onClick={handleCopyList} className="bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-black">
                   <Copy className="h-4 w-4 mr-2" /> Copiar Lista
                 </Button>
               )}
            </div>
            <CardContent className="flex-grow flex flex-col p-6">
               {signals.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {signals.map((signal) => (
                      <div 
                        key={signal.id} 
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-black/40 rounded-xl border border-white/5 group-hover:border-primary/20 transition-all">
                               <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-lg font-black font-mono tracking-tighter">{signal.time}</span>
                               <span className="text-[0.6rem] font-bold uppercase opacity-30">Início da Vela</span>
                            </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-1">
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
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex-grow flex flex-col items-center justify-center text-center opacity-20 py-20">
                    <LineChart className="h-20 w-20 mb-6 stroke-[1px]" />
                    <h3 className="text-xl font-black uppercase tracking-tighter">Nenhuma lista gerada</h3>
                    <p className="text-sm font-bold max-w-xs mt-2 uppercase tracking-widest">Ajuste os filtros e clique no botão para iniciar a catalogação estatística.</p>
                 </div>
               )}
            </CardContent>
            {signals.length > 0 && (
              <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                 <p className="text-[0.6rem] font-black uppercase text-muted-foreground tracking-widest">Processado via Inteligência Artificial v.2026</p>
              </div>
            )}
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
