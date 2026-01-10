
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Video, CheckCircle, ArrowRight, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { branding } from '@/config/branding';
import VipVslPlayer from '@/components/vip-vsl-player';
import { Progress } from '@/components/ui/progress';
import { OnlineServer } from '@/components/app/OnlineServer';

type Step = 1 | 2 | 3 | 4 | 5;

const HackerTextAnimation = ({ onComplete }: { onComplete: () => void }) => {
    const lines = [
        '> INICIANDO BYPASS NA CORRETORA...',
        '  - Conectando ao servidor principal... [OK]',
        '> Procurando por brechas de segurança...',
        '  - Verificando protocolo SSL... [SEGURO]',
        '  - Analisando API de transações...',
        '> ACESSO NEGADO. Permissões insuficientes.',
        '  - Tentando escalada de privilégios...',
        '> EXECUTANDO G-BREAKER.EXE...',
        '  - Injetando script de saldo... [SUCESSO]',
        '> ATAQUE CONFIRMADO. Multiplicador de saldo ativado.',
        '  - Finalizando conexão segura... [OK]',
    ];
    const [visibleLines, setVisibleLines] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < lines.length) {
                setVisibleLines(prev => [...prev, lines[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 1000);
            }
        }, 350);

        return () => clearInterval(interval);
    }, [onComplete]);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [visibleLines]);

    return (
        <div ref={containerRef} className="font-mono text-sm sm:text-base text-primary p-4 bg-black/50 rounded-lg h-64 overflow-y-auto border border-primary/20">
            {visibleLines.map((line, i) => (
                <p key={i} className="whitespace-pre-wrap" style={{animationDelay: `${i * 25}ms`}}>{line}</p>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    );
};

const StepItem = ({ icon, text, isActive = false }: { icon: React.ReactNode, text: string, isActive?: boolean }) => (
    <div className={cn(
        "flex items-center gap-4 border border-primary/20 rounded-lg p-4 bg-black/20",
        !isActive && "text-primary/30"
    )}>
        {icon}
        <span className="text-sm">{text}</span>
    </div>
);


export function BrokerBugSimulator() {
    const [step, setStep] = useState<Step>(1);
    const [isSystemOnline, setIsSystemOnline] = useState(false);
    const [userId, setUserId] = useState('');
    const [isIdVerified, setIsIdVerified] = useState(false);
    const [initialBalance, setInitialBalance] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [isVslModalOpen, setIsVslModalOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isAnimatingBalance, setIsAnimatingBalance] = useState(false);

    const animationFrameRef = useRef<number>();

    const broker = branding.brokers[0];
    const affiliateLink = `${broker.affiliateLink}${userId || ''}`;

    const handleSystemToggle = useCallback(() => {
        setIsSystemOnline(prev => !prev);
    }, []);
    
    const handleVerifyId = () => {
        if (!userId) return;
        setIsVerifying(true);
        setProgress(10);
        setTimeout(() => {
            setIsIdVerified(true);
            setStep(2);
            setIsVerifying(false);
            setProgress(30);
        }, 1500);
    };

    const handleSelectDeposit = () => {
        const depositAmount = 500; // Simulating a fixed deposit for this flow
        setInitialBalance(depositAmount);
        setCurrentBalance(depositAmount);
        setStep(3);
        setProgress(50);
    }
    
    const handleOpenOperation = () => {
        setStep(4);
        setProgress(70);
    };

    const animateBalance = (targetBalance: number) => {
        setIsAnimatingBalance(true);
        const startBalance = currentBalance;
        const duration = 2000;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const percentage = Math.min(elapsed / duration, 1);
            const animatedValue = startBalance + (targetBalance - startBalance) * percentage;
            setCurrentBalance(animatedValue);

            if (elapsed < duration) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                setCurrentBalance(targetBalance);
                setIsAnimatingBalance(false);
            }
        };
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleExecuteBug = () => {
        if (!isSystemOnline) {
            setIsFailureModalOpen(true);
            return;
        }
        setIsBugModalOpen(true);
    };

    const onBugAnimationComplete = () => {
        setIsBugModalOpen(false);
        const targetBalance = initialBalance * 10;
        animateBalance(targetBalance);
        setStep(5);
        setProgress(100);
    };

    const resetSimulation = () => {
        setStep(1);
        setInitialBalance(0);
        setCurrentBalance(0);
        setIsFailureModalOpen(false);
        setIsVslModalOpen(false);
        setUserId('');
        setIsIdVerified(false);
        setProgress(0);
    };

    return (
        <>
            <div className="absolute top-4 md:top-6 right-4 md:right-6">
                 <OnlineServer isActivated={isSystemOnline} onToggle={handleSystemToggle} />
            </div>

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 text-primary">
                {/* Painel de Controle */}
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-lg font-bold tracking-[0.2em]">PAINEL DE CONTROLE</h2>
                    <div className="space-y-3">
                       
                        {/* Passo 1 */}
                        <div className={cn("border border-primary/20 rounded-lg p-4 bg-black/40", step === 1 ? 'border-primary/50' : 'opacity-50')}>
                            <div className="flex items-start gap-4">
                                <ArrowRight className="h-5 w-5 mt-1 text-primary flex-shrink-0"/>
                                <div>
                                    <p className="text-primary/80">Para começar, crie sua conta na corretora e insira seu ID de usuário abaixo.</p>
                                    <a href={affiliateLink} target="_blank" className="text-primary font-bold text-lg underline hover:text-green-300 transition-colors">
                                        Crie sua conta clicando aqui
                                    </a>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <label className="text-xs font-bold tracking-widest">SEU ID DE USUÁRIO</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-grow">
                                        <Input 
                                            id="userId" 
                                            placeholder="00000000" 
                                            value={userId} 
                                            onChange={(e) => setUserId(e.target.value)} 
                                            className="bg-black/50 border-primary/30 h-12 pr-10"
                                            disabled={isIdVerified}
                                        />
                                        <Eye className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50"/>
                                    </div>
                                    <Button onClick={handleVerifyId} disabled={!userId || isIdVerified || isVerifying} variant="outline" className="bg-black/50 border-primary/30 h-12 hover:bg-primary/10">
                                        {isVerifying ? <Loader2 className="animate-spin"/> : 'VERIFICAR'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Outros Passos */}
                        <StepItem
                            isActive={step === 2}
                            icon={<AlertCircle className={cn("h-5 w-5 flex-shrink-0", step > 2 && "text-green-400")}/>}
                            text="Selecione o valor a ser depositado para multiplicar por 10x."
                        />
                         <StepItem
                            isActive={step === 3}
                            icon={<AlertCircle className={cn("h-5 w-5 flex-shrink-0", step > 3 && "text-green-400")}/>}
                            text="Inicie uma operação com seu saldo."
                        />
                         <StepItem
                            isActive={step === 4}
                            icon={<AlertCircle className={cn("h-5 w-5 flex-shrink-0", step > 4 && "text-green-400")}/>}
                            text="Execute o BUG para multiplicar o saldo."
                        />
                    </div>
                </div>

                {/* Painel de Saldo */}
                <div className="lg:col-span-2 border border-primary/20 rounded-lg p-6 bg-black/40 flex flex-col justify-between">
                    <h2 className="text-lg font-bold tracking-[0.2em] text-center">SALDO EM CONTA</h2>
                    <div className="text-center my-8">
                        <p className={cn(
                            "text-6xl lg:text-7xl font-bold text-white transition-all duration-300",
                            isAnimatingBalance && "animate-pulse"
                        )}>
                           R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="text-center text-sm space-y-1">
                            <p>CORRETORA: <span className="text-white">{broker.name}</span></p>
                            <p>ID DO USUÁRIO: <span className="text-white">{isIdVerified ? userId : 'N/A'}</span></p>
                        </div>
                        <div>
                             <p className="text-xs text-center mb-1">Progresso</p>
                             <Progress value={progress} className="h-2 bg-primary/10" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Dialog open={isBugModalOpen}>
                <DialogContent className="max-w-xl bg-black/80 backdrop-blur-sm border-primary/30 text-primary" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle className="font-mono text-primary">{branding.appName}</DialogTitle>
                    </DialogHeader>
                    <HackerTextAnimation onComplete={onBugAnimationComplete} />
                </DialogContent>
            </Dialog>

            <Dialog open={isFailureModalOpen} onOpenChange={setIsFailureModalOpen}>
                 <DialogContent className="bg-black/80 backdrop-blur-sm border-destructive/50 text-white">
                    <DialogHeader className="items-center text-center">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                        <DialogTitle>FALHA NA EXECUÇÃO</DialogTitle>
                        <p className="text-sm text-white/70">
                            O sistema de segurança da corretora detectou a tentativa. O G-BREAKER precisa estar no modo "SISTEMA ONLINE" para funcionar.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                        <Button onClick={() => window.open(affiliateLink, '_blank')} className="w-full bg-primary text-black hover:bg-primary/90">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Fazer Cadastro para Ativar
                        </Button>
                        <Button variant="secondary" onClick={() => { setIsFailureModalOpen(false); setIsVslModalOpen(true); }} className="w-full">
                             <Video className="mr-2 h-4 w-4" />
                            Assistir Tutorial de Ativação
                        </Button>
                         <Button variant="outline" onClick={resetSimulation} className="w-full">
                            Reiniciar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isVslModalOpen} onOpenChange={setIsVslModalOpen}>
                <DialogContent className="max-w-3xl p-0 bg-black border-primary/30">
                   <VipVslPlayer videoId="8RebjHIi7Ok" />
                </DialogContent>
            </Dialog>
        </>
    );
}
