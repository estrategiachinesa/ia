'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Loader2, Lock, Timer, Crown, ExternalLink, Radio } from 'lucide-react';
import { CurrencyFlags } from './currency-flags';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Asset, ExpirationTime } from '@/app/analisador/page';
import { useAppConfig } from '@/firebase';
import { Firestore } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * Widget de Calendário Económico Filtrado: Hora, Moeda e Touros apenas.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-1 rounded-xl overflow-hidden border border-white/5 bg-black/40 shadow-xl animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="px-2 py-0.5 bg-white/5 border-b border-white/5 flex items-center justify-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
        <span className="text-[0.45rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Impact Stream</span>
      </div>
      
      <div className="h-[90px] w-full overflow-hidden relative bg-[#0a0a0a]">
         <div className="relative w-[180%] left-[-15px] top-[-118px]">
            <iframe 
              src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance&importance=2,3&features=timezone&countries=${countries}&calType=day&timeZone=12&lang=12`} 
              width="100%" 
              height="800" 
              frameBorder="0" 
              allowTransparency={true}
              className="filter invert hue-rotate-180 brightness-[0.7] contrast-[1.4] saturate-[0.8] origin-top-left scale-[1.05]"
            ></iframe>
         </div>
      </div>
    </div>
  );
}

type VipStatus = 'PENDING' | 'AWAITING_DEPOSIT' | 'DEPOSIT_PENDING' | 'APPROVED' | 'REJECTED' | 'PREMIUM';

type FormData = {
  asset: Asset;
  expirationTime: ExpirationTime;
};

type SignalFormProps = {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  onSubmit: () => void;
  isLoading: boolean;
  showOTC: boolean;
  setShowOTC: (show: boolean) => void;
  isMarketOpen: boolean;
  hasReachedLimit: boolean;
  user: any;
  firestore: Firestore;
  isPremium: boolean;
  vipStatus?: VipStatus;
  isVipModalOpen: boolean;
  setVipModalOpen: (isOpen: boolean) => void;
  setUpgradeModalOpen: (isOpen: boolean) => void;
  rejectedBrokerId?: string;
};

const allAssets: Asset[] = ['EUR/JPY', 'EUR/JPY (OTC)', 'EUR/USD', 'EUR/USD (OTC)'];

export function SignalForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  showOTC,
  setShowOTC,
  isMarketOpen,
  hasReachedLimit,
  isPremium,
  vipStatus,
  setVipModalOpen,
  setUpgradeModalOpen,
}: SignalFormProps) {
  const { config } = useAppConfig();
  const [waitingMessage, setWaitingMessage] = useState('');

  const assets = showOTC 
    ? allAssets.filter(a => a.includes('(OTC)')) 
    : allAssets.filter(a => !a.includes('(OTC)'));

  useEffect(() => {
    if (vipStatus === 'PENDING') setWaitingMessage('Analisando cadastro...');
    else if (vipStatus === 'AWAITING_DEPOSIT') setWaitingMessage('Aguardando depósito...');
    else if (vipStatus === 'DEPOSIT_PENDING') setWaitingMessage('Verificando saldo...');
    else setWaitingMessage('');
  }, [vipStatus]);

  useEffect(() => {
    if (showOTC && !formData.asset.includes('(OTC)')) {
      const otcAsset = `${formData.asset} (OTC)` as Asset;
      if (allAssets.includes(otcAsset)) setFormData(prev => ({ ...prev, asset: otcAsset }));
    } else if (!showOTC && formData.asset.includes('(OTC)')) {
      const normalAsset = formData.asset.replace(' (OTC)', '') as Asset;
      if (allAssets.includes(normalAsset)) setFormData(prev => ({ ...prev, asset: normalAsset }));
    }
  }, [showOTC, setFormData]);

  const buttonDisabled = isLoading || (!isMarketOpen && !showOTC) || (hasReachedLimit && !waitingMessage && !isPremium);

  return (
    <div className="w-full h-full flex flex-col justify-between p-0 overflow-hidden text-center">
      <div className="flex flex-col gap-2 flex-grow overflow-hidden">
        
        {/* BOTÕES CORRETORA */}
        <div className="grid grid-cols-2 gap-1.5 shrink-0 px-2">
            <Button asChild variant="ghost" size="sm" className="h-8 md:h-10 text-[0.55rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-lg hover:bg-primary/20 hover:border-primary transition-all duration-300">
                <a href={config?.iqOptionOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3 w-3" /> IQ Option</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-8 md:h-10 text-[0.55rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-lg hover:bg-primary/20 hover:border-primary transition-all duration-300">
                <a href={config?.exnovaOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3 w-3" /> Exnova</a>
            </Button>
        </div>

        {/* NOTICIAS - OCULTAS EM OTC */}
        {!showOTC && (
            <div className="shrink-0 px-2">
                <EconomicCalendarWidget asset={formData.asset} />
            </div>
        )}

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-1 rounded-lg mx-2 shrink-0">
                <AlertDescription className="text-[0.55rem] font-black text-primary/80 uppercase flex items-center justify-center gap-2">
                  <Radio className="h-3 w-3 animate-pulse" /> {waitingMessage}
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-3 flex-grow flex flex-col justify-center px-4">
          {/* ATIVO */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Par de Moedas:</Label>
              <div className="flex items-center space-x-1 bg-black/40 px-1.5 py-0.5 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.4rem] font-black text-muted-foreground uppercase opacity-70">OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.45] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-10 md:h-12 rounded-xl bg-white/5 border-white/10 hover:border-primary hover:bg-white/10 transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center gap-3 w-full">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-black tracking-tight text-[0.7rem] md:text-sm uppercase">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-lg focus:bg-primary/20 py-2.5">
                    <div className="flex items-center gap-3"><CurrencyFlags asset={asset} /><span className="font-black text-[0.6rem] uppercase">{asset}</span></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EXPIRAÇÃO */}
          <div className="space-y-1">
            <Label className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Tempo de Expiração:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-10 md:h-12 rounded-xl bg-white/5 border-white/10 text-[0.7rem] font-black uppercase text-center hover:border-primary hover:bg-white/10 transition-all duration-300">
                <SelectValue placeholder="Tempo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                <SelectItem value="1m" className="rounded-lg font-black py-2.5 text-[0.65rem] uppercase">M1 (60 Segundos)</SelectItem>
                <SelectItem value="5m" className="rounded-lg font-black py-2.5 text-[0.65rem] uppercase">M5 (5 Minutos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="w-full space-y-1.5 pt-2 pb-2 shrink-0 px-4">
          <Button
            size="lg"
            className="w-full h-12 md:h-14 text-sm md:text-base font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-xl uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all duration-300"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (!isMarketOpen && !showOTC) ? <Lock className="mr-2 h-4 w-4" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-2 h-4 w-4" /> : <BarChart className="mr-2 h-4 w-4" />}
            {isLoading ? 'ANALISANDO...' : (!isMarketOpen && !showOTC) ? 'MERCADO FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'ACESSO BLOQUEADO' : 'ANALISAR AGORA'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full h-auto text-purple-400 py-0.5 hover:text-purple-300 transition-colors" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-3 w-3 mr-1.5 animate-pulse" />
                <span className="text-[0.55rem] font-black uppercase tracking-widest">DESBLOQUEAR ACESSO PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}
