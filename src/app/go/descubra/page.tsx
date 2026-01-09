'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GhostDescubraPage() {
  const router = useRouter();

  useEffect(() => {
    const handleFirstMove = () => {
      router.replace('/descubra');
      window.removeEventListener('mousemove', handleFirstMove);
      window.removeEventListener('touchstart', handleFirstMove);
    };

    window.addEventListener('mousemove', handleFirstMove, { once: true });
    window.addEventListener('touchstart', handleFirstMove, { once: true });

    return () => {
      window.removeEventListener('mousemove', handleFirstMove);
      window.removeEventListener('touchstart', handleFirstMove);
    };
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
