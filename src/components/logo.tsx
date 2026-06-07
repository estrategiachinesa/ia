'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export const Logo = ({ className, showText = true, size = 50 }: LogoProps) => {
  const logoData = (PlaceHolderImages || []).find(img => img.id === 'app-logo');
  const logoSrc = logoData?.imageUrl || "https://64.media.tumblr.com/7a6cdcb5842a7c945879bfe4866998b3/d4f22ded93d2836f-ba/s1280x1920/a1bca9f23b071d3bc24a95cf6ddd9a69454b4d78.pnj";

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
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
          <span className="text-xl font-black font-headline tracking-tighter leading-tight text-white">
            ESTRATÉGIA <span className="text-primary">CHINESA</span>
          </span>
          <span className="text-[0.5rem] font-bold tracking-[0.3em] uppercase opacity-40 -mt-1">Inteligência Artificial</span>
        </div>
      )}
    </div>
  );
};
