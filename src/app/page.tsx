
'use client';

import { useEffect } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { Loader2 } from 'lucide-react';
import { useAppConfig } from '@/firebase/config-provider';

export default function HomePage() {
  const router = useAffiliateRouter();
  const { affiliateId } = useAppConfig();

  useEffect(() => {
    // Check for `null` to know when the provider has determined the ID state.
    // `undefined` might mean it's still loading.
    if (affiliateId !== undefined) {
      router.replace('/demo');
    }
  }, [router, affiliateId]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Redirecionando...</p>
    </div>
  );
}
