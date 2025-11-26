
import { FirebaseClientProvider } from '@/firebase';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}

    