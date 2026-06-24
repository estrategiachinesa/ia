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

const allAssets: Asset[] = ['EUR/JPY', 'EUR/JPY (OTC)', 'EUR/JPY', 'EUR/USD', 'EUR/USD (OTC)'];

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

  const isOtcAsset = formData.asset.includes('(OTC)');

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
    <div className="w-full h-full flex flex-col justify-start p-0 overflow-hidden text-center bg-transparent">
      <div className="flex flex-col flex-grow overflow-hidden px-4 md:px-6">
        
        {/* SELETORES (TOPO NO MOBILE) */}
        <div className="flex flex-col gap-3 py-4 shrink-0">
          {/* ATIVO */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">Ativo:</Label>
              <div className="flex items-center space-x-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                <Label htmlFor="otc-switch" className="text-[0.55rem] font-black text-muted-foreground uppercase">OTC</Label>
                <Switch id="otc-switch" checked={showOTC} onCheckedChange={setShowOTC} disabled={isLoading} className="scale-[0.55] origin-right" />
              </div>
            </div>
            <Select value={formData.asset} onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })} disabled={isLoading}>
              <SelectTrigger className="h-11 md:h-14 rounded-xl bg-white/5 border-white/10 hover-glow transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center gap-3 w-full">
                    <CurrencyFlags asset={formData.asset} />
                    <span className="font-black tracking-tight text-sm md:text-base uppercase">{formData.asset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset} className="rounded-lg focus:bg-primary focus:text-primary-foreground py-3 transition-colors">
                    <div className="flex items-center gap-3 w-full justify-center text-center">
                        <CurrencyFlags asset={asset} />
                        <span className="font-black text-sm uppercase">{asset}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* EXPIRAÇÃO */}
          <div className="space-y-1.5">
            <Label className="text-[0.6rem] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50 block text-left ml-1">Tempo:</Label>
            <Select value={formData.expirationTime} onValueChange={(value) => setFormData({ ...formData, expirationTime: value as ExpirationTime })} disabled={isLoading}>
              <SelectTrigger className="h-11 md:h-14 rounded-xl bg-white/5 border-white/10 hover-glow transition-all duration-300">
                <SelectValue asChild>
                  <div className="flex items-center justify-center w-full">
                    <span className="font-black text-sm md:text-base uppercase tracking-[0.1em]">
                        {formData.expirationTime === '1m' ? '1 MINUTO' : '5 MINUTOS'}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-black/95 backdrop-blur-2xl">
                <SelectItem value="1m" className="rounded-lg font-black py-3 text-sm uppercase text-center focus:bg-primary focus:text-primary-foreground transition-colors">1 MINUTO</SelectItem>
                <SelectItem value="5m" className="rounded-lg font-black py-3 text-sm uppercase text-center focus:bg-primary focus:text-primary-foreground transition-colors">5 MINUTOS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL */}
        <div className="w-full space-y-2 pb-4 shrink-0">
            <Button
                size="lg"
                className="w-full h-14 md:h-16 text-base md:text-lg font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/20 rounded-xl uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all duration-300 shine-effect"
                onClick={onSubmit}
                disabled={buttonDisabled}
            >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (!isMarketOpen && !showOTC) ? <Lock className="mr-2 h-5 w-5" /> : (hasReachedLimit && !isPremium) || waitingMessage ? <Timer className="mr-2 h-5 w-5" /> : <BarChart className="mr-2 h-5 w-5" />}
                {isLoading ? 'ANALISANDO...' : (!isMarketOpen && !showOTC) ? 'MERCADO FECHADO' : (hasReachedLimit && !isPremium) || waitingMessage ? 'EM FILA DE ESPERA' : 'ANALISAR AGORA'}
            </Button>
            {!isPremium && (
                <Button variant="link" className="w-full h-auto text-purple-400 py-0.5 hover:text-purple-300 transition-colors" onClick={() => {
                if (vipStatus) setVipModalOpen(true);
                else setUpgradeModalOpen(true);
                }}>
                    <Crown className="h-3 w-3 mr-1.5 animate-pulse" />
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.15em]">DESBLOQUEAR ACESSO PREMIUM</span>
                </Button>
            )}
        </div>

        {/* STATUS E INTEL */}
        <div className="space-y-4 pb-10 flex-grow">
            {!isMarketOpen && !showOTC && nextOpenText && (
                <div className="p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-between px-4 animate-in fade-in duration-700">
                    <div className="flex items-center gap-2">
                        <Circle className="h-2 w-2 fill-red-500 text-red-500 animate-pulse" />
                        <span className="text-[0.65rem] font-black text-red-500 uppercase">Mercado fechado</span>
                    </div>
                    <span className="text-xs text-white font-mono font-black">{nextOpenText}</span>
                </div>
            )}

            {waitingMessage && (
                <Alert className="text-center bg-primary/5 border-primary/20 py-2.5 rounded-xl">
                    <AlertDescription className="text-[0.65rem] font-black text-primary/80 uppercase flex items-center justify-center gap-2">
                    <Radio className="h-3 w-3 animate-pulse" /> {waitingMessage}
                    </AlertDescription>
                </Alert>
            )}

            <div className="hidden md:block">
                {showOTC ? <OtcIntelligence asset={formData.asset} /> : <EconomicIntelligence asset={formData.asset} />}
            </div>
            
            <div className="md:hidden h-[180px]">
                {!isOtcAsset && <EconomicIntelligence asset={formData.asset} />}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <Button asChild variant="ghost" size="sm" className="h-10 text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover-glow">
                    <a href={config?.iqOptionOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3 w-3" /> IQ Option</a>
                </Button>
                <Button asChild variant="ghost" size="sm" className="h-10 text-[0.6rem] font-black uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover-glow">
                    <a href={config?.exnovaOpenUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Exnova</a>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
