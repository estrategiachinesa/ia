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
 * Widget de Calendário Económico ultra-focado e expandido para Mobile.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  if (asset.includes('(OTC)')) return null;

  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-4 md:mb-6 rounded-2xl overflow-hidden border border-white/5 bg-black/40 shadow-2xl animate-in fade-in duration-500">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest">Live Volatility</span>
        </div>
        <div className="flex items-center gap-3 text-[0.5rem] font-bold text-muted-foreground/40 uppercase">
            <span>Hora</span>
            <span>Ativo</span>
            <span>Imp</span>
        </div>
      </div>
      
      <div className="h-[240px] md:h-[180px] w-full overflow-hidden relative bg-[#0a0a0a]">
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
    <div className="w-full h-full flex flex-col justify-between text-center p-1 md:p-0">
      <div className="space-y-6 md:space-y-6">
        <div className="grid grid-cols-2 gap-4 mb-2">
            <Button asChild variant="ghost" size="sm" className="h-12 md:h-10 text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <a href={config?.iqOptionUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" /> IQ Option</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-12 md:h-10 text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                <a href={config?.exnovaUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" /> Exnova</a>
            </Button>
        </div>

        <EconomicCalendarWidget asset={formData.asset} />

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-3 rounded-2xl">
                <Timer className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs font-bold text-primary/80">{waitingMessage}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Ativo Selecionado:</Label>
              <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.55rem] font-black text-muted-foreground uppercase tracking-widest opacity-50">OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.5] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-14 md:h-14 text-sm rounded-2xl bg-white/5 border-white/5 hover:bg-white/10 transition-all">
                <SelectValue asChild>
                  <div className="flex items-center gap-3">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-bold tracking-tight">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-xl focus:bg-primary/20 focus:text-white py-4">
                    <div className="flex items-center gap-3"><CurrencyFlags asset={asset} /><span className="font-bold">{asset}</span></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-[0.65rem] font-black text-muted-foreground uppercase tracking-widest opacity-60 px-1">Tempo de Expiração:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-14 md:h-14 text-sm rounded-2xl bg-white/5 border-white/5 hover:bg-white/10 transition-all">
                <SelectValue placeholder="Selecione o Tempo" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl">
                <SelectItem value="1m" className="rounded-xl font-bold py-4">1 minuto (M1)</SelectItem>
                <SelectItem value="5m" className="rounded-xl font-bold py-4">5 minutos (M5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 pt-8">
          <Button
            size="lg"
            className="w-full h-16 md:h-16 text-base md:text-lg font-black bg-primary text-primary-foreground shadow-2xl transition-all pulse-strong rounded-2xl uppercase tracking-tighter"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : !isMarketOpen ? <Lock className="mr-3 h-6 w-6" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-3 h-6 w-6" /> : <BarChart className="mr-3 h-6 w-6" />}
            {isLoading ? 'ANALISANDO MERCADO...' : !isMarketOpen ? 'MERCADO FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'AGUARDANDO LIBERAÇÃO' : 'ANALISAR AGORA'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full flex-col h-auto text-purple-400 hover:text-purple-300 group py-2" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.2em]">DESBLOQUEAR ACESSO PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}
