
import { AnimatedBackground } from "@/components/animated-background";

export default function BBLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="theme-bb">
        <AnimatedBackground />
        <div className="relative z-10 scanlines">
             <div className="absolute inset-0 bg-radial-gradient-primary opacity-20 pointer-events-none"></div>
            {children}
        </div>
    </div>
  );
}
