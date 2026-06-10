
import { FirebaseClientProvider } from '@/firebase';

export default function CopyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
