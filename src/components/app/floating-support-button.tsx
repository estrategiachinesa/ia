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

  // Load saved position from localStorage
  useEffect(() => {
    const savedPos = localStorage.getItem('support_btn_pos');
    if (savedPos) {
      try {
        setPosition(JSON.parse(savedPos));
      } catch (e) {
        console.error("Error loading button position", e);
      }
    } else {
        // Default position: bottom right
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
    }
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
    // Prevent scrolling on mobile while dragging
    if (e.type === 'touchstart') {
        // e.preventDefault(); // Might break click, handled via CSS touch-action
    }
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

      const newX = Math.min(Math.max(10, pageX - rel.x), window.innerWidth - 70);
      const newY = Math.min(Math.max(10, pageY - rel.y), window.innerHeight - 70);
      
      const newPos = { x: newX, y: newY };
      setPosition(newPos);
    };

    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('support_btn_pos', JSON.stringify(position));
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
    // If we moved the button more than 5px, don't trigger the link
    // This prevents accidental clicks while dragging
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
        "fixed z-[100] cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-80 scale-110"
      )}
    >
      <a
        href={supportLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="flex items-center justify-center gap-2 bg-[#229ED9] text-white p-3 rounded-full shadow-2xl hover:scale-105 transition-transform group overflow-hidden border border-white/20"
      >
        <Headset className="h-6 w-6" />
        <span className={cn(
            "max-w-0 overflow-hidden transition-all duration-500 font-black whitespace-nowrap text-[0.65rem] uppercase tracking-widest",
            "group-hover:max-w-xs group-hover:ml-1"
        )}>
          SUPORTE
        </span>
      </a>
    </div>
  );
}
