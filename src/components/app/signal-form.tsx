'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Loader2, Lock } from 'lucide-react';
import type { FormData, Asset } from '@/app/analisador/page';
import { CurrencyFlags } from './currency-flags';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';

type SignalFormProps = {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  showOTC: boolean;
  setShowOTC: (show: boolean) => void;
  isMarketOpen: boolean;
};

const allAssets: Asset[] = [
  'EUR/JPY', 'EUR/JPY (OTC)',
  'EUR/USD', 'EUR/USD (OTC)',
];


export function SignalForm({ formData, setFormData, onSubmit, isLoading, showOTC, setShowOTC, isMarketOpen }: SignalFormProps) {
  
  const assets = showOTC ? allAssets : allAssets.filter(a => !a.includes('(OTC)'));

  useEffect(() => {
    // If OTC is turned off and an OTC asset is selected, reset to a default non-OTC asset
    if (!showOTC && formData.asset.includes('(OTC)')) {
      setFormData({ ...formData, asset: 'EUR/JPY' });
    } else if (showOTC && !formData.asset.includes('(OTC)')) {
        // Optional: switch to the OTC version of the current asset if available
        const otcVersion = `${formData.asset} (OTC)` as Asset;
        if (allAssets.includes(otcVersion)) {
            // setFormData({ ...formData, asset: otcVersion });
        }
    }
  }, [showOTC, formData, setFormData]);

  
  return (
    <div className="w-full space-y-8 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
          ESTRATÉGIA<br />CHINESA
        </h1>
        <p className="mt-4 text-lg text-foreground/80">
          Escolha o ativo e o tempo de expiração para receber sinais automáticos em tempo real.
        </p>
      </div>

      <div className="space-y-4 text-left">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="asset-select">Ativo:</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="otc-switch" className="text-xs text-muted-foreground">
                exibir (OTC)
              </Label>
              <Switch
                id="otc-switch"
                checked={showOTC}
                onCheckedChange={setShowOTC}
                disabled={isLoading}
              />
            </div>
          </div>
          <Select
            value={formData.asset}
            onValueChange={(value) => setFormData({ ...formData, asset: value as Asset })}
            disabled={isLoading}
          >
            <SelectTrigger className="h-12 text-base" id="asset-select">
              <SelectValue asChild>
                  <div className="flex items-center gap-2">
                      <CurrencyFlags asset={formData.asset} />
                      <span>{formData.asset}</span>
                  </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {assets.map(asset => (
                <SelectItem key={asset} value={asset}>
                   <div className="flex items-center gap-2">
                      <CurrencyFlags asset={asset} />
                      <span>{asset}</span>
                  </div>
              </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiration-select">Tempo de expiração:</Label>
          <Select
            value={formData.expirationTime}
            onValueChange={(value) => setFormData({ ...formData, expirationTime: value as '1m' | '5m' })}
            disabled={isLoading}
          >
            <SelectTrigger className="h-12 text-base" id="expiration-select">
              <SelectValue placeholder="Selecione o Tempo de Expiração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 minuto (1m)</SelectItem>
              <SelectItem value="5m">5 minutos (5m)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-primary-foreground"
        onClick={onSubmit}
        disabled={isLoading || !isMarketOpen}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : !isMarketOpen ? (
          <Lock className="mr-2 h-5 w-5" />
        ) : (
          <BarChart className="mr-2 h-5 w-5" />
        )}
        {isLoading ? 'Analisando...' : !isMarketOpen ? 'Mercado Fechado' : 'Analisar Mercado'}
      </Button>
    </div>
  );
}
