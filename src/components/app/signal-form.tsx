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
import { cn } from '@/lib/utils';

/**
 * Widget de Calendário Económico ultra-simplificado (Hora, Moeda, Touros).
 * Oculto em modo OTC.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-2 rounded-xl overflow-hidden border border-white/5 bg-black/40 shadow-xl animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="px-2 py-1 bg-white/5 border-b border-white/5 flex items-center justify-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
        <span className="text-[0.45rem] font-black text-muted-foreground uppercase tracking-widest">Impact Stream</span>
      </div>
      
      <div className="h-[90px] w-full overflow-hidden relative bg-[#0a0a0a]">
         <div className="relative w-[150%] left-[-5px] top-[-115px]">
            <iframe 
              src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance&importance=1,2,3&countries=${countries}&calType=day&timeZone=12&lang=12`} 
              width="100%" 
              height="800" 
              frameBorder="0" 
              allowTransparency={true}
              className="filter invert hue-rotate-180 brightness-[0.8] contrast-[1.3] saturate-[0.7] origin-top-left scale-[1.1]"
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
    <div className="w-full h-full flex flex-col justify-between p-0 overflow-hidden">
      <div className="flex flex-col gap-3 flex-grow overflow-hidden">
        {/* BOTÕES CORRETORA CENTRALIZADOS */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
            <Button asChild variant="ghost" size="sm" className="h-10 md:h-12 text-[0.55rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-lg hover:bg-primary/20 hover:border-primary transition-all duration-300">
                <a href={config?.iqOptionOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3 w-3" /> IQ Option</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-10 md:h-12 text-[0.55rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-lg hover:bg-primary/20 hover:border-primary transition-all duration-300">
                <a href={config?.exnovaOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3 w-3" /> Exnova</a>
            </Button>
        </div>

        {/* NOTICIAS (OCULTAS EM OTC) */}
        {!showOTC && (
            <div className="shrink-0">
                <EconomicCalendarWidget asset={formData.asset} />
            </div>
        )}

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-1.5 rounded-lg shrink-0">
                <AlertDescription className="text-[0.55rem] font-black text-primary/80 uppercase">{waitingMessage}</AlertDescription>
            </Alert>
        )}

        <div className="space-y-4 flex-grow overflow-y-auto no-scrollbar flex flex-col justify-center">
          {/* SELETOR ATIVO CENTRALIZADO */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Ativo Operacional:</Label>
              <div className="flex items-center space-x-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.45rem] font-black text-muted-foreground uppercase opacity-70">Modo OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.5] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-11 md:h-14 rounded-xl bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center gap-3 w-full">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-black tracking-tight text-[0.75rem] md:text-sm uppercase">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-lg focus:bg-primary/20 py-3">
                    <div className="flex items-center gap-3"><CurrencyFlags asset={asset} /><span className="font-black text-[0.65rem] uppercase">{asset}</span></div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SELETOR EXPIRAÇÃO CENTRALIZADO */}
          <div className="space-y-1.5">
            <Label className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-widest opacity-60 px-1">Tempo de Expiração:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-11 md:h-14 rounded-xl bg-white/5 border-white/10 text-[0.75rem] font-black uppercase text-center hover:border-primary/50 hover:bg-white/10 transition-all duration-300">
                <SelectValue placeholder="Tempo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                <SelectItem value="1m" className="rounded-lg font-black py-3 text-[0.65rem] uppercase">M1 (1 Minuto)</SelectItem>
                <SelectItem value="5m" className="rounded-lg font-black py-3 text-[0.65rem] uppercase">M5 (5 Minutos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2 pt-3 shrink-0">
          <Button
            size="lg"
            className="w-full h-14 md:h-16 text-sm md:text-lg font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-xl uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all duration-300"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (!isMarketOpen && !showOTC) ? <Lock className="mr-2 h-5 w-5" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-2 h-5 w-5" /> : <BarChart className="mr-2 h-5 w-5" />}
            {isLoading ? 'A PROCESSAR...' : (!isMarketOpen && !showOTC) ? 'MERCADO FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'ACESSO BLOQUEADO' : 'ANALISAR AGORA'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full h-auto text-purple-400 py-1 hover:text-purple-300 transition-colors" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-3 w-3 mr-1.5 animate-pulse" />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.15em]">DESBLOQUEAR ACESSO PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}
