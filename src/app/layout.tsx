
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { DevToolsBlocker } from '@/components/app/dev-tools-blocker';
import { FirebaseClientProvider } from '@/firebase';
import { CookieConsentBanner } from '@/components/app/cookie-consent-banner';

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
    <html lang="pt-BR" className="!scroll-smooth dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
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
      </head>
      <body className={cn("font-body antialiased", "bg-background")}>
        <DevToolsBlocker />
        <FirebaseClientProvider>
          {children}
          
          {/* Floating Telegram Button */}
          <a 
            href="https://t.me/TraderChinesVIP" 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-24 right-6 z-[100] bg-[#229ED9] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 flex items-center justify-center group"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.64-.99-.81-.35-1.26.22-1.88.15-.16 2.72-2.49 2.77-2.71.01-.03.01-.14-.05-.2-.06-.06-.15-.04-.22-.02-.1.02-1.61 1.02-4.55 3.01-.43.3-.82.44-1.17.43-.39-.01-1.15-.22-1.71-.4-.69-.22-1.25-.34-1.2-.72.03-.2.32-.41.87-.63 3.4-1.48 5.67-2.46 6.82-2.94 3.23-1.35 3.9-1.59 4.34-1.59.1 0 .31.02.45.14.12.1.15.24.17.34.02.06.03.18.02.25z"/>
            </svg>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 font-bold whitespace-nowrap text-sm">
                GRUPO VIP
            </span>
          </a>
        </FirebaseClientProvider>
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
