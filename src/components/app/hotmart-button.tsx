
'use client';

import { useAppConfig } from '@/firebase';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type HotmartButtonProps = {
  className?: string;
  url: string;
};

export const HotmartButton = ({ className, url }: HotmartButtonProps) => {
  const { affiliateId } = useAppConfig();
  let finalUrl = url;

  // This logic is simplified to prioritize the provided URL but still adds afftrack if needed.
  if (affiliateId && !finalUrl.includes('afftrack=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}afftrack=${affiliateId}`;
  }

  return (
    <a href={finalUrl} className={cn('block w-fit mx-auto', className)}>
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
