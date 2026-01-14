
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Cookie } from 'lucide-react';

// Função para ativar scripts de marketing (ex: Google Analytics, Meta Pixel)
// Esta função será chamada apenas após o consentimento do usuário.
const activateMarketingScripts = () => {
  console.log("Scripts de marketing ativados.");
  // Exemplo de como você poderia integrar o Google Analytics:
  // if (typeof window.gtag === 'function') {
  //   window.gtag('consent', 'update', {
  //     'ad_storage': 'granted',
  //     'analytics_storage': 'granted'
  //   });
  // }

  // Exemplo de como você poderia integrar o Meta Pixel:
  // if (typeof window.fbq === 'function') {
  //   window.fbq('consent', 'grant');
  // }
};

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar o consentimento ao carregar o site
    const consent = localStorage.getItem("cookie_consentimento");

    if (consent === "aceito") {
      // Se o usuário já aceitou, ativamos os scripts de marketing
      activateMarketingScripts();
      setIsVisible(false);
    } else if (consent !== "recusado") {
      // Se não houver registro ou se não foi recusado, exibe o banner
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie_consentimento", "aceito");
    localStorage.setItem("cookies_marketing", "true"); // Exemplo
    activateMarketingScripts();
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consentimento", "recusado");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl p-4 rounded-lg shadow-2xl bg-card/80 backdrop-blur-lg border border-border/50",
        "animate-in slide-in-from-bottom-4 duration-500"
      )}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="text-sm">
            <h3 className="font-semibold text-foreground">Este site utiliza cookies</h3>
            <p className="text-muted-foreground mt-1">
              Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego. Ao clicar em “Aceitar todos”, você concorda com o uso de cookies conforme nossa{' '}
              <Link href="/legal#privacy" className="underline hover:text-primary">
                Política de Privacidade
              </Link>.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleAcceptAll} className="w-full sm:w-auto">Aceitar todos</Button>
          <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">Recusar</Button>
          {/* O botão de configurar pode ser implementado no futuro com um modal de configurações detalhadas */}
          <Button variant="ghost" disabled className="hidden sm:inline-flex w-full sm:w-auto">Configurar</Button>
        </div>
      </div>
    </div>
  );
}
