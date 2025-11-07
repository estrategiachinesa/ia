import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estratégia Chinesa - Aviso',
  description: 'Aviso importante antes de prosseguir.',
};

export default function AvisoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
