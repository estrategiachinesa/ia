
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, Check, X, ChevronsRight } from 'lucide-react';
import type { SignalData } from '@/app/analisador/page';
import { CurrencyFlags } from './currency-flags';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type SignalResultProps = {
  data: SignalData;
  onReset: () => void;
};

type FeedbackStatus = 'unsubmitted' | 'submitting' | 'submitted';
type FeedbackValue = 'WIN' | 'LOSS' | 'DID_NOT_ENTER';


const FeedbackButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  value: FeedbackValue;
  currentFeedback: FeedbackValue | null;
  children: React.ReactNode;
  Icon: React.ElementType;
}> = ({ onClick, disabled, value, currentFeedback, children, Icon }) => {
    const isSelected = currentFeedback === value;
    return (
        <Button
            variant={isSelected ? 'default' : 'outline'}
            onClick={onClick}
            disabled={disabled}
            className={cn("flex-1 transition-all", {
                "bg-success text-success-foreground hover:bg-success/90": isSelected && value === 'WIN',
                "bg-destructive text-destructive-foreground hover:bg-destructive/90": isSelected && value === 'LOSS',
                "bg-muted text-muted-foreground": isSelected && value === 'DID_NOT_ENTER',
            })}
        >
            <Icon className="mr-2 h-4 w-4" />
            {children}
        </Button>
    )
}

const FeedbackForm: React.FC<{ data: SignalData, onFeedbackSubmitted: () => void }> = ({ data, onFeedbackSubmitted }) => {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [feedback, setFeedback] = React.useState<FeedbackValue | null>(null);
    const [feedbackStatus, setFeedbackStatus] = React.useState<FeedbackStatus>('unsubmitted');


    const handleFeedbackSubmit = async () => {
        if (!feedback || !firestore || !user) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível enviar o seu feedback. Tente novamente.',
            });
            return;
        }

        setFeedbackStatus('submitting');
        
        try {
            const feedbackRef = collection(firestore, 'signalFeedbacks');
            await addDoc(feedbackRef, {
                userId: user.uid,
                signalData: { // Storing a copy of the signal data
                    asset: data.asset,
                    expirationTime: data.expirationTime,
                    signal: data.signal,
                    targetTime: data.targetTime,
                    source: data.source,
                },
                result: feedback,
                submittedAt: serverTimestamp(),
            });

            toast({
                title: 'Feedback Enviado!',
                description: 'Obrigado por ajudar a melhorar a Estratégia Chinesa.',
            });
            setFeedbackStatus('submitted');
            onFeedbackSubmitted();

        } catch (error) {
            console.error("Error submitting feedback:", error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Enviar',
                description: 'Ocorreu um erro ao guardar o seu feedback. Por favor, tente novamente.',
            });
            setFeedbackStatus('unsubmitted');
        }
    };
    
    if (feedbackStatus === 'submitted') {
        return (
            <Card className="mt-4 bg-background/50 border-primary/30 p-4 text-center">
                <p className="font-semibold text-primary">Obrigado pelo seu feedback!</p>
            </Card>
        );
    }

    return (
        <Card className="mt-4 bg-background/50 border-primary/30 p-4">
            <h3 className="text-center text-sm font-semibold mb-3">Qual foi o resultado da operação?</h3>
            <div className="flex gap-2">
                <FeedbackButton 
                    value="WIN"
                    currentFeedback={feedback}
                    onClick={() => setFeedback('WIN')}
                    disabled={feedbackStatus === 'submitting'}
                    Icon={Check}
                >
                    Win
                </FeedbackButton>
                 <FeedbackButton 
                    value="LOSS"
                    currentFeedback={feedback}
                    onClick={() => setFeedback('LOSS')}
                    disabled={feedbackStatus === 'submitting'}
                    Icon={X}
                >
                    Loss
                </FeedbackButton>
                 <FeedbackButton 
                    value="DID_NOT_ENTER"
                    currentFeedback={feedback}
                    onClick={() => setFeedback('DID_NOT_ENTER')}
                    disabled={feedbackStatus === 'submitting'}
                    Icon={ChevronsRight}
                >
                    Não Operei
                </FeedbackButton>
            </div>
             <Button
                className="w-full mt-3"
                onClick={handleFeedbackSubmit}
                disabled={!feedback || feedbackStatus === 'submitting'}
            >
                {feedbackStatus === 'submitting' ? 'Enviando...' : 'Enviar Feedback'}
                <Send className="ml-2 h-4 w-4" />
            </Button>
        </Card>
    );
};


export function SignalResult({ data, onReset }: SignalResultProps) {
  const isCall = data.signal.includes('CALL');
  const [feedbackSubmitted, setFeedbackSubmitted] = React.useState(false);
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const renderStatus = () => {
    if (data.operationStatus === 'pending' && data.countdown !== null && data.countdown > 0) {
      return <p>Iniciar em: <span className="text-yellow-400">{formatTime(data.countdown)}</span></p>;
    }
    if (data.operationStatus === 'active' && data.operationCountdown !== null && data.operationCountdown > 0) {
        
        // Purchase time is over when countdown is <= 29 seconds for both 1m and 5m signals.
        const isPurchaseTimeOver = data.operationCountdown <= 29;

        const isBlinking = data.operationCountdown <= 3;

        return (
          <p>
            Finalizando em:{' '}
            <span className={cn(
                isPurchaseTimeOver ? 'text-red-500' : 'text-blue-400',
                isBlinking && 'animate-pulse'
            )}>
              {formatTime(data.operationCountdown)}
            </span>
          </p>
        );
    }
    if (data.operationStatus === 'finished') {
        return <p>✅ Operação finalizada!</p>
    }
     return <p>⏱️ Aguardando início...</p>;
  };


  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <Card
        className={cn(
          'border',
          isCall
            ? 'border-success/50 bg-success/10'
            : 'border-destructive/50 bg-destructive/10'
        )}
      >
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>🔔 Sinal Gerado!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-lg">
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Ativo:</span>
            <span className="font-bold flex items-center gap-2">
                <CurrencyFlags asset={data.asset} />
                {data.asset}
            </span>
          </div>
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Expiração:</span>
            <span className="font-bold">{data.expirationTime}</span>
          </div>
          <div
            className={`flex justify-between items-center text-2xl font-bold p-3 rounded-lg ${
              isCall ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
            }`}
          >
            <span>Ação:</span>
            <span>
              {data.signal}
            </span>
          </div>
          <div className="flex justify-between items-center text-left">
            <span className="text-muted-foreground">Hora da entrada:</span>
            <span className="font-bold">{data.targetTime}</span>
          </div>
          <div className="text-center font-bold text-xl pt-2">
             {renderStatus()}
          </div>
        </CardContent>
      </Card>

      {data.operationStatus === 'finished' && !feedbackSubmitted && (
         <FeedbackForm data={data} onFeedbackSubmitted={() => setFeedbackSubmitted(true)} />
      )}

      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={onReset} 
          className="w-full"
          disabled={data.operationStatus !== 'finished'}
        >
            <RefreshCw className="mr-2 h-4 w-4" />
            Analisar Novamente
        </Button>
      </div>
    </div>
  );
}
