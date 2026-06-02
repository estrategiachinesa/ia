'use client';

import { useAppConfig } from '@/firebase';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type HotmartButtonProps = {
  className?: string;
  url: string;
};

export const HotmartButton = ({ className, url }: HotmartButtonProps) => {
  const { affiliateId, trackCheckoutClick } = useAppConfig();
  let finalUrl = url;

  if (affiliateId && !finalUrl.includes('afftrack=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}afftrack=${affiliateId}`;
  }

  const handleClick = () => {
    trackCheckoutClick();
  };

  return (
    <a 
      href={finalUrl} 
      onClick={handleClick}
      className={cn('block w-fit mx-auto transition-transform hover:scale-105 active:scale-95', className)}
    >
      <Image
        src="https://static.hotmart.com/img/btn-buy-green.png"
        alt="Comprar agora"
        width={300}
        height={56}
        priority
        unoptimized
      />
    </a>
  );
};