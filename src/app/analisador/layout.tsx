import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estratégia Chinesa - Analisador',
  description: 'Receba sinais gratuitos da Estratégia Chinesa em tempo real',
};

export default function AnalisadorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
