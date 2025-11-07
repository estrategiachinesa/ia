'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Send } from 'lucide-react';
import Link from 'next/link';

export default function LinksPage() {
  return (
    <>
      <div className="fixed inset-0 -z-10 h-full w-full bg-background"></div>
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
          <div className="w-full max-w-xs space-y-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
              ESTRATÉGIA
              <br />
              CHINESA
            </h1>
            <div className="flex flex-col space-y-4">
              <Button asChild size="lg" className="h-14 text-lg font-bold">
                <Link href="/sinais">
                  Estratégia Chinesa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 text-lg font-bold"
              >
                <Link href="/aviso">
                  Sessão Chinesa
                  <Send className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <footer className="w-full text-center text-[0.6rem] text-foreground/50 p-4">
          <p>© 2025 Estratégia Chinesa. </p>
          <p>Todos os direitos reservados.</p>
        </footer>
      </div>
    </>
  );
}
