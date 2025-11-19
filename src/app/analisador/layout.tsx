
import { FirebaseClientProvider } from '@/firebase';

export default function AnalisadorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
