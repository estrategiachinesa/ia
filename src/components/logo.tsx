
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
  isPremium?: boolean;
}

export const Logo = ({ className, showText = true, size = 45, isPremium = false }: LogoProps) => {
  const logoId = isPremium ? 'premium-logo' : 'app-logo';
  const logoData = (PlaceHolderImages || []).find(img => img.id === logoId);
  
  // URLs de fallback caso o JSON falhe
  const defaultLogo = isPremium 
    ? "https://64.media.tumblr.com/20f22b5ead0b32442eabcf709e99d4d2/e5e4f321477c6743-63/s1280x1920/1c547ddd7dfe6f9075d19dfedb72a115a1a4c78b.pnj"
    : "https://64.media.tumblr.com/7a6cdcb5842a7c945879bfe4866998b3/d4f22ded93d2836f-ba/s1280x1920/a1bca9f23b071d3bc24a95cf6ddd9a69454b4d78.pnj";
    
  const logoSrc = logoData?.imageUrl || defaultLogo;

  return (
    <div className={cn("flex items-center gap-2 md:gap-3 select-none", className)}>
      <div className="relative flex items-center justify-center shrink-0">
        <Image 
          src={logoSrc}
          alt={isPremium ? "Estratégia Chinesa Premium Logo" : "Estratégia Chinesa Logo"}
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
            <span className={cn(
                "ml-1.5 transition-colors duration-500", 
                isPremium ? "text-[#9333EA]" : "text-primary"
            )}>CHINESA</span>
          </h1>
        </div>
      )}
    </div>
  );
};
