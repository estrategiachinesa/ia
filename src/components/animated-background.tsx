
'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let columns = Math.floor(width / 20);
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    let frameId: number;

    function draw() {
      ctx.fillStyle = 'rgba(4, 15, 4, 0.04)';
      ctx.fillRect(0, 0, width, height);

      // Use the CSS variable for the primary color
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const hslValues = primaryColor.split(' ').map(Number);
      ctx.fillStyle = `hsl(${hslValues[0]}, ${hslValues[1]}%, ${hslValues[2]}%)`;
      
      ctx.font = '15px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      frameId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / 20);
      for (let i = 0; i < columns; i++) {
        drops[i] = 1;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 w-full h-full" />;
}
