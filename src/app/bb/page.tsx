'use client';

import { useEffect } from 'react';
import { BrokerBugSimulator } from '@/components/broker-bug-simulator';
import { useAppConfig } from '@/firebase/config-provider';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BrokerPage() {
  const { config, isConfigLoading } = useAppConfig();
  const router = useAffiliateRouter();

  useEffect(() => {
    if (!isConfigLoading && config?.pages?.bb === false) {
      router.replace('/');
    }
  }, [config, isConfigLoading, router]);

  if (isConfigLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (config?.pages?.bb === false) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-black p-6">
            <div className="text-center space-y-4 animate-in fade-in duration-500">
                <AlertTriangle className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <h2 className="text-xl font-black uppercase text-white">Ferramenta Offline</h2>
                <p className="text-sm text-muted-foreground">Redirecionando...</p>
                <Button variant="outline" onClick={() => router.replace('/')}>Voltar ao Início</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-700">
        <BrokerBugSimulator />
    </div>
  );
}
