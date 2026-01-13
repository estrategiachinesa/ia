
import { AnimatedBackground } from "@/components/animated-background";
import { Cpu } from "lucide-react";
import { OnlineServer } from "@/components/app/OnlineServer";
import { branding } from "@/config/branding";

export default function BBLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="theme-bb font-mono">
        <AnimatedBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
            <header className="p-4 md:p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Cpu className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-primary tracking-widest">{branding.appName}</h1>
                        <p className="text-xs md:text-sm text-primary/80 tracking-wider">{branding.appSubtitle}</p>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex items-center justify-center p-4 md:p-6">
              {children}
            </main>
        </div>
    </div>
  );
}
