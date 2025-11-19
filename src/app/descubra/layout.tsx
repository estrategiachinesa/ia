
import { FirebaseClientProvider } from '@/firebase';
import Script from 'next/script';

export default function DescubraLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <div className="dark font-headline bg-[#0e0e0e] text-white">
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
