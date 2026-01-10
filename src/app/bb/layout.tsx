
import { AnimatedBackground } from "@/components/animated-background";

export default function BBLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="theme-bb">
        <AnimatedBackground />
        <div className="relative z-10">
            {children}
        </div>
    </div>
  );
}
