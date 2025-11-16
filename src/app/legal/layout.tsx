
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />

      <div className="flex flex-col min-h-screen">
         <header className="p-4 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border/50 z-10">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <Link href="/" className="font-headline text-2xl font-bold text-primary absolute left-1/2 -translate-x-1/2">
            Estratégia Chinesa
          </Link>
          <div />
        </header>

        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
            {children}
        </main>
        
        <footer className="p-4 text-center text-xs text-foreground/30">
          <p>© 2025 Estratégia Chinesa. Todos os direitos reservados.</p>
        </footer>
      </div>
    </>
  );
}
