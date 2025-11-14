
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAppConfig } from '@/firebase';
import { Check, ShieldCheck, Zap, BarChart, Clock, Users, Gift, Timer } from 'lucide-react';
import Link from 'next/link';

const Feature = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <div className="flex items-start gap-4">
    <div className="bg-primary/10 text-primary p-2 rounded-full">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="font-bold text-lg text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default function SalesPage() {
  const { config, isConfigLoading } = useAppConfig();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <main className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400 font-headline">
            Domine o Mercado com a Inteligência Artificial
          </h1>
          <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Você está a um passo de desbloquear o acesso ilimitado à ferramenta que está revolucionando o mercado de opções binárias.
          </p>
        </div>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/10">
          <CardHeader className="text-center p-8 border-b border-border/20">
            <h2 className="text-3xl font-bold text-primary">Acesso VIP Vitalício</h2>
            <p className="text-muted-foreground mt-2">Um único pagamento para acesso para sempre. Sem mensalidades.</p>
          </CardHeader>
          <CardContent className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground mb-4">O que você vai receber:</h3>
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
              <p className="text-sm text-muted-foreground">OFERTA ESPECIAL POR TEMPO LIMITADO</p>
              <p className="text-5xl font-bold text-foreground my-2">R$ 197</p>
              <p className="text-muted-foreground">Pagamento único, acesso vitalício.</p>

              <Button
                asChild
                size="lg"
                className="w-full mt-6 h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:to-yellow-600 shadow-lg shadow-yellow-500/20 transform hover:scale-105 transition-all duration-300"
                disabled={isConfigLoading}
              >
                <Link href={config?.hotmartUrl || '#'} target="_blank">
                  <Zap className="mr-2" />
                  QUERO ACESSO VIP AGORA
                </Link>
              </Button>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span>Compra segura e garantida pela Hotmart.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="w-full text-center text-[0.6rem] text-foreground/50 p-4 mt-8">
          <p>© 2025 ESTRATÉGIA CHINESA. </p>
          <p>Todos os direitos reservados.</p>
          <p className="max-w-xl mx-auto">Aviso Legal: Todas as estratégias e investimentos envolvem risco de perda. Nenhuma informação contida neste produto deve ser interpretada como uma garantia de resultados.</p>
        </footer>
    </div>
  );
}
