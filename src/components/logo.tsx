import { LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const Logo = () => (
  <Link href="/" className="flex items-center gap-2 group">
    <div className="p-2 bg-primary/10 group-hover:bg-primary/20 rounded-full transition-colors">
       <LineChart className="h-6 w-6 text-primary" />
    </div>
    <span className="text-xl font-bold font-headline text-foreground hidden sm:inline-block">
      Estratégia Chinesa
    </span>
  </Link>
);
