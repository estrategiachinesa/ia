'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GhostVipPage() {
  const router = useRouter();

  useEffect(() => {
    const handleFirstMove = () => {
      router.replace('/vip');
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

  return null;
}
