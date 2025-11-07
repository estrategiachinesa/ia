import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estratégia Chinesa - Sinais',
  description: 'Aviso importante antes de prosseguir.',
};

export default function SinaisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
