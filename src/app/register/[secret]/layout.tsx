
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar Conta - Estratégia Chinesa',
  description: 'Crie sua conta para acessar o analisador.',
};

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full grid-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />
      </div>
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        {children}
      </div>
    </>
  );
}
