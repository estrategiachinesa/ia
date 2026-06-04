import { FirebaseClientProvider } from '@/firebase';

export default function SessaoChinesaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A página de Sessão Chinesa é aberta ao público para validação de ID
  return (
    <FirebaseClientProvider>
      {children}
    </FirebaseClientProvider>
  );
}
