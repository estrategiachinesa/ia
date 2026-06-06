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
import { getNextOpeningTime, isMarketOpenForAsset } from '@/lib/market-hours';
import { EconomicIntelligence } from './economic-intelligence';
import { OtcIntelligence } from './otc-intelligence';

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
  isMarketOpen: initialMarketOpen,
  hasReachedLimit,
  isPremium,
  vipStatus,
  setVipModalOpen,
  setUpgradeModalOpen,
}: SignalFormProps) {
  const { config } = useAppConfig();
  const [waitingMessage, setWaitingMessage] = useState('');
  const [nextOpenText, setNextOpenText] = useState('');
  const [isMarketOpen, setIsMarketOpen] = useState(initialMarketOpen);

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
    const updateMarketStatus = () => {
        const open = isMarketOpenForAsset(formData.asset, config?.marketSchedules);
        setIsMarketOpen(open);
        
        if (open || showOTC) {
            setNextOpenText('');
            return;
        }

        const nextOpen = getNextOpeningTime(formData.asset, config?.marketSchedules);
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

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 1000);
    return () => clearInterval(interval);
  }, [showOTC, formData.asset, config?.marketSchedules]);

  const buttonDisabled = isLoading || (!isMarketOpen && !showOTC) || (hasReachedLimit && !waitingMessage && !isPremium);

  return (
    <div className="w-full h-full flex flex-col justify-between p-0 overflow-hidden text-center bg-black/20">
      <div className="flex flex-col flex-grow overflow-hidden">
        
        {/* BOTÕES CORRETORA */}
        <div className="grid grid-cols-2 gap-2 shrink-0 px-4 pt-4 mb-2 md:mb-4">
            <Button asChild variant="ghost" size="sm" className="h-10 md:h-12 text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover-glow transition-all duration-300">
                <a href={config?.iqOptionOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2"><ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" /> IQ Option</a>
            </Button>
            <Button asChild variant="ghost" size="sm" className="h-10 md:h-12 text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover-glow transition-all duration-300">
                <a href={config?.exnovaOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2"><ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" /> Exnova</a>
            </Button>
        </div>

        {/* INTEL PANEL (DINÂMICO) */}
        <div className="shrink-0 px-4 mb-2 md:mb-4">
            {showOTC ? <OtcIntelligence asset={formData.asset} /> : <EconomicIntelligence asset={formData.asset} />}
        </div>

        {/* STATUS MERCADO FECHADO */}
        {!isMarketOpen && !showOTC && nextOpenText && (
            <div className="mx-4 mb-2 md:mb-4 p-2 md:p-3 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-between px-4 md:px-6 animate-in fade-in duration-700">
                <div className="flex items-center gap-2">
                    <Circle className="h-2 w-2 md:h-3 md:w-3 fill-red-500 text-red-500 animate-pulse" />
                    <span className="text-[0.65rem] md:text-xs font-black text-red-500 uppercase tracking-widest">Mercado fechado</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[0.55rem] md:text-[0.65rem] font-bold text-zinc-500 uppercase tracking-tighter">Abre em</span>
                    <span className="text-xs md:text-sm text-white font-mono font-black">{nextOpenText}</span>
                </div>
            </div>
        )}

        {waitingMessage && (
            <Alert className="text-center bg-primary/5 border-primary/20 py-2 md:py-3 rounded-xl mx-4 mb-2 md:mb-4 shrink-0">
                <AlertDescription className="text-[0.65rem] md:text-[0.7rem] font-black text-primary/80 uppercase flex items-center justify-center gap-2 md:gap-3">
                  <Radio className="h-3 w-3 md:h-4 md:w-4 animate-pulse" /> {waitingMessage}
                </AlertDescription>
            </Alert>
        )}

        {/* SELETORES */}
        <div className={cn(
            "flex flex-col px-4 md:px-6",
            showOTC ? "justify-center flex-grow gap-4 md:gap-8" : "justify-start gap-3 md:gap-6"
        )}>
          {/* ATIVO */}
          <div className="space-y-1.5 md:space-y-3">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.55rem] md:text-[0.65rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Par de Moedas:</Label>
              <div className="flex items-center space-x-1.5 bg-black/40 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.45rem] md:text-[0.55rem] font-black text-muted-foreground uppercase">OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.5] md:scale-[0.65] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-10 md:h-14 rounded-xl bg-white/5 border-white/10 hover-glow transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center gap-2 md:gap-3 w-full">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-black tracking-tight text-xs md:text-base uppercase">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-lg focus:bg-primary focus:text-primary-foreground py-3 md:py-4 transition-colors">
                    <div className="flex items-center gap-3 md:gap-4 w-full justify-center text-center">
                        <CurrencyFlags asset={asset} />
                        <span className="font-black text-xs md:text-sm uppercase">{asset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EXPIRAÇÃO */}
          <div className="space-y-1.5 md:space-y-3">
            <Label className="text-[0.55rem] md:text-[0.65rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Tempo de Expiração:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-10 md:h-14 rounded-xl bg-white/5 border-white/10 hover-glow transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center w-full">
                    <span className="font-black text-xs md:text-base uppercase tracking-[0.1em]">
                        {formData.expirationTime === '1m' ? '1 MINUTO' : 'M5 (5 MINUTOS)'}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                <SelectItem value="1m" className="rounded-lg font-black py-3 md:py-4 text-xs md:text-sm uppercase text-center focus:bg-primary focus:text-primary-foreground transition-colors">1 MINUTO</SelectItem>
                <SelectItem value="5m" className="rounded-lg font-black py-3 md:py-4 text-xs md:text-sm uppercase text-center focus:bg-primary focus:text-primary-foreground transition-colors">M5 (5 MINUTOS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* BOTÃO PRINCIPAL */}
      <div className="w-full space-y-2 md:space-y-3 pt-3 md:pt-4 pb-6 md:pb-8 shrink-0 px-4 md:px-6 bg-gradient-to-t from-black/40 to-transparent">
          <Button
            size="lg"
            className="w-full h-12 md:h-16 text-sm md:text-lg font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-xl uppercase tracking-tighter hover:scale-[1.02] hover:shadow-primary/40 active:scale-95 transition-all duration-300 shine-effect"
            onClick={onSubmit}
            disabled={buttonDisabled}
          >
            {isLoading ? <Loader2 className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 animate-spin" /> : (!isMarketOpen && !showOTC) ? <Lock className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" /> : <BarChart className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />}
            {isLoading ? 'ANALISANDO...' : (!isMarketOpen && !showOTC) ? 'MERCADO FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'ACESSO BLOQUEADO' : 'ANALISAR AGORA'}
          </Button>
          {!isPremium && (
            <Button variant="link" className="w-full h-auto text-purple-400 py-0.5 md:py-1 hover:text-purple-300 transition-colors" onClick={() => {
              if (vipStatus) setVipModalOpen(true);
              else setUpgradeModalOpen(true);
            }}>
                <Crown className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 animate-pulse" />
                <span className="text-[0.6rem] md:text-[0.7rem] font-black uppercase tracking-[0.15em]">DESBLOQUEAR ACESSO PREMIUM</span>
            </Button>
          )}
      </div>
    </div>
  );
}
