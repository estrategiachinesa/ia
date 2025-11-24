
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';
import Script from 'next/script';

export default function VipLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <div className="theme-premium">
        <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />
        {children}
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
      </div>
    </FirebaseClientProvider>
  );
}
