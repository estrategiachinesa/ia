
import { FirebaseClientProvider } from '@/firebase';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
