'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

type OnlineServerProps = {
  isActivated: boolean;
  onToggle: () => void;
};

export function OnlineServer({ isActivated, onToggle }: OnlineServerProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      onToggle();
      setIsHolding(false);
    }, 3000);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isHolding) {
      handleMouseUp();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ç') {
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onToggle, isHolding]);

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className="flex items-center gap-2 select-none cursor-pointer"
    >
      <span className="relative flex h-3 w-3">
        <span
          className={cn(
            isActivated && 'animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'
          )}
        ></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
      </span>
      <span className="text-sm font-semibold tracking-widest text-white">
        SISTEMA ONLINE
      </span>
    </button>
  );
}
