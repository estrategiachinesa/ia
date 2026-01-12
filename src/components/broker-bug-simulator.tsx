
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Video,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Cpu,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { branding } from '@/config/branding';
import VipVslPlayer from '@/components/vip-vsl-player';
import { Progress } from '@/components/ui/progress';
import { OnlineServer } from '@/components/app/OnlineServer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';

type Step = 1 | 2 | 3 | 4 | 5;

const HackerTextAnimation = ({
  onComplete,
}: {
  onComplete: () => void;
}) => {
  const lines = [
    '> G-BREAKER.EXE INICIADO...',
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
}: {
  icon: React.ReactNode;
  text: string;
  isActive?: boolean;
}) => (
  <div
    className={cn(
      'flex items-center gap-4 border border-primary/20 rounded-lg p-4 bg-black/20 transition-all',
      !isActive && 'text-primary/30 opacity-50'
    )}
  >
    {icon}
    <span className="text-sm">{text}</span>
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
  const [isVslModalOpen, setIsVslModalOpen] = useState(false);
  const [isAnimatingBalance, setIsAnimatingBalance] = useState(false);
  const [isWithdrawClicked, setIsWithdrawClicked] = useState(false);
  const [depositSelected, setDepositSelected] = useState(false);

  const animationFrameRef = useRef<number>();

  const broker = branding.brokers[0];
  const affiliateLink = broker.affiliateLink;

  const handleSystemToggle = useCallback(() => {
    setIsSystemOnline((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ç') {
        handleSystemToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSystemToggle]);

  const handleVerifyId = () => {
    if (!userId || userId.length < 5) return;
    setIsVerifying(true);
    setVerificationStatus('> AUTENTICANDO TOKEN...');
    setProgress(10);

    setTimeout(() => {
      setVerificationStatus('> VERIFICANDO CREDENCIAIS...');
      setTimeout(() => {
        if (!isSystemOnline) {
          setVerificationStatus('> ID NÃO AUTORIZADO. O SISTEMA RECUSOU A CONEXÃO.');
          setIsVerifying(false);
          return;
        }
        setVerificationStatus('> ID VALIDADO...');
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

  const handleDeposit = () => {
    if (initialBalance > 0) {
      setCurrentBalance(initialBalance);
      setStep(3);
      setProgress(50);
    }
  };

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
      setIsFailureModalOpen(true);
      return;
    }
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
    setIsVslModalOpen(false);
    setUserId('');
    setIsIdVerified(false);
    setProgress(0);
    setIsWithdrawClicked(false);
    setDepositSelected(false);
    setVerificationStatus('');
  };

  return (
    <>
      <div
        className="absolute top-4 md:top-6 right-4 md:right-6"
      >
        <OnlineServer isActivated={isSystemOnline} onToggle={handleSystemToggle} />
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 text-primary mt-24 lg:mt-0">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-bold tracking-[0.2em]">
            PAINEL DE CONTROLE
          </h2>
          <div className="space-y-3">
            <div
              className={cn(
                'border border-primary/20 rounded-lg p-4 bg-black/40',
                step > 1 && 'opacity-50'
              )}
            >
              <div className="flex items-start gap-4">
                <ArrowRight className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="text-primary/80">
                    Para começar, crie sua conta na corretora e insira seu ID de
                    usuário abaixo.
                  </p>
                  <a
                    href={affiliateLink}
                    target="_blank"
                    className="text-primary font-bold text-lg underline hover:text-green-300 transition-colors"
                  >
                    crie sua conta clicando aqui
                  </a>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="text-xs font-bold tracking-widest">
                  SEU ID DE USUÁRIO
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                    <Input
                      id="userId"
                      type={showId ? 'text' : 'password'}
                      placeholder="Ex: 12345678"
                      value={userId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                          setUserId(value);
                        }
                      }}
                      className="bg-black/50 border-primary/30 h-12 pr-10"
                      disabled={isIdVerified}
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
                    disabled={!userId || userId.length < 5 || isIdVerified || isVerifying}
                    variant="outline"
                    className="bg-black/50 border-primary/30 h-12 hover:bg-primary/10"
                  >
                    {isVerifying ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      'VERIFICAR'
                    )}
                  </Button>
                </div>
                {verificationStatus && (
                   <p className={cn(
                    'text-xs font-mono pt-2',
                     verificationStatus.includes('NÃO AUTORIZADO') ? 'text-red-500' : 'text-primary/70'
                   )}>
                    {verificationStatus}
                   </p>
                )}
              </div>
            </div>

            <div className={cn('border border-primary/20 rounded-lg p-4 bg-black/40', step !== 2 && 'opacity-50')}>
                <p className="text-primary/80">Selecione o valor a ser depositado para multiplicar por 10x.</p>
                 <div className="flex items-center gap-4 mt-4">
                    <span className="font-mono text-lg w-28">R$ {initialBalance.toFixed(2)}</span>
                    <Slider
                        value={[initialBalance]}
                        onValueChange={(value) => {
                            setInitialBalance(value[0]);
                            setDepositSelected(value[0] > 0);
                        }}
                        max={1000}
                        step={100}
                        disabled={step !== 2}
                    />
                 </div>
                 <Button onClick={handleDeposit} disabled={!depositSelected || step !== 2} className="w-full mt-4">
                    DEPOSITAR
                 </Button>
            </div>

            <div className={cn('border border-primary/20 rounded-lg p-4 bg-black/40', step !== 3 && 'opacity-50')}>
                <p className="text-primary/80 mb-4">Clique abaixo para ir ao ambiente de operação da corretora.</p>
                <Button onClick={handleOpenOperation} disabled={step !== 3} className="w-full">
                    ABRIR OPERAÇÃO
                </Button>
            </div>
            
            <div className={cn('border border-primary/20 rounded-lg p-4 bg-black/40', step !== 4 && 'opacity-50')}>
                <p className="text-primary/80 mb-4">Execute o BUG para multiplicar o saldo.</p>
                <Button onClick={handleExecuteBug} disabled={step !== 4} variant="destructive" className="w-full bg-red-600/80 hover:bg-red-600 text-white">
                    <Shield className="mr-2" /> EXECUTAR BUG
                </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 border border-primary/20 rounded-lg p-6 bg-black/40 flex flex-col justify-between">
          <h2 className="text-lg font-bold tracking-[0.2em] text-center">
            SALDO EM CONTA
          </h2>
          <div className="text-center my-8">
            <p
              className={cn(
                'text-6xl lg:text-7xl font-bold text-white transition-all duration-300',
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
                <span className="text-white">{broker.name}</span>
              </p>
              <p>
                ID DO USUÁRIO:{' '}
                <span className="text-white">
                  {isIdVerified ? (showId ? userId : '********') : 'N/A'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-center mb-1">Progresso</p>
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
            <DialogTitle className="font-mono text-primary flex items-center gap-2">
              <Cpu /> G-BREAKER
            </DialogTitle>
          </DialogHeader>
          <HackerTextAnimation onComplete={onBugAnimationComplete} />
        </DialogContent>
      </Dialog>

      <Dialog open={isFailureModalOpen} onOpenChange={setIsFailureModalOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-sm border-destructive/50 text-white">
          <DialogHeader className="items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <DialogTitle>FALHA NA EXECUÇÃO</DialogTitle>
            <AlertDescription>
              O sistema de segurança da corretora detectou a tentativa. Motivos
              comuns: o sistema não estava "ONLINE" ou você não se cadastrou
              pelo nosso link.
            </AlertDescription>
          </DialogHeader>
            <div className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button
              onClick={() => window.open(affiliateLink, 'brokerWindow')}
              className="w-full bg-primary text-black hover:bg-primary/90"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Fazer Cadastro para Ativar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsFailureModalOpen(false);
                setIsVslModalOpen(true);
              }}
              className="w-full"
            >
              <Video className="mr-2 h-4 w-4" />
              Assistir Tutorial de Ativação
            </Button>
            <Button
              variant="outline"
              onClick={resetSimulation}
              className="w-full"
            >
              Reiniciar
            </Button>
          </div>
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
