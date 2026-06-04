
import { FirebaseClientProvider } from '@/firebase';

export default function CatalogadorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
