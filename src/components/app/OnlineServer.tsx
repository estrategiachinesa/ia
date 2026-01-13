
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
      setIsHolding(false); // Reset holding state after toggle
    }, 3000); // 3-second hold to activate
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Also handle leaving the button area while holding
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
      <span className="text-sm font-semibold tracking-widest">
        SISTEMA ONLINE
      </span>
    </button>
  );
}
