
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <div className="theme-free">{children}</div>
    </FirebaseClientProvider>
  );
}
