'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Loader2, Lock, Timer, Crown, ExternalLink } from 'lucide-react';
import { CurrencyFlags } from './currency-flags';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Asset, ExpirationTime } from '@/app/analisador/page';
import { useAppConfig } from '@/firebase';
import { Firestore } from 'firebase/firestore';

/**
 * Widget de Calendário Económico focado para preencher o espaço mobile.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-4 md:mb-8 rounded-2xl overflow-hidden border border-white/5 bg-black/40 shadow-2xl animate-in fade-in duration-500">
      <div className="px-4 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Live Volatility</span>
        </div>
        <div className="text-[0.5rem] font-bold text-muted-foreground/30 uppercase">Impact Stream</div>
      </div>
      
      <div className="h-[180px] md:h-[240px] w-full overflow-hidden relative bg-[#0a0a0a]">
         <div className="relative w-[200%] left-[-10px] top-[-110px]">
            <iframe 
              src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance&importance=1,2,3&countries=${countries}&calType=day&timeZone=12&lang=12`} 
              width="100%" 
              height="800" 
              frameBorder="0" 
              allowTransparency={true}
              className="filter invert hue-rotate-180 brightness-[0.8] contrast-[1.3] saturate-[0.7] scale-[1.0] origin-top-left"
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
    else if (vipStatus === 'AWAITING_DEPOSIT') setWaitingMessage('Cadastro ok! Aguardando depósito.');
    else if (vipStatus === 'DEPOSIT_PENDING') setWaitingMessage('Verificando depósito.');
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
    <div className="w-full h-full flex flex-col justify-between text-center p-0">
      <div className="flex flex-col flex-grow">
        <div className="grid grid-cols-2 gap-3 mb-4 md:mb-8">
            <Button asChild variant="ghost" size="sm" className="h-11 md:h-14 text-[0.6rem] md:text-xs font-black uppercase tracking-widest border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <a href={config?.iqOptionOpenUrl || config?.iqOptionUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> IQ Option</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-11 md:h-14 text-[0.6rem] md:text-xs font-black uppercase tracking-widest border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <a href={config?.exnovaOpenUrl || config?.exnovaUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Exnova</a>
            </Button>
        </div>

        <EconomicCalendarWidget asset={formData.asset} />

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-2 rounded-xl mb-4">
                <Timer className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs font-bold text-primary/80">{waitingMessage}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-4 md:space-y-8 text-left flex-grow">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.6rem] md:text-[0.75rem] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-60">Ativo Selecionado:</Label>
              <div className="flex items-center space-x-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                <Label htmlFor="otc-switch" className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-50">OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.5] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-12 md:h-20 text-xs md:text-sm rounded-xl md:rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                <SelectValue asChild>
                  <div className="flex items-center gap-3">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-bold tracking-tight text-sm md:text-base">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-xl focus:bg-primary/20 focus:text-white py-4">
                    <div className="flex items-center gap-3"><CurrencyFlags asset={asset} /><span className="font-bold text-base">{asset}</span></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[0.6rem] md:text-[0.75rem] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-60 px-1">Tempo de Expiração:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-12 md:h-20 text-xs md:text-sm rounded-xl md:rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                <SelectValue placeholder="Selecione o Tempo" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl">
                <SelectItem value="1m" className="rounded-xl font-bold py-4 text-base">1 minuto (M1)</SelectItem>
                <SelectItem value="5m" className="rounded-xl font-bold py-4 text-base">5 minutos (M5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2 pt-6 pb-2">
          <Button
            size="lg"
            className="w-full h-16 md:h-24 text-lg md:text-2xl font-black bg-primary text-primary-foreground shadow-2xl transition-all pulse-strong rounded-xl md:rounded-2xl uppercase tracking-tighter"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-3 h-5 w-5 md:h-6 md:w-6 animate-spin" /> : (!isMarketOpen && !showOTC) ? <Lock className="mr-3 h-5 w-5 md:h-6 md:w-6" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-3 h-5 w-5 md:h-6 md:w-6" /> : <BarChart className="mr-3 h-5 w-5 md:h-6 md:w-6" />}
            {isLoading ? 'ANALISANDO...' : (!isMarketOpen && !showOTC) ? 'FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'BLOQUEADO' : 'ANALISAR AGORA'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full flex-row h-auto text-purple-400 hover:text-purple-300 group py-1" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-4 w-4 md:h-5 md:w-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] md:text-[0.75rem] font-black uppercase tracking-[0.2em]">ACESSO PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}
