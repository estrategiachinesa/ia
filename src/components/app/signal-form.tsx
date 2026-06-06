'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Loader2, Lock, Timer, Crown, ExternalLink, Radio, Circle, Zap } from 'lucide-react';
import { CurrencyFlags } from './currency-flags';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Asset, ExpirationTime } from '@/app/analisador/page';
import { useAppConfig } from '@/firebase';
import { Firestore } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { getNextOpeningTime } from '@/lib/market-hours';

/**
 * Widget de Calendário Económico ultra-clean: apenas Hora, Moeda e Touros.
 * Altura aumentada para 180px para preencher melhor a tela mobile.
 */
function EconomicCalendarWidget({ asset }: { asset: string }) {
  const isEurUsd = asset.includes('EUR/USD');
  const isEurJpy = asset.includes('EUR/JPY');

  let countries = "5,72,35"; 
  if (isEurUsd) countries = "5,72";
  else if (isEurJpy) countries = "72,35";

  return (
    <div className="w-full mb-1 rounded-xl overflow-hidden border border-white/5 bg-black/40 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="px-2 py-1 bg-white/5 border-b border-white/5 flex items-center justify-center gap-1.5">
        <Zap className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-[0.5rem] font-black text-muted-foreground uppercase tracking-[0.2em]">Impact Stream</span>
      </div>
      
      <div className="h-[180px] w-full overflow-hidden relative bg-[#0a0a0a]">
         <div className="relative w-[180%] left-[-15px] top-[-118px]">
            <iframe 
              src={`https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance&importance=2,3&features=timezone&countries=${countries}&calType=day&timeZone=12&lang=12`} 
              width="100%" 
              height="800" 
              frameBorder="0" 
              allowTransparency={true}
              className="filter invert hue-rotate-180 brightness-[0.75] contrast-[1.4] saturate-[0.8] origin-top-left scale-[1.05]"
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
  const [nextOpenText, setNextOpenText] = useState('');

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

  useEffect(() => {
    if (isMarketOpen || showOTC) {
        setNextOpenText('');
        return;
    }

    const updateTimer = () => {
        const nextOpen = getNextOpeningTime(formData.asset);
        if (!nextOpen) {
            setNextOpenText('Horário Indisponível');
            return;
        }

        const now = new Date();
        const diff = nextOpen.getTime() - now.getTime();
        
        if (diff <= 0) {
            setNextOpenText('Abrindo...');
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setNextOpenText(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isMarketOpen, showOTC, formData.asset]);

  const buttonDisabled = isLoading || (!isMarketOpen && !showOTC) || (hasReachedLimit && !waitingMessage && !isPremium);

  return (
    <div className="w-full h-full flex flex-col justify-between p-0 overflow-hidden text-center bg-black/20">
      <div className="flex flex-col gap-2 flex-grow overflow-hidden">
        
        {/* BOTÕES CORRETORA */}
        <div className="grid grid-cols-2 gap-2 shrink-0 px-4 pt-2">
            <Button asChild variant="ghost" size="sm" className="h-9 md:h-10 text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover-glow transition-all duration-300">
                <a href={config?.iqOptionOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> IQ Option</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-9 md:h-10 text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover-glow transition-all duration-300">
                <a href={config?.exnovaOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Exnova</a>
            </Button>
        </div>

        {/* NOTICIAS - CENTRALIZADO E OCULTO EM OTC */}
        {!showOTC && (
            <div className="shrink-0 px-4">
                <EconomicCalendarWidget asset={formData.asset} />
            </div>
        )}

        {/* STATUS MERCADO FECHADO - IQ OPTION STYLE */}
        {!isMarketOpen && !showOTC && nextOpenText && (
            <div className="mx-4 p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-4 animate-in fade-in duration-500">
                <div className="flex items-center gap-2">
                    <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500 animate-pulse" />
                    <span className="text-[0.7rem] font-black text-red-500 uppercase tracking-tight">Mercado fechado</span>
                </div>
                <span className="text-[0.7rem] font-bold text-zinc-400 uppercase tracking-tighter">
                    Abre em <span className="text-white font-mono">{nextOpenText}</span>
                </span>
            </div>
        )}

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-2 rounded-xl mx-4 shrink-0">
                <AlertDescription className="text-[0.6rem] font-black text-primary/80 uppercase flex items-center justify-center gap-2">
                  <Radio className="h-3.5 w-3.5 animate-pulse" /> {waitingMessage}
                </AlertDescription>
            </Alert>
        )}

        <div className="space-y-4 flex-grow flex flex-col justify-center px-6">
          {/* ATIVO */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Par de Moedas:</Label>
              <div className="flex items-center space-x-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.5rem] font-black text-muted-foreground uppercase opacity-70">OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.6] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-11 md:h-12 rounded-xl bg-white/5 border-white/10 hover-glow transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center gap-3 w-full">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-black tracking-tight text-[0.85rem] md:text-sm uppercase">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-lg focus:bg-primary/20 py-3">
                    <div className="flex items-center gap-3 w-full justify-center">
                        <CurrencyFlags asset={asset} />
                        <span className="font-black text-[0.75rem] uppercase">{asset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EXPIRAÇÃO */}
          <div className="space-y-2">
            <Label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60">Tempo de Expiração:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-11 md:h-12 rounded-xl bg-white/5 border-white/10 text-[0.85rem] font-black uppercase text-center hover-glow transition-all duration-300">
                <SelectValue placeholder="Tempo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                <SelectItem value="1m" className="rounded-lg font-black py-3 text-[0.75rem] uppercase text-center">M1 (60 Segundos)</SelectItem>
                <SelectItem value="5m" className="rounded-lg font-black py-3 text-[0.75rem] uppercase text-center">M5 (5 Minutos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2 pt-2 pb-6 shrink-0 px-6">
          <Button
            size="lg"
            className="w-full h-13 md:h-14 text-sm md:text-base font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-xl uppercase tracking-tighter hover:scale-[1.02] hover:shadow-primary/40 active:scale-95 transition-all duration-300 shine-effect"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (!isMarketOpen && !showOTC) ? <Lock className="mr-2 h-5 w-5" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-2 h-5 w-5" /> : <BarChart className="mr-2 h-5 w-5" />}
            {isLoading ? 'ANALISANDO...' : (!isMarketOpen && !showOTC) ? 'MERCADO FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'ACESSO BLOQUEADO' : 'ANALISAR AGORA'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full h-auto text-purple-400 py-1 hover:text-purple-300 transition-colors" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-3.5 w-3.5 mr-2 animate-pulse" />
                <span className="text-[0.65rem] font-black uppercase tracking-widest">DESBLOQUEAR ACESSO PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}