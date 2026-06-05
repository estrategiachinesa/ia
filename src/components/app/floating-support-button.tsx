'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppConfig } from '@/firebase/config-provider';
import { Headset } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingSupportButton() {
  const { config } = useAppConfig();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize position at center-right on load
  useEffect(() => {
    const updatePosition = () => {
        // Position at the right edge, vertically centered
        const initialX = window.innerWidth - 65; 
        const initialY = (window.innerHeight / 2) - 25;
        setPosition({ x: initialX, y: initialY });
    };

    updatePosition();
    
    // Handle window resize to keep it visible
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
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
      
      const newPos = { x: newX, y: newY };
      setPosition(newPos);
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
  }, [isDragging, rel, position]);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
        e.preventDefault();
        return;
    }
  };

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
        "fixed z-[100] cursor-grab active:cursor-grabbing select-none transition-opacity duration-300",
        isDragging ? "opacity-100 scale-110" : "opacity-70 hover:opacity-100"
      )}
    >
      <a
        href={supportLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center gap-2 p-2.5 rounded-full shadow-xl transition-all group overflow-hidden border border-white/10",
          "bg-[#229ED9]/40 backdrop-blur-md text-white"
        )}
      >
        <Headset className="h-5 w-5" />
        <span className={cn(
            "max-w-0 overflow-hidden transition-all duration-500 font-black whitespace-nowrap text-[0.6rem] uppercase tracking-widest",
            "group-hover:max-w-xs group-hover:ml-1.5"
        )}>
          SUPORTE
        </span>
      </a>
    </div>
  );
}
