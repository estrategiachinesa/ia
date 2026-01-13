
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Cpu,
  Shield,
  CircleDollarSign,
  AreaChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { branding } from '@/config/branding';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Step = 1 | 2 | 3 | 4 | 5;

const HackerTextAnimation = ({
  onComplete,
}: {
  onComplete: () => void;
}) => {
  const lines = [
    '> BROKER BREAKER.EXE INICIADO...',
    '> INJETANDO VETOR DE EXPLORAÇÃO...',
    '> ACESSO AO KERNEL: NEGADO. REINICIANDO PROTOCOLOS...',
    '> FORÇANDO OVERRIDE DE SEGURANÇA...',
    '> ATAQUE CONFIRMADO — ACESSO TOTAL.',
    '> SALDO INJETADO COM SUCESSO.',
  ];
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < lines.length) {
        setVisibleLines((prev) => [...prev, lines[currentIndex]]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  return (
    <div
      ref={containerRef}
      className="font-mono text-sm sm:text-base p-4 bg-black/50 rounded-lg h-72 overflow-y-auto border border-primary/20"
    >
      {visibleLines.map((line, i) => (
        <p
          key={i}
          className={cn(
            'whitespace-pre-wrap',
            line && line.includes('NEGADO') ? 'text-red-500' : 'text-primary'
          )}
          style={{ animationDelay: `${i * 25}ms` }}
        >
          {line}
        </p>
      ))}
      <div className="animate-pulse">_</div>
    </div>
  );
};

const StepItem = ({
  icon,
  text,
  isActive = false,
  children,
}: {
  icon: React.ReactNode;
  text: string;
  isActive?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      'border border-primary/20 rounded-lg p-4 bg-black/40 transition-opacity',
      !isActive && 'opacity-50'
    )}
  >
    <div className="flex items-center gap-3">
      {icon}
      <h3 className="font-semibold text-white">{text}</h3>
    </div>
    {isActive && <div className="mt-4">{children}</div>}
  </div>
);

export function BrokerBugSimulator() {
  const [step, setStep] = useState<Step>(1);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [userId, setUserId] = useState('');
  const [showId, setShowId] = useState(false);
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [initialBalance, setInitialBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isAnimatingBalance, setIsAnimatingBalance] = useState(false);
  const [isWithdrawClicked, setIsWithdrawClicked] = useState(false);
  const [depositSelected, setDepositSelected] = useState(false);
  const [depositClicked, setDepositClicked] = useState(false);
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const [hasConfirmedCreation, setHasConfirmedCreation] = useState(false);

  const animationFrameRef = useRef<number>();

  const broker = branding.brokers[0];
  const affiliateLink = broker.affiliateLink;

  const handleVerifyId = () => {
    if (!userId || userId.length < 5) return;

    setIsVerifying(true);
    setVerificationStatus('> AUTENTICANDO TOKEN...');
    setProgress(10);

    setTimeout(() => {
      setVerificationStatus('> VERIFICANDO CREDENCIAIS...');
      setTimeout(() => {
        setVerificationStatus('> VALIDANDO ID...');
        setTimeout(() => {
          setVerificationStatus('> CONEXÃO ESTABELECIDA.');
          setTimeout(() => {
            setIsIdVerified(true);
            setStep(2);
            setIsVerifying(false);
            setProgress(30);
          }, 700);
        }, 700);
      }, 700);
    }, 700);
  };
  
  const handleDepositClick = () => {
    window.open(broker.depositUrl, 'brokerWindow');
    setDepositClicked(true);
    setStep(3);
    setProgress(50);
  }

  const handleOpenOperation = () => {
    window.open(broker.traderoomUrl, 'brokerWindow');
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
      const animatedValue =
        startBalance + (targetBalance - startBalance) * percentage;
      setCurrentBalance(animatedValue);

      if (elapsed < duration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentBalance(targetBalance);
        setIsAnimatingBalance(false);
        setStep(5);
        setProgress(100);
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleExecuteBug = () => {
    if (!isSystemOnline) {
      setShowFailureMessage(true);
      return;
    }
    setShowFailureMessage(false);
    setIsBugModalOpen(true);
  };

  const onBugAnimationComplete = () => {
    setIsBugModalOpen(false);
    const targetBalance = initialBalance * 10;
    animateBalance(targetBalance);
  };

  const handleWithdraw = () => {
    window.open(broker.withdrawUrl, 'brokerWindow');
    setIsWithdrawClicked(true);
  };

  const resetSimulation = () => {
    setStep(1);
    setInitialBalance(0);
    setCurrentBalance(0);
    setIsFailureModalOpen(false);
    setUserId('');
    setIsIdVerified(false);
    setProgress(0);
    setIsWithdrawClicked(false);
    setDepositSelected(false);
    setVerificationStatus('');
    setDepositClicked(false);
    setShowFailureMessage(false);
    setIsSystemOnline(false);
    setHasConfirmedCreation(false);
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 text-primary">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-bold tracking-[0.2em] text-white text-center md:text-left">
            PAINEL DE CONTROLE
          </h2>
          <div className="space-y-3">
             <StepItem icon={<ArrowRight />} text="PASSO 1: CRIAR E VALIDAR CONTA" isActive={step === 1}>
                <p className="text-primary/80 mb-4">
                    Para começar, crie sua conta na corretora usando o link abaixo.
                </p>
                <Button asChild className="w-full mb-4">
                    <a
                        href={affiliateLink}
                        target="_blank"
                    >
                        Clique aqui para criar sua conta
                    </a>
                </Button>
                
                <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                        id="confirm-creation" 
                        checked={hasConfirmedCreation}
                        onCheckedChange={(checked) => setHasConfirmedCreation(checked as boolean)}
                        disabled={isIdVerified}
                    />
                    <Label
                        htmlFor="confirm-creation"
                        className="text-sm font-medium leading-none text-primary/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Criei minha conta pelo link
                    </Label>
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='userId' className="text-xs font-bold tracking-widest text-white">
                        SEU ID DE USUÁRIO
                    </Label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative flex-grow w-full">
                            <Input
                                id="userId"
                                type={showId ? 'text' : 'password'}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Insira seu ID aqui"
                                value={userId}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*$/.test(value)) {
                                    setUserId(value);
                                    }
                                }}
                                className="bg-black/50 border-primary/30 h-10 md:h-12 pr-10"
                                disabled={isIdVerified || !hasConfirmedCreation}
                            />
                            <button
                                type="button"
                                onClick={() => setShowId(!showId)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50"
                            >
                                {showId ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                        <Button
                            onClick={handleVerifyId}
                            disabled={!userId || userId.length < 5 || isIdVerified || isVerifying || !hasConfirmedCreation}
                            variant="outline"
                            className="bg-black/50 border-primary/30 h-10 md:h-12 w-full sm:w-auto hover:bg-primary/10"
                        >
                            {isVerifying ? <Loader2 className="animate-spin" /> : 'VALIDAR'}
                        </Button>
                    </div>
                    {verificationStatus && (
                        <p className={cn(
                        'text-xs font-mono pt-2',
                        verificationStatus.includes('ERRO') ? 'text-red-500' : 'text-primary/70'
                        )}>
                        {verificationStatus}
                        </p>
                    )}
                </div>
            </StepItem>

            <StepItem icon={<CircleDollarSign />} text="PASSO 2: FAZER O DEPÓSITO" isActive={step === 2}>
                <p className="text-primary/80 mb-4">Selecione o valor a ser depositado para multiplicar por 10x.</p>
                 <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                    <span className="font-mono text-lg w-full sm:w-28 text-white">R$ {initialBalance.toFixed(2)}</span>
                    <Slider
                        value={[initialBalance]}
                        onValueChange={(value) => {
                            setInitialBalance(value[0]);
                            setCurrentBalance(value[0]);
                            setDepositSelected(value[0] > 0);
                        }}
                        max={1000}
                        step={100}
                        disabled={step !== 2}
                    />
                 </div>
                 <div className="flex gap-2 mt-4">
                    <Button onClick={handleDepositClick} disabled={!depositSelected || step !== 2} className="w-full">
                        IR PARA DEPÓSITO
                    </Button>
                 </div>
            </StepItem>

            <StepItem icon={<AreaChart />} text="PASSO 3: ABRIR AMBIENTE DE OPERAÇÃO" isActive={step === 3}>
                <p className="text-primary/80 mb-4">Inicie uma operação com seu saldo.</p>
                <Button onClick={handleOpenOperation} disabled={step !== 3} className="w-full">
                    ABRIR OPERAÇÃO
                </Button>
            </StepItem>
            
            <StepItem icon={<Shield />} text="PASSO 4: EXECUTAR O BUG" isActive={step === 4}>
                <p className="text-primary/80 mb-4">Execute o BUG para multiplicar o saldo e aguarde.</p>
                <Button onClick={handleExecuteBug} disabled={step !== 4} variant="destructive" className="w-full bg-red-600/80 hover:bg-red-600 text-white">
                    <Shield className="mr-2" /> EXECUTAR BUG
                </Button>
                 {showFailureMessage && (
                    <Alert variant="destructive" className="mt-4 bg-red-900/20 border-red-500/30">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-300 text-sm">
                            Falha na execução. Você não se cadastrou pelo botão do método ou não abriu a operação.
                        </AlertDescription>
                        <div className="mt-4 flex gap-2 justify-center">
                             <Button size="sm" variant="outline" className="text-white" onClick={() => window.open(affiliateLink, 'brokerWindow')}>Cadastro</Button>
                             <Button size="sm" variant="outline" className="text-white" onClick={resetSimulation}>Reiniciar</Button>
                        </div>
                    </Alert>
                )}
            </StepItem>
          </div>
        </div>

        <div className="lg:col-span-2 border border-primary/20 rounded-lg p-6 bg-black/40 flex flex-col justify-between">
          <h2 className="text-lg font-bold tracking-[0.2em] text-center text-white">
            SALDO EM CONTA
          </h2>
          <div className="text-center my-8">
            <p
              className={cn(
                'text-4xl sm:text-5xl font-bold text-white transition-all duration-300',
                isAnimatingBalance && 'animate-pulse'
              )}
            >
              R${' '}
              {currentBalance.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="space-y-4">
            <div className="text-center text-sm space-y-1">
              <p>
                CORRETORA:{' '}
                <span className="text-white">{broker.name.toUpperCase()}</span>
              </p>
              <p>
                ID DO USUÁRIO:{' '}
                <span className="text-white">
                  {isIdVerified ? (showId ? userId : '********') : 'N/A'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-center mb-1 text-white">Progresso</p>
              <Progress value={progress} className="h-2 bg-primary/10" />
            </div>
            {step === 5 && (
              <div className="pt-4 space-y-2">
                <Button onClick={handleWithdraw} className="w-full">
                  RETIRAR SALDO
                </Button>
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  className="w-full"
                  disabled={!isWithdrawClicked}
                >
                  REINICIAR
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isBugModalOpen}>
        <DialogContent
          className="max-w-xl bg-black/80 backdrop-blur-sm border-primary/30 text-primary"
          hideCloseButton
        >
          <DialogHeader>
            <DialogTitle className="font-mono text-white flex items-center gap-2">
              <Cpu /> {branding.appName}
            </DialogTitle>
          </DialogHeader>
          <HackerTextAnimation onComplete={onBugAnimationComplete} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isFailureModalOpen} onOpenChange={setIsFailureModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Falha na Execução</DialogTitle>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não se cadastrou pelo botão do método ou não abriu a operação.
              </AlertDescription>
            </Alert>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
             <Button
                onClick={() => {
                    window.open(affiliateLink, 'brokerWindow');
                    setIsFailureModalOpen(false);
                }}
             >
                Ir para Cadastro
            </Button>
             <Button
                onClick={resetSimulation}
                variant="secondary"
            >
                Reiniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
