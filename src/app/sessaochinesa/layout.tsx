
import { FirebaseClientProvider } from '@/firebase';

export default function SessaoChinesaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
        <div className="theme-premium">
            {children}
        </div>
    </FirebaseClientProvider>
  );
}
