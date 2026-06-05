'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Info, Loader2, Lock, Send, Timer, Crown, Trophy, ExternalLink } from 'lucide-react';
import { CurrencyFlags } from './currency-flags';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Asset, ExpirationTime } from '@/app/analisador/page';
import { useAppConfig } from '@/firebase';
import AffiliateLink from './affiliate-link';
import { Firestore } from 'firebase/firestore';

/**
 * Widget de Calendário Económico ultra-focado.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  if (asset.includes('(OTC)')) return null;

  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-3 md:mb-6 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 bg-black/40 shadow-inner animate-in fade-in duration-500">
      <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            <span className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-[0.1em]">Volatility</span>
            <a 
              href="https://br.investing.com/economic-calendar/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 p-0.5 rounded hover:bg-white/10 transition-all opacity-30 hover:opacity-100 text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
        </div>
        <div className="flex items-center gap-3 text-[0.5rem] font-bold text-muted-foreground/40 uppercase">
            <span>Hora</span>
            <span>Ativo</span>
            <span>Imp</span>
        </div>
      </div>
      
      <div className="h-[100px] md:h-[160px] w-full overflow-hidden relative bg-[#0a0a0a]">
         <div className="relative w-[200%] left-[-5px] top-[-105px]">
            <iframe 
              src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance&importance=1,2,3&countries=${countries}&calType=day&timeZone=12&lang=12`} 
              width="100%" 
              height="1000" 
              frameBorder="0" 
              allowTransparency={true}
              className="filter invert hue-rotate-180 brightness-[0.9] contrast-[1.4] saturate-[0.8] scale-[1.1] origin-top-left"
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

  const buttonDisabled = isLoading || !isMarketOpen || (hasReachedLimit && !waitingMessage && !isPremium);

  return (
    <div className="w-full space-y-3 md:space-y-6 text-center">
      <div className="grid grid-cols-2 gap-2 mb-1">
          <Button asChild variant="ghost" size="sm" className="h-7 md:h-8 text-[0.55rem] md:text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <a href={config?.iqOptionUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> IQ Option</a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-7 md:h-8 text-[0.55rem] md:text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <a href={config?.exnovaUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> Exnova</a>
          </Button>
      </div>

      <EconomicCalendarWidget asset={formData.asset} />

      <div className="space-y-1 md:space-y-2">
        <p className="text-[0.55rem] md:text-[0.65rem] text-foreground/40 font-bold uppercase tracking-[0.2em]">Configuração Operacional</p>
        <div className="h-px w-6 md:w-8 bg-primary/20 mx-auto" />
      </div>

      {waitingMessage && (
          <Alert className="text-center bg-primary/5 border-primary/20 py-1.5 md:py-2.5 rounded-xl">
              <Timer className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <AlertDescription className="text-[0.6rem] md:text-[0.7rem] font-bold text-primary/80">{waitingMessage}</AlertDescription>
          </Alert>
      )}

      <div className="space-y-3 md:space-y-5 text-left">
        <div className="space-y-1.5 md:space-y-2.5">
          <div className="flex justify-between items-center px-1">
            <Label className="text-[0.55rem] md:text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Ativo:</Label>
            <div className="flex items-center space-x-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              <Label htmlFor="otc-switch" className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-50">OTC</Label>
              <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.4] origin-right" />
            </div>
          </div>
          <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
            <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm rounded-xl bg-white/5 border-white/5 hover:bg-white/10 transition-all">
              <SelectValue asChild>
                <div className="flex items-center gap-2 md:gap-3">
                  <CurrencyFlags asset={formData.asset} />
                  <span className="font-bold tracking-tight">{formData.asset}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
              {assets.map(asset => (
                <SelectItem key={asset} value={asset} className="rounded-lg focus:bg-primary/20 focus:text-white">
                  <div className="flex items-center gap-3"><CurrencyFlags asset={asset} /><span className="font-bold">{asset}</span></div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:space-y-2.5">
          <Label className="text-[0.55rem] md:text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest opacity-60 px-1">Expiração:</Label>
          <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
            <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm rounded-xl bg-white/5 border-white/5 hover:bg-white/10 transition-all">
              <SelectValue placeholder="Selecione o Tempo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
              <SelectItem value="1m" className="rounded-lg font-bold">1 minuto (M1)</SelectItem>
              <SelectItem value="5m" className="rounded-lg font-bold">5 minutos (M5)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full space-y-2 md:space-y-4 pt-2 md:pt-4">
          <Button
            size="lg"
            className="w-full h-12 md:h-14 text-sm md:text-base font-black bg-primary text-primary-foreground shadow-2xl transition-all pulse-strong rounded-xl uppercase tracking-tighter"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 md:mr-3 md:h-5 md:w-5 animate-spin" /> : !isMarketOpen ? <Lock className="mr-2 h-4 w-4 md:mr-3 md:h-5 md:w-5" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-2 h-4 w-4 md:mr-3 md:h-5 md:w-5" /> : <BarChart className="mr-2 h-4 w-4 md:mr-3 md:h-5 md:w-5" />}
            {isLoading ? 'Analisando...' : !isMarketOpen ? 'Mercado Fechado' : (hasReachedLimit && !isPremium) || waitingMessage ? 'Aguardando Liberação' : 'Analisar Agora'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full flex-col h-auto text-purple-400 hover:text-purple-300 group py-1" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-4 w-4 md:h-5 md:w-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[0.5rem] md:text-[0.55rem] font-black uppercase tracking-[0.2em]">Acesso PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}
