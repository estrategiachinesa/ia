
import { FirebaseClientProvider } from '@/firebase';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <div className="theme-premium">{children}</div>
    </FirebaseClientProvider>
  );
}
