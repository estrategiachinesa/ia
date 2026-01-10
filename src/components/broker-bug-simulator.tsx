
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Video, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { branding } from '@/config/branding';
import VipVslPlayer from '@/components/vip-vsl-player';

type Step = 0.5 | 1 | 2 | 3 | 4;

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
                <p key={i} className="whitespace-pre-wrap text-shadow-primary animate-text-flicker" style={{animationDelay: `${i * 25}ms`}}>{line}</p>
            ))}
            <div className="animate-pulse">_</div>
        </div>
    );
};

export function BrokerBugSimulator() {
    const [step, setStep] = useState<Step>(0.5);
    const [isSystemOnline, setIsSystemOnline] = useState(false);
    const [depositValue, setDepositValue] = useState([0]);
    const [accountName, setAccountName] = useState('John Doe');
    const [userId, setUserId] = useState('');
    const [initialBalance, setInitialBalance] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [isVslModalOpen, setIsVslModalOpen] = useState(false);
    const [isAnimatingBalance, setIsAnimatingBalance] = useState(false);

    const animationFrameRef = useRef<number>();
    const onlineStatusTimerRef = useRef<NodeJS.Timeout>();

    const handleSystemActivation = useCallback(() => {
        setIsSystemOnline(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ç' || event.key === 'Ç') {
                handleSystemActivation();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSystemActivation]);

    const handleOnlinePress = () => {
        onlineStatusTimerRef.current = setTimeout(() => {
            handleSystemActivation();
        }, 3000);
    };

    const handleOnlineRelease = () => {
        clearTimeout(onlineStatusTimerRef.current);
    };

    const resetSimulation = () => {
        setStep(0.5);
        setDepositValue([0]);
        setInitialBalance(0);
        setCurrentBalance(0);
        setIsFailureModalOpen(false);
        setIsVslModalOpen(false);
        setIsSystemOnline(false);
        setUserId('');
    };
    
    const handleVerifyId = () => {
        if (userId) {
            setAccountName(`Client #${userId}`);
            setStep(1);
        }
    };

    const handleDeposit = () => {
        const value = depositValue[0];
        if (value > 0) {
            setInitialBalance(value);
            setCurrentBalance(value);
            setStep(2);
        }
    };

    const handleOpenOperation = () => {
        setStep(3);
    };

    const animateBalance = (targetBalance: number) => {
        setIsAnimatingBalance(true);
        const startBalance = currentBalance;
        const duration = 2000;
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            const animatedValue = startBalance + (targetBalance - startBalance) * percentage;
            setCurrentBalance(animatedValue);

            if (progress < duration) {
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
        setStep(4);
    };

    const broker = branding.brokers[0];
    const affiliateLink = `${broker.affiliateLink}${userId || ''}`;

    const renderStepContent = () => {
        switch (step) {
            case 0.5:
                return (
                    <div className="space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">Para começar, crie sua conta na corretora e insira seu ID de usuário abaixo.</p>
                        <Button variant="outline" asChild className="w-full">
                            <a href={affiliateLink} target="_blank">Crie sua conta clicando aqui</a>
                        </Button>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="userId">ID DO USUÁRIO</Label>
                            <Input id="userId" placeholder="Insira seu ID aqui" value={userId} onChange={(e) => setUserId(e.target.value)} className="text-center" />
                        </div>
                        <Button onClick={handleVerifyId} disabled={!userId} className="w-full">VERIFICAR</Button>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 text-center">
                        <p className="text-sm text-muted-foreground">Selecione o valor a ser depositado para multiplicar por 10x.</p>
                        <div className='py-4'>
                            <Slider
                                value={depositValue}
                                onValueChange={setDepositValue}
                                max={1000}
                                step={100}
                            />
                        </div>
                        <Button onClick={handleDeposit} disabled={depositValue[0] === 0} className="w-full">DEPOSITAR R$ {depositValue[0]}</Button>
                    </div>
                );
            case 2:
                 return (
                    <div className="space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">Depósito confirmado. Inicie uma operação com seu saldo.</p>
                        <Button onClick={handleOpenOperation} className="w-full">ABRIR OPERAÇÃO</Button>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">Operação aberta. Execute o BUG para multiplicar o saldo.</p>
                        <Button onClick={handleExecuteBug} className="w-full">EXECUTAR BUG</Button>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4 text-center">
                         <p className="text-sm text-green-400 font-bold">BUG EXECUTADO COM SUCESSO!</p>
                        <Button variant="secondary" className="w-full" onClick={() => window.open(affiliateLink, '_blank')}>RETIRAR SALDO</Button>
                        <Button variant="outline" className="w-full" onClick={resetSimulation}>REINICIAR</Button>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <>
            <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-primary/20 shadow-2xl shadow-primary/20 relative overflow-hidden">
                 <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

                <CardHeader className="text-center border-b border-primary/20 pb-4 relative">
                    <CardTitle className="text-3xl font-black text-primary font-mono tracking-widest text-shadow-primary">{branding.appName}</CardTitle>
                    <CardDescription className="font-mono text-muted-foreground">{branding.appSubtitle}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 p-6 relative">
                    <div className="space-y-4 p-4 rounded-lg bg-secondary/20 border border-border">
                        <h3 className="font-bold text-center text-muted-foreground font-mono">PAINEL DE CONTROLE</h3>
                        {renderStepContent()}
                    </div>
                     <div className="space-y-4 p-4 rounded-lg bg-secondary/20 border border-border flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-center text-muted-foreground font-mono">PAINEL DE SALDO</h3>
                            <div className="text-center my-4">
                                <p className="text-sm text-muted-foreground">{accountName}</p>
                                <p className={cn(
                                    "text-4xl font-bold text-primary font-mono text-shadow-primary transition-all duration-300",
                                    isAnimatingBalance && "animate-pulse"
                                )}>
                                    R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 cursor-pointer select-none"
                             onMouseDown={handleOnlinePress}
                             onMouseUp={handleOnlineRelease}
                             onMouseLeave={handleOnlineRelease}
                             onTouchStart={handleOnlinePress}
                             onTouchEnd={handleOnlineRelease}>
                           <span className="relative flex h-3 w-3">
                                {isSystemOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                                <span className={cn("relative inline-flex rounded-full h-3 w-3", isSystemOnline ? "bg-primary" : "bg-muted")}></span>
                            </span>
                            <span className="text-sm font-mono">{isSystemOnline ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isBugModalOpen}>
                <DialogContent className="max-w-xl bg-background/80 backdrop-blur-sm border-primary/30" hideCloseButton>
                    <DialogHeader>
                        <DialogTitle className="font-mono text-primary text-shadow-primary">{branding.appName}</DialogTitle>
                    </DialogHeader>
                    <HackerTextAnimation onComplete={onBugAnimationComplete} />
                </DialogContent>
            </Dialog>

            <Dialog open={isFailureModalOpen} onOpenChange={setIsFailureModalOpen}>
                 <DialogContent className="bg-background/80 backdrop-blur-sm border-destructive/50">
                    <DialogHeader className="items-center text-center">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                        <DialogTitle>FALHA NA EXECUÇÃO</DialogTitle>
                        <DialogDescription>
                            O sistema de segurança da corretora detectou a tentativa. O G-BREAKER precisa estar no modo "SISTEMA ONLINE" para funcionar.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                        <Button onClick={() => window.open(affiliateLink, '_blank')} className="w-full">
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
