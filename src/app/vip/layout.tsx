
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';

export default function VipLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <div className="theme-premium">
        <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />
        {children}
      </div>
    </FirebaseClientProvider>
  );
}
