
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAppConfig } from '@/firebase';
import { Check, ShieldCheck, Zap, BarChart, Clock, Users, Gift, Timer, ArrowLeft, Loader2 } from 'lucide-react';
import AffiliateLink from '@/components/app/affiliate-link';
import VipVslPlayer from '@/components/vip-vsl-player';
import { HotmartButton } from '@/components/app/hotmart-button';

const Feature = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex items-start gap-4">
    <div className="bg-primary/10 text-primary p-2 rounded-full">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h3 className="font-bold text-base md:text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default function VipPage() {
  const { config, isConfigLoading, affiliateId } = useAppConfig();

  let checkoutUrl = "https://pay.hotmart.com/G102999657C";

  // Specific override for affiliate 'wm'
  if (affiliateId === 'wm') {
    checkoutUrl = 'https://go.hotmart.com/D103007301M?dp=1';
  } else if (affiliateId && checkoutUrl !== '#') {
    // General affiliate tracking for others
    const separator = checkoutUrl.includes('?') ? '&' : '?';
    checkoutUrl = `${checkoutUrl}${separator}afftrack=${affiliateId}`;
  }

  const legalUrl = affiliateId ? `/legal?aff=${affiliateId}` : '/legal';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
       <header className="p-4 w-full max-w-4xl mx-auto flex justify-start items-center">
          <Button variant="ghost" asChild>
            <AffiliateLink href="/demo">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </AffiliateLink>
          </Button>
        </header>
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 flex-grow">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400 font-headline">
            Domine o Mercado com a Inteligência Artificial
          </h1>
          <p className="mt-4 text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            Você está a um passo de desbloquear o acesso ilimitado à ferramenta que está revolucionando o mercado de opções binárias.
          </p>
        </div>

        <div className="mb-8 md:mb-12">
            <VipVslPlayer videoId="8RebjHIi7Ok" />
        </div>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/10">
          <CardHeader className="text-center p-6 md:p-8 border-b border-border/20">
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Acesso VIP Vitalício</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-2">Um único pagamento para acesso para sempre. Sem mensalidades.</p>
          </CardHeader>
          <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-5">
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-4">O que você vai receber:</h3>
              <Feature
                icon={Clock}
                title="Análise 24/7"
                description="Analise ativos quando quiser, 24 horas por dia, 7 dias por semana."
              />
               <Feature
                icon={ShieldCheck}
                title="Sinais sem Martingale"
                description="Estratégia segura e direta, sem a necessidade de aumentar sua exposição ao risco."
              />
              <Feature
                icon={BarChart}
                title="Mercado Aberto e OTC"
                description="Funciona tanto no mercado tradicional quanto em OTC, para você operar a qualquer momento."
              />
               <Feature
                icon={Timer}
                title="Expiração em 1m e 5m"
                description="Opere nos tempos de expiração mais populares e lucrativos do mercado."
              />
              <Feature
                icon={Users}
                title="Suporte Exclusivo"
                description="Entre no nosso grupo exclusivo para membros VIP e tire suas dúvidas diretamente com a equipe."
              />
               <Feature
                icon={Gift}
                title="Bônus Exclusivo"
                description="Ao se registrar, você ganha acesso à uma conta de treinamento com $10.000 para praticar sem riscos."
              />
            </div>

            <div className="bg-card/50 p-6 rounded-lg border border-border flex flex-col justify-center text-center">
              <p className="text-xs md:text-sm text-muted-foreground">OFERTA ESPECIAL POR TEMPO LIMITADO</p>
              {isConfigLoading ? (
                <div className="flex justify-center items-center my-4 h-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <p className="text-4xl md:text-5xl font-bold text-foreground my-2">{config?.price}</p>
              )}
              <p className="text-sm md:text-base text-muted-foreground">Pagamento único, acesso vitalício.</p>

              <div className="w-full mt-6">
                 <HotmartButton url={checkoutUrl} />
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span>Compra segura e garantida pela Hotmart.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="w-full text-center text-xs text-foreground/50 p-4 mt-8">
          <p>© 2025 ESTRATÉGIA CHINESA. Todos os direitos reservados.</p>
           <AffiliateLink href={legalUrl} className="underline underline-offset-2">
            Termos de Uso e Privacidade
          </AffiliateLink>
          <p className="max-w-xl mx-auto text-[0.6rem] mt-2">Aviso Legal: Todas as estratégias e investimentos envolvem risco de perda. Nenhuma informação contida neste produto deve ser interpretada como uma garantia de resultados.</p>
        </footer>
    </div>
  );
}

    