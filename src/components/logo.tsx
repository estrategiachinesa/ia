'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export const Logo = ({ className, showText = true, size = 45 }: LogoProps) => {
  const logoData = (PlaceHolderImages || []).find(img => img.id === 'app-logo');
  const logoSrc = logoData?.imageUrl || "https://64.media.tumblr.com/7a6cdcb5842a7c945879bfe4866998b3/d4f22ded93d2836f-ba/s1280x1920/a1bca9f23b071d3bc24a95cf6ddd9a69454b4d78.pnj";

  return (
    <div className={cn("flex items-center gap-2 md:gap-3 select-none", className)}>
      <div className="relative flex items-center justify-center shrink-0">
        <Image 
          src={logoSrc}
          alt="Estratégia Chinesa Logo"
          width={size}
          height={size}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className="text-base md:text-xl font-black font-headline tracking-tighter leading-tight italic">
            <span className="text-white">ESTRATÉGIA</span>
            <span className="text-primary ml-1.5">CHINESA</span>
          </h1>
        </div>
      )}
    </div>
  );
};
