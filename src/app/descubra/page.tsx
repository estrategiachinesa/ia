
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  AlertTriangle,
  CheckCircle2,
  SquareCheckBig,
  Goal,
  ShieldCheck,
  Star,
  LineChart,
  Youtube as YoutubeIcon,
  Cpu,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import TestimonialCard from '@/components/testimonial-card';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppConfig } from '@/firebase';

const VslPlayerWithNoSSR = dynamic(() => import('@/components/vsl-player'), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full max-w-4xl rounded-lg bg-white/10" />,
});

const ScarcityCounter = () => {
    const [licenses, setLicenses] = useState(11);
    const [licenseColor, setLicenseColor] = useState('text-green-500');

    useEffect(() => {
        const videoEndTime = parseInt(localStorage.getItem('vsl_videoEndTime') || '0');
        if (!videoEndTime) return;

        const updateLicenses = () => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - videoEndTime) / 1000);

            if (elapsedSeconds >= 42) {
                setLicenses(9);
                setLicenseColor('text-red-500');
            } else if (elapsedSeconds >= 12) {
                setLicenses(10);
                setLicenseColor('text-red-500');
            } else {
                setLicenses(11);
                setLicenseColor('text-green-500');
            }
        };

        updateLicenses();
        const interval = setInterval(updateLicenses, 1000);

        return () => clearInterval(interval);
    }, []);


    return (
        <div className="mt-6 text-center">
            <p className="font-bold text-primary">LICENÇAS DISPONÍVEIS:</p>
            <div className="flex justify-center space-x-2 md:space-x-4 mt-2">
                <div className="text-center">
                    <div className={`text-4xl md:text-5xl font-bold font-mono p-2 rounded-lg transition-colors duration-500 ${licenseColor} animate-pulse`}>
                        {licenses}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HotmartButton = ({ className, url }: { className?: string; url: string }) => {
    const { affiliateId } = useAppConfig();
    let finalUrl = url;
    if (affiliateId && !finalUrl.includes('afftrack')) {
        finalUrl += `&afftrack=${affiliateId}`;
    }

    return (
        <a onClick={() => false} href={finalUrl} className={cn("hotmart-fb hotmart__button-checkout", className)}>
            <Image src='https://static.hotmart.com/img/btn-buy-green.png' alt="Comprar Agora" width={300} height={56} unoptimized />
        </a>
    );
};

const Header = () => {
    const { config } = useAppConfig();
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-md shadow-primary/20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <div className="hidden sm:inline-flex">
            <HotmartButton url={'https://pay.hotmart.com/G102999657C?checkoutMode=2'} />
          </div>
        </div>
      </header>
    );
};

const ProblemSection = () => {
    const problems = [
    "Você se sente perdido sem uma estratégia clara e lucrativa?",
    "Cansado de usar o Martingale e arriscar sua banca inteira?",
    "Frustrado por não conseguir identificar os melhores momentos de entrada?",
    "Já gastou dinheiro em cursos e ferramentas que não funcionaram?",
    ];

    return (
        <section id="problems" className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                Seus problemas acabam <span className="text-primary">HOJE!</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
                As dificuldades que te impedem de ser consistente podem ser eliminadas agora.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {problems.map((problem, index) => (
                <div key={index} className="flex items-start space-x-4">
                    <AlertTriangle className="h-8 w-8 flex-shrink-0 text-primary mt-1" />
                    <p className="text-left text-muted-foreground">{problem}</p>
                </div>
                ))}
            </div>
            </div>
        </section>
    )
};

const SolutionSection = () => {
    const solutionFeatures = [
        {
            icon: Cpu,
            title: "Análise Automatizada",
            description: "Nossa I.A. analisa o mercado para você, sem que você precise olhar para o gráfico.",
        },
        {
            icon: Zap,
            title: "Sinal Pronto para Operar",
            description: "A Inteligência Artificial identifica o melhor momento e te envia o sinal pronto, eliminando dúvidas.",
        },
        {
            icon: ShieldCheck,
            title: "Consistência e Segurança",
            description: "Uma estratégia segura que opera sem a necessidade de Martingale, protegendo seu capital.",
        },
    ];
    return (
        <section id="solution" className="py-16 md:py-24">
            <div className="container mx-auto px-4">
            <div className="text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                A Solução Definitiva: I.A. da<br />ESTRATEGIA CHINESA
                </h2>
                <p className="mt-4 max-w-3xl mx-auto text-muted-foreground text-lg">
                A nossa Inteligência Artificial é simples, direta e eficaz. Veja suas principais características:
                </p>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
                {solutionFeatures.map((feature, index) => (
                <div key={index}>
                    <div className="flex justify-center">
                    <feature.icon className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="mt-4 font-headline text-xl font-bold">
                    {feature.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
                ))}
            </div>
            </div>
        </section>
    )
};

const BenefitsSection = () => {
    const benefits = [
        "Sinais claros e precisos.",
        "Estratégia validada sem o uso de Martingale.",
        "Ideal para iniciantes e traders experientes.",
        "Funciona em qualquer corretora de Opções Binárias.",
        "Acesso vitalício e suporte exclusivo.",
    ];

    return (
        <section id="benefits" className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
                <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                Transforme seu Trading Agora Mesmo
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                Com a Estratégia Chinesa, você terá em mãos tudo o que precisa para
                alcançar a tão sonhada consistência no mercado.
                </p>
                <ul className="mt-8 space-y-4 inline-block text-left">
                {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-lg text-muted-foreground">
                        {benefit}
                    </span>
                    </li>
                ))}
                </ul>
            </div>
            </div>
        </section>
    )
};

const TestimonialsSection = () => {
    const testimonials = [
        {
            name: "Mariana L.",
            location: "São Paulo, SP",
            testimonial: "Depois de meses pulando de galho em galho, finalmente encontrei uma estratégia que funciona. A I.A. é incrivelmente precisa e fácil de usar. Bati minha meta semanal em apenas dois dias!",
        },
        {
            name: "Ricardo P.",
            location: "Belo Horizonte, MG",
            testimonial: "Eu era cético no início, mas a Estratégia Chinesa superou todas as minhas expectativas. Sem Martingale, meu risco diminuiu e meus lucros aumentaram. Recomendo para qualquer um que queira levar o trading a sério.",
        },
    ];

    return (
        <section id="testimonials" className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                O que nossos alunos estão dizendo
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
                Resultados reais de pessoas que transformaram seu trading.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
                {testimonials.map((testimonial, index) => (
                <TestimonialCard
                    key={index}
                    name={testimonial.name}
                    location={testimonial.location}
                    testimonial={testimonial.testimonial}
                />
                ))}
            </div>
            </div>
        </section>
    )
};

const OfferSection = () => {
    const { config } = useAppConfig();
    const bonuses = [
        "Acesso a um grupo VIP no Telegram para networking e suporte",
        "Ferramentas de Inteligência artificial para auxiliar nas analises",
        "Truques e segredos para proteger seu capital",
    ];

    return (
        <section id="offer" className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto shadow-2xl border-2 border-primary bg-card">
                <CardHeader className="text-center bg-primary text-primary-foreground p-6 rounded-t-lg">
                <h2 className="font-headline text-2xl md:text-3xl font-bold">
                    OFERTA ESPECIAL POR TEMPO LIMITADO
                </h2>
                <p className="text-base md:text-lg opacity-90">
                    Sua chance de ter acesso vitalício a uma ferramenta poderosa.
                </p>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                    <h3 className="font-headline text-xl font-bold text-foreground">
                        O que você vai receber:
                    </h3>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                        <li className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        I.A. da Estratégia Chinesa Vitalício
                        </li>
                        <li className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        Aulas de Instalação e Operação
                        </li>
                        <li className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                        Suporte Exclusivo
                        </li>
                    </ul>
                    <Separator className="my-6" />
                    <h3 className="font-headline text-xl font-bold text-foreground">
                        E ainda 3 bônus exclusivos:
                    </h3>
                    <ul className="mt-4 space-y-2 text-muted-foreground">
                        {bonuses.map((bonus, index) => (
                        <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{bonus}</span>
                        </li>
                        ))}
                    </ul>
                    </div>
                    <div className="text-center bg-background p-6 rounded-lg">
                    <p className="font-headline text-4xl md:text-5xl font-bold text-primary my-2">
                        12x de R$ 20,47 *
                    </p>
                    <p className="font-bold text-foreground">Ou R$ 197,97 à vista</p>
                    <div className="mt-6 w-full flex justify-center">
                        <HotmartButton url={'https://pay.hotmart.com/G102999657C?checkoutMode=2'} />
                    </div>
                    <ScarcityCounter />
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>
        </section>
    )
};

const GuaranteeSection = () => (
  <section id="guarantee" className="py-16 md:py-24">
    <div className="container mx-auto px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <ShieldCheck className="h-24 w-24 text-primary opacity-20 mx-auto mb-4" />
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
          Seu Risco é Zero!
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Temos tanta confiança na Estratégia Chinesa que oferecemos uma
          garantia incondicional. Se por qualquer motivo você não ficar
          satisfeito nos primeiros 7 dias, devolvemos 100% do seu dinheiro.
          Sem perguntas, sem burocracia.
        </p>
      </div>
    </div>
  </section>
);

const FaqSection = () => {
    const faqs = [
        {
            question: "Preciso ter experiência para usar a I.A.?",
            answer: "Não! A Estratégia Chinesa foi desenvolvida para ser simples e eficaz, servindo tanto para traders iniciantes quanto para os mais experientes que buscam uma ferramenta de alta assertividade.",
        },
        {
            question: "A Inteligência Artificial funciona em qualquer corretora?",
            answer: "Sim. A nossa I.A. funciona de forma independente e foi desenhada para ser universal. Como ela analisa os gráficos do mercado em tempo real, os sinais gerados podem ser usados em qualquer corretora que ofereça os pares de moedas que analisamos (como EUR/USD e EUR/JPY). Para operações em OTC, basta usar uma das corretoras recomendadas.",
        },
        {
            question: "O acesso é vitalício?",
            answer: "Sim! Ao adquirir a Estratégia Chinesa, você paga uma única vez e tem acesso vitalício à nossa Inteligência Artificial, a todas as aulas e futuras atualizações.",
        },
        {
            question: "Como funciona o suporte?",
            answer: "Você terá acesso ao nosso suporte exclusivo via Telegram e e-mail para tirar todas as suas dúvidas sobre a instalação e utilização da I.A..",
        },
    ];

    return (
        <section id="faq" className="py-16 md:py-24 bg-card">
            <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-center font-headline text-3xl md:text-4xl font-bold text-foreground">
                Perguntas Frequentes
            </h2>
            <Accordion type="single" collapsible className="w-full mt-12">
                {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-lg font-headline text-left">
                    {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
            </div>
        </section>
    )
};

const FinalCtaSection = () => {
  const { config } = useAppConfig();
  return (
      <section id="final-cta" className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
            Aproveite a Oferta Especial Agora!
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 border rounded-lg border-gray-700">
              <h3 className="font-headline text-2xl font-bold text-muted-foreground">
                Opção 1: Deixar Passar
              </h3>
              <p className="mt-4 text-muted-foreground">
                Continuar buscando estratégias, perdendo tempo e dinheiro, e se
                frustrando com a falta de consistência.
              </p>
            </div>
            <div className="p-6 border-2 border-primary rounded-lg shadow-lg shadow-primary/20">
              <h3 className="font-headline text-2xl font-bold text-primary">
                Opção 2: A Decisão Certa
              </h3>
              <p className="mt-4 text-foreground">
                Pegar um atalho com a Estratégia Chinesa por um preço especial e
                alcançar a consistência que você sempre sonhou.
              </p>
            </div>
          </div>
          <div
            className="mt-12 text-base md:text-xl font-bold"
          >
            <HotmartButton url={'https://pay.hotmart.com/G102999657C?checkoutMode=2'} />
          </div>
        </div>
      </section>
    );
};

const Footer = () => (
  <footer className="bg-background text-gray-400 py-8">
    <div className="container mx-auto px-4 text-center text-sm">
      <Logo />
      <p className="mt-4">
        © {new Date().getFullYear()} Estratégia Chinesa. Todos os direitos
        reservados.
      </p>
      <p className="mt-4 max-w-3xl mx-auto">
        <strong>Aviso Legal:</strong> Todas as estratégias e investimentos
        envolvem risco de perda. Nenhuma informação contida neste produto deve
        ser interpretada como uma garantia de resultados.
      </p>
    </div>
  </footer>
);


export default function DescubraPage() {
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    // Check localStorage on mount and on changes to update the state
    const checkVideoStatus = () => {
      const storedVideoEnded = localStorage.getItem('vsl_videoEnded') === 'true';
      if (storedVideoEnded !== videoEnded) {
        setVideoEnded(storedVideoEnded);
      }
    };
    checkVideoStatus();

    // Also listen for storage events to sync across tabs
    window.addEventListener('storage', checkVideoStatus);
    
    // Set up an interval as a fallback, especially for the active tab
    const interval = setInterval(checkVideoStatus, 500);

    return () => {
      window.removeEventListener('storage', checkVideoStatus);
      clearInterval(interval);
    };
  }, [videoEnded]);


  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0e0e0e] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-red-600 p-2 text-center">
        <p className="text-sm font-bold uppercase sm:text-base">
          Atenção: seu acesso será liberado no final do vídeo!
        </p>
      </header>

      <main className="mt-[60px] flex w-full flex-col items-center p-4">
        {!videoEnded && (
            <h1 className="mb-8 text-center text-3xl font-extrabold uppercase sm:text-4xl md:text-5xl">
                Descubra o gatilho mais <br />
                <span className="text-primary">assertivo no daytrade</span>
            </h1>
        )}

        <div className="w-full max-w-4xl">
          <VslPlayerWithNoSSR videoId="ewlGNXdH7oM" />
        </div>

        {videoEnded && (
            <div className="w-full">
                <ProblemSection />
                <SolutionSection />
                <BenefitsSection />
                <TestimonialsSection />
                <OfferSection />
                <GuaranteeSection />
                <FaqSection />
                <FinalCtaSection />
            </div>
        )}
      </main>

       {videoEnded && <Footer />}
    </div>
  );
}
