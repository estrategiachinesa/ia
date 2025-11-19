'use client';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const VslPlayerWithNoSSR = dynamic(
  () => import('@/components/vsl-player'),
  { 
    ssr: false,
    loading: () => <Skeleton className="aspect-video w-full max-w-4xl rounded-lg bg-white/10" />,
  }
);

export default function DescubraPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0e0e0e] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-red-600 p-2 text-center">
        <p className="text-sm font-bold uppercase sm:text-base">
          Atenção: seu acesso será liberado no final do vídeo!
        </p>
      </header>

      <main className="mt-[60px] flex w-full flex-col items-center p-4">
        <h1 className="mb-8 text-center text-3xl font-extrabold uppercase sm:text-4xl md:text-5xl">
          Descubra o gatilho mais <br />
          <span className="text-primary">assertivo no daytrade</span>
        </h1>

        <div className="w-full max-w-4xl">
          <VslPlayerWithNoSSR videoId="ewlGNXdH7oM" />
        </div>
      </main>
    </div>
  );
}
