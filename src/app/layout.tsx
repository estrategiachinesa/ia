import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Estratégia Chinesa',
  description: 'Alcance a consistência que você sempre buscou no trading.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="!scroll-smooth dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        {children}
        <Toaster />
        <Script id="hotmart-script" strategy="afterInteractive">
          {`
            function importHotmart(){ 
              var imported = document.createElement('script'); 
              imported.src = 'https://static.hotmart.com/checkout/widget.min.js'; 
              document.head.appendChild(imported); 
              var link = document.createElement('link'); 
              link.rel = 'stylesheet'; 
              link.type = 'text/css'; 
              link.href = 'https://static.hotmart.com/css/hotmart-fb.min.css'; 
              document.head.appendChild(link);
            } 
            importHotmart(); 
          `}
        </Script>
      </body>
    </html>
  );
}
