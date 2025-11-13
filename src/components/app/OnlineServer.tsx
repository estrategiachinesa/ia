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
    }, 2000);
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

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className="flex items-center gap-2 select-none cursor-pointer rounded-full p-2"
    >
      <span className="relative flex h-3 w-3">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75',
            (isHolding || isActivated) && 'animate-ping'
          )}
        ></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
      </span>
      <span className="text-xs font-semibold text-foreground/80">
        {isActivated ? 'Market' : 'Online'}
      </span>
    </button>
  );
}
