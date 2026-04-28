'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Helper function to get a random number in a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Represents a single particle in the animation
class Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;

  constructor(width: number, height: number, color: string) {
    this.x = random(0, width);
    this.y = random(0, height);
    this.radius = random(1, 1.5);
    this.color = color;
    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.3, 0.3);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }

  update(width: number, height: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
}

// Represents a connection line between particles
function drawLine(ctx: CanvasRenderingContext2D, p1: Particle, p2: Particle, maxDist: number) {
  const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  if (dist < maxDist) {
    ctx.save();
    ctx.globalAlpha = 1 - dist / maxDist;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = p1.color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }
}

const analysisSteps = [
  'CONECTANDO AOS SERVIDORES...',
  'ANALISANDO GRÁFICO EM TEMPO REAL...',
  'IDENTIFICANDO PADRÕES DE VELAS...',
  'CALCULANDO PROBABILIDADE DE CONFLUÊNCIA...',
  'INICIANDO MANIPULAÇÃO...',
  'SINAL GERADO...',
];

export function AnalysisAnimation({ showProgressBar = true }: { showProgressBar?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentText, setCurrentText] = useState(analysisSteps[0]);
  const [progress, setProgress] = useState(0);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    let textIndex = 0;
    // Set initial progress based on the first step
    setProgress((textIndex / (analysisSteps.length - 1)) * 100);

    const textInterval = setInterval(() => {
      textIndex++;
      if (textIndex < analysisSteps.length) {
        setCurrentText(analysisSteps[textIndex]);
        setProgress((textIndex / (analysisSteps.length - 1)) * 100);
      } else {
        clearInterval(textInterval);
      }
    }, 900); // This duration should align with the loading simulation

    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), random(50, 150));
    }, random(1000, 3000));
    
    return () => {
      clearInterval(textInterval);
      clearInterval(glitchInterval);
    };
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    
    const primaryColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`;

    const particles = Array.from({ length: 40 }, () => new Particle(width, height, primaryColor));
    const maxDist = 120;

    let animationFrameId: number;

    const render = () => {
      if(!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          drawLine(ctx, particles[i], particles[j], maxDist);
        }
      }
      
      particles.forEach(p => {
        p.draw(ctx);
        p.update(width, height);
      });
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    
    const handleResize = () => {
        if(!canvas || !ctx) return;
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative h-[400px] w-full max-w-md overflow-hidden rounded-lg bg-black/80 border border-primary/20 flex flex-col items-center justify-center p-6 gap-4">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-30" />
      <div className="flex-grow w-full flex items-center justify-center">
        <div 
          className={cn(
              "z-10 font-code text-sm sm:text-base text-center text-primary transition-all duration-75",
              glitch && 'skew-x-12 skew-y-2 opacity-75'
          )}
        >
          <p>{currentText}</p>
          <div className={cn("animate-pulse", glitch && "hidden")}>_</div>
        </div>
      </div>
      {showProgressBar && (
        <div className="w-full z-10 space-y-2">
          <Progress value={progress} className="h-1.5 bg-primary/20 border-none" />
          <p className="text-xs text-center text-primary/50 font-code">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}
