'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppConfig } from '@/firebase/config-provider';
import { Headset, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingSupportButton() {
  const { config } = useAppConfig();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize position based on device
  useEffect(() => {
    const updatePosition = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            // Top left for mobile as requested, but slightly offset to not cover logo
            setPosition({ x: 10, y: 75 }); 
        } else {
            // Center right for desktop
            const initialX = window.innerWidth - 60; 
            const initialY = (window.innerHeight / 2) - 25;
            setPosition({ x: initialX, y: initialY });
        }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target instanceof SVGElement || (e.target as HTMLElement).closest('.close-btn')) return;
    
    if (e.type === 'touchstart') {
        const touch = (e as React.TouchEvent).touches[0];
        setRel({
            x: touch.pageX - position.x,
            y: touch.pageY - position.y
        });
    } else {
        setRel({
            x: (e as React.MouseEvent).pageX - position.x,
            y: (e as React.MouseEvent).pageY - position.y
        });
    }
    setIsDragging(true);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      let pageX, pageY;
      if (e instanceof TouchEvent) {
          pageX = e.touches[0].pageX;
          pageY = e.touches[0].pageY;
      } else {
          pageX = e.pageX;
          pageY = e.pageY;
      }

      const newX = Math.min(Math.max(5, pageX - rel.x), window.innerWidth - 55);
      const newY = Math.min(Math.max(5, pageY - rel.y), window.innerHeight - 55);
      
      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onMouseMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, rel]);

  if (!isVisible) return null;

  const supportLink = config?.supportUrl || 'https://t.me/TraderChinesVIP';

  return (
    <div
      ref={buttonRef}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      className={cn(
        "fixed z-[100] cursor-grab active:cursor-grabbing select-none transition-all duration-300",
        isDragging ? "opacity-100 scale-110" : "opacity-50 hover:opacity-100"
      )}
    >
      <div className="relative group/wrapper">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="close-btn absolute -top-2 -right-1 bg-black/80 text-white rounded-full p-0.5 border border-white/20 opacity-0 group-hover/wrapper:opacity-100 transition-opacity z-10"
        >
          <X className="h-2.5 w-2.5" />
        </button>
        
        <a
          href={supportLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center justify-center gap-2 p-2 rounded-full shadow-xl transition-all group overflow-hidden border border-white/10",
            "bg-[#229ED9]/30 backdrop-blur-md text-white"
          )}
        >
          <Headset className="h-3.5 w-3.5 md:h-5 md:w-5" />
          <span className={cn(
              "max-w-0 overflow-hidden transition-all duration-500 font-black whitespace-nowrap text-[0.55rem] uppercase tracking-widest",
              "group-hover:max-w-xs group-hover:ml-1"
          )}>
            SUPORTE
          </span>
        </a>
      </div>
    </div>
  );
}
