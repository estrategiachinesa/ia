
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { doc } from 'firebase/firestore';
import { Loader2, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useFirebase, useDoc, useMemoFirebase, useAppConfig } from '@/firebase';
import Link from 'next/link';

// Schema for form validation
const formSchema = z.object({
  userId: z.string().min(6, {
    message: 'O ID do usuário deve ter pelo menos 6 dígitos.',
  }).regex(/^\d+$/, {
    message: "O ID deve conter apenas números."
  })
});

// Component for Status Indicator
function StatusIndicator({ isOnline, isLoading }: { isOnline: boolean | undefined, isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando status...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="font-semibold">{isOnline ? 'Sessão Online' : 'Sessão Offline'}</span>
        </div>
    )
}

// Component for Scoreboard
function Scoreboard({ wins, losses, isLoading }: { wins: number | undefined, losses: number | undefined, isLoading: boolean }) {
    if (isLoading) {
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    }
    
    const total = (wins || 0) + (losses || 0);
    const assertiveness = total > 0 ? (((wins || 0) / total) * 100).toFixed(1) : "0.0";

    return (
        <div className='text-center'>
            <div className="flex justify-center items-center gap-4 text-2xl font-bold">
                <span className="text-green-400">{wins ?? 0}</span>
                <span>:</span>
                <span className="text-red-400">{losses ?? 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Assertividade: {assertiveness}%</p>
        </div>
    )
}

export default function SessaoChinesaPage() {
    const { firestore } = useFirebase();
    const { config } = useAppConfig();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isFailureAlertOpen, setFailureAlertOpen] = React.useState(false);
    
    // Firebase real-time data subscriptions
    const statusRef = useMemoFirebase(() => firestore ? doc(firestore, 'session', 'status') : null, [firestore]);
    const scoreRef = useMemoFirebase(() => firestore ? doc(firestore, 'session', 'monthly_score') : null, [firestore]);

    const { data: statusData, isLoading: isStatusLoading } = useDoc(statusRef);
    const { data: scoreData, isLoading: isScoreLoading } = useDoc(scoreRef);

    const isOnline = (statusData as { isOnline: boolean } | null)?.isOnline;
    const wins = (scoreData as { wins: number } | null)?.wins;
    const losses = (scoreData as { losses: number } | null)?.losses;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          userId: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setFailureAlertOpen(true);
            form.reset();
        }, 1500);
    }

    return (
        <>
            <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />

            <div className="flex flex-col min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md bg-background/50 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/10">
                    <CardHeader className="text-center">
                        <div className="flex justify-center items-center gap-2 mb-2">
                            <ShieldCheck className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-3xl">Sessão Chinesa</CardTitle>
                        <CardDescription>Acesso exclusivo para membros verificados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                             <Card className='p-3 bg-card/50'>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Status da Sessão</h3>
                                <StatusIndicator isOnline={isOnline} isLoading={isStatusLoading} />
                             </Card>
                             <Card className='p-3 bg-card/50'>
                                 <h3 className="text-sm font-semibold text-muted-foreground mb-2">Placar do Mês</h3>
                                 <Scoreboard wins={wins} losses={losses} isLoading={isScoreLoading} />
                             </Card>
                        </div>
                        
                        <div className='text-center'>
                           <p className='text-sm text-muted-foreground'>Insira seu ID da corretora para tentar o acesso.</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="userId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ID de Usuário</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Apenas números" 
                                                    {...field}
                                                    type="text"
                                                    pattern="[0-9]*"
                                                    inputMode="numeric"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (/^\d*$/.test(val)) {
                                                            field.onChange(val);
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar ID
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <footer className="w-full text-center text-xs text-foreground/50 p-4 mt-8">
                  <p>© 2025 ESTRATÉGIA CHINESA. Todos os direitos reservados.</p>
                </footer>
            </div>

            <AlertDialog open={isFailureAlertOpen} onOpenChange={setFailureAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center items-center">
                        <XCircle className="h-12 w-12 text-destructive mb-2"/>
                        <AlertDialogTitle className="font-headline text-2xl">Falha ao entrar ❌</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            Não encontramos seu cadastro no sistema. É preciso se cadastrar e realizar um depósito para ter acesso à Sessão Chinesa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-4">
                        <Button asChild>
                            <Link href={config?.exnovaUrl || '#'} target="_blank">
                                Cadastrar na Exnova
                            </Link>
                        </Button>
                         <Button asChild>
                            <Link href={config?.iqOptionUrl || '#'} target="_blank">
                                Cadastrar na IQ Option
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href={config?.telegramUrl || '#'} target="_blank">
                                Falar com Suporte
                            </Link>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
