'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GhostDescubraPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleFirstMove = () => {
      setIsRedirecting(true);
      router.replace('/descubra');
      // Remove o listener após o primeiro movimento para evitar múltiplos redirecionamentos
      window.removeEventListener('mousemove', handleFirstMove);
      window.removeEventListener('touchstart', handleFirstMove);
    };

    // Adiciona listeners para movimento do rato e toque em dispositivos móveis
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
      <p className="mt-4 text-lg font-semibold">A carregar a sua experiência...</p>
    </div>
  );
}
