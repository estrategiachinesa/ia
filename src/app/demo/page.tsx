'use client';

import { useEffect } from 'react';
import { useAffiliateRouter } from '@/hooks/use-affiliate-router';
import { Loader2 } from 'lucide-react';

export default function DemoPage() {
  const router = useAffiliateRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Redirecionando...</p>
    </div>
  );
}
