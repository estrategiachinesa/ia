
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { doc } from 'firebase/firestore';
import { Loader2, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';

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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { useFirebase, useDoc, useMemoFirebase, useAppConfig } from '@/firebase';
import AffiliateLink from '@/components/app/affiliate-link';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  userId: z.string()
  .min(8, {
    message: 'O ID do usuário deve ter no mínimo 8 caracteres.',
  })
  .max(20, {
    message: 'O ID do usuário não pode ter mais de 20 caracteres.',
  })
  .regex(/^\d+$/, {
    message: "O ID deve conter apenas números."
  })
});

function StatusIndicator({ isOnline, isLoading }: { isOnline: boolean | undefined, isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Status...</span>
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
            <p className="text-[0.6rem] text-muted-foreground mt-1 uppercase font-black opacity-40">Assertividade: {assertiveness}%</p>
        </div>
    )
}

export default function SessaoChinesaPage() {
    const { firestore } = useFirebase();
    const { config } = useAppConfig();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isFailureAlertOpen, setFailureAlertOpen] = React.useState(false);
    const [isIdConfirmed, setIsIdConfirmed] = React.useState(false);
    
    const statusRef = useMemoFirebase(() => firestore ? doc(firestore, 'session', 'status') : null, [firestore]);
    const scoreRef = useMemoFirebase(() => firestore ? doc(firestore, 'session', 'monthly_score') : null, [firestore]);

    const { data: statusData, isLoading: isStatusLoading } = useDoc(statusRef);
    const { data: scoreData, isLoading: isScoreLoading } = useDoc(scoreRef);

    const isOnline = (statusData as { isOnline: boolean, zoomLink?: string } | null)?.isOnline;
    const wins = (scoreData as { wins: number } | null)?.wins;
    const losses = (scoreData as { losses: number } | null)?.losses;
    const managedLink = (statusData as { isOnline: boolean, zoomLink?: string } | null)?.zoomLink;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          userId: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            if (values.userId === '12345678') {
                setIsIdConfirmed(true);
                toast({
                    title: 'ID Confirmado!',
                    description: 'Seu acesso foi verificado. Clique em "Entrar na Sessão".',
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                })
            } else {
                setFailureAlertOpen(true);
                form.reset();
            }
        }, 1500);
    }
    
    function handleEnterSession() {
        if (!isOnline) {
            toast({
                variant: 'destructive',
                title: 'Sessão Offline',
                description: 'Aguarde o horário da sessão.',
            });
            return;
        }

        const finalLink = managedLink || config?.telegramUrl || '#';

        toast({
            title: 'Entrando na Sessão...',
            description: 'Você será redirecionado em breve.',
        });
        
        window.open(finalLink, '_blank');
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
                        <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">Sessão Chinesa</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase opacity-50">Membros Verificados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                             <Card className='p-4 bg-white/5 border-white/5 flex flex-col items-center justify-center'>
                                <StatusIndicator isOnline={isOnline} isLoading={isStatusLoading} />
                             </Card>
                             <Card className='p-4 bg-white/5 border-white/5'>
                                 <Scoreboard wins={wins} losses={losses} isLoading={isScoreLoading} />
                             </Card>
                        </div>
                        
                        <div className='text-center p-2'>
                           <p className='text-xs font-bold text-muted-foreground uppercase tracking-widest'>Insira o ID da corretora para acesso:</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="userId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Seu ID Corretora" 
                                                    {...field}
                                                    type="text"
                                                    pattern="[0-9]*"
                                                    inputMode="numeric"
                                                    disabled={isIdConfirmed}
                                                    className="bg-white/5 border-white/10 h-12 text-center text-lg font-mono tracking-widest"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (/^\d{0,20}$/.test(val)) {
                                                            field.onChange(val);
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full h-12 font-black uppercase tracking-tighter bg-primary text-black hover:bg-primary/90" disabled={isSubmitting || isIdConfirmed}>
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (isIdConfirmed ? 'ID Confirmado' : 'Confirmar ID')}
                                </Button>
                            </form>
                        </Form>
                         <Button
                            onClick={handleEnterSession}
                            className="w-full h-12 font-black uppercase tracking-tighter"
                            disabled={!isIdConfirmed}
                            variant={isIdConfirmed ? 'default' : 'outline'}
                        >
                            Entrar na Sala VIP
                        </Button>
                    </CardContent>
                </Card>
                <footer className="w-full text-center text-xs text-foreground/50 p-4 mt-8">
                  <p>© 2026 ESTRATÉGIA CHINESA • Todos os direitos reservados.</p>
                </footer>
            </div>

            <Dialog open={isFailureAlertOpen} onOpenChange={setFailureAlertOpen}>
                <DialogContent className="bg-[#0a0a0a] border-white/10">
                    <DialogHeader className="text-center items-center">
                        <XCircle className="h-12 w-12 text-destructive mb-2"/>
                        <DialogTitle className="font-headline text-2xl font-black uppercase">Falha no Acesso</DialogTitle>
                        <DialogDescription className="text-sm">
                            Este ID não está registado sob o nosso link de afiliado. É necessário criar uma nova conta e realizar um depósito para aceder à Sessão Chinesa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0 pt-4">
                        <Button asChild className="w-full h-11 font-bold">
                            <AffiliateLink href={config?.exnovaUrl || '#'} target="_blank">
                                Cadastrar na Exnova
                            </AffiliateLink>
                        </Button>
                         <Button asChild variant="outline" className="w-full h-11 font-bold">
                            <AffiliateLink href={config?.iqOptionUrl || '#'} target="_blank">
                                Cadastrar na IQ Option
                            </AffiliateLink>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
