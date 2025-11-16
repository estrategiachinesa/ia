
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estratégia Chinesa | Sinais de IA para Opções Binárias',
  description: 'Domine o mercado financeiro com a Estratégia Chinesa. Indicador com sinais para opções binárias gerados por Inteligência Artificial em tempo real. Ideal para day trading e investimentos.',
  keywords: ['Estratégia Chinesa', 'sinais opções binárias', 'opções binárias', 'mercado financeiro', 'sinais de ia', 'day trading', 'investimento', 'indicador', 'bolsa de valores', 'trader', 'sinais chineses'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="!scroll-smooth dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
