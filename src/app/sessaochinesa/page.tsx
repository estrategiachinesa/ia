'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Loader2, ShieldCheck, XCircle, CheckCircle, Trophy, TrendingUp, Radio } from 'lucide-react';

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
import { cn } from '@/lib/utils';

const formSchema = z.object({
  userId: z.string()
  .min(5, {
    message: 'O ID do usuário deve ter no mínimo 5 caracteres.',
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
            <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[0.6rem] font-black uppercase tracking-widest">Sincronizando...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={cn("relative inline-flex rounded-full h-3 w-3", isOnline ? 'bg-green-500' : 'bg-red-500')}></span>
                </span>
                <span className={cn("text-xs font-black uppercase tracking-widest", isOnline ? 'text-green-500' : 'text-red-500')}>
                    {isOnline ? 'Sessão Online' : 'Sessão Offline'}
                </span>
            </div>
            {isOnline && <span className="text-[0.5rem] font-bold text-green-500/50 animate-pulse">TRANSMISSÃO AO VIVO</span>}
        </div>
    )
}

function Scoreboard({ wins, losses, isLoading }: { wins: number | undefined, losses: number | undefined, isLoading: boolean }) {
    if (isLoading) {
        return <div className="h-10 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
    }
    
    const w = wins || 0;
    const l = losses || 0;
    const total = w + l;
    const assertiveness = total > 0 ? ((w / total) * 100).toFixed(1) : "0.0";

    return (
        <div className='text-center'>
            <div className="flex justify-center items-center gap-4">
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-green-500">{w}</span>
                    <span className="text-[0.5rem] font-bold opacity-30 uppercase">Wins</span>
                </div>
                <span className="text-xl font-black opacity-20">:</span>
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-red-500">{l}</span>
                    <span className="text-[0.5rem] font-bold opacity-30 uppercase">Losses</span>
                </div>
            </div>
            <div className="mt-2 px-3 py-0.5 bg-white/5 rounded-full border border-white/5">
                <p className="text-[0.55rem] text-muted-foreground uppercase font-black tracking-tighter">
                    Assertividade: <span className="text-primary">{assertiveness}%</span>
                </p>
            </div>
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

    const isOnline = (statusData as any)?.isOnline;
    const wins = (scoreData as any)?.wins;
    const losses = (scoreData as any)?.losses;
    const managedLink = (statusData as any)?.zoomLink;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          userId: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore) return;
        
        setIsSubmitting(true);
        try {
            // Busca no banco de dados se o ID da corretora existe na coleção vipRequests
            const q = query(
              collection(firestore, 'vipRequests'), 
              where('brokerId', '==', values.userId),
              limit(1)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                setIsIdConfirmed(true);
                toast({
                    title: 'Acesso Verificado!',
                    description: 'Seu ID está ativo sob nossa rede. Pode entrar na sala.',
                });
            } else {
                setFailureAlertOpen(true);
                form.reset();
            }
        } catch (error) {
            console.error("Erro ao validar ID:", error);
            toast({
                variant: 'destructive',
                title: 'Erro na Verificação',
                description: 'Não foi possível validar seu acesso no momento.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    function handleEnterSession() {
        if (!isOnline) {
            toast({
                variant: 'destructive',
                title: 'Sessão Offline',
                description: 'Aguarde o horário da sessão para entrar na sala.',
            });
            return;
        }

        const finalLink = managedLink || config?.telegramUrl || 'https://t.me/Trader_Chines';

        toast({
            title: managedLink ? 'Redirecionando para a Live...' : 'Redirecionando para o Canal...',
            description: 'A abrir a Sala VIP da Estratégia Chinesa.',
        });
        
        window.open(finalLink, '_blank');
    }

    return (
        <div className="theme-premium">
            <div className="fixed inset-0 -z-20 h-full w-full grid-bg" />
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background/80 to-background" />

            <div className="flex flex-col min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6 pb-24">
                    
                    <div className="flex justify-center mb-2">
                        <div className="p-4 bg-primary/10 rounded-full border border-primary/20 shadow-2xl shadow-primary/10 animate-pulse">
                            <Radio className="h-10 w-10 text-primary" />
                        </div>
                    </div>

                    <Card className="w-full bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="font-headline text-3xl font-black uppercase tracking-tighter">Sessão Chinesa</CardTitle>
                            <CardDescription className="text-[0.65rem] font-bold uppercase opacity-50 tracking-[0.2em]">Exclusivo para Membros VIP</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-3">
                                 <Card className='p-4 bg-white/5 border-white/5 flex items-center justify-center text-center'>
                                    <StatusIndicator isOnline={isOnline} isLoading={isStatusLoading} />
                                 </Card>
                                 <Card className='p-4 bg-white/5 border-white/5 flex items-center justify-center'>
                                     <Scoreboard wins={wins} losses={losses} isLoading={isScoreLoading} />
                                 </Card>
                            </div>
                            
                            <div className='space-y-4 pt-2'>
                               <div className="text-center">
                                  <p className='text-[0.6rem] font-black text-muted-foreground uppercase tracking-widest opacity-60'>Validação de Acesso</p>
                                  <p className='text-xs font-bold text-foreground/80 mt-1'>Insira seu ID da Corretora (IQ/Exnova)</p>
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
                                                            placeholder="00000000" 
                                                            {...field}
                                                            type="text"
                                                            pattern="[0-9]*"
                                                            inputMode="numeric"
                                                            disabled={isIdConfirmed}
                                                            className="bg-black/40 border-white/10 h-14 text-center text-xl font-mono tracking-[0.3em] rounded-xl focus:ring-primary/20"
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (/^\d{0,20}$/.test(val)) {
                                                                    field.onChange(val);
                                                                }
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[0.6rem] font-bold text-center uppercase" />
                                                </FormItem>
                                            )}
                                        />
                                        <Button 
                                            type="submit" 
                                            className="w-full h-14 font-black uppercase tracking-tighter bg-primary text-black hover:bg-primary/90 rounded-xl transition-all shadow-xl shadow-primary/10" 
                                            disabled={isSubmitting || isIdConfirmed}
                                        >
                                            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : (isIdConfirmed ? 'ID Verificado ✅' : 'Verificar Cadastro')}
                                        </Button>
                                    </form>
                                </Form>
                                
                                <Button
                                    onClick={handleEnterSession}
                                    className={cn(
                                        "w-full h-14 font-black uppercase tracking-tighter rounded-xl transition-all",
                                        isIdConfirmed && isOnline ? "bg-green-600 text-white hover:bg-green-700 animate-bounce mt-2" : ""
                                    )}
                                    disabled={!isIdConfirmed}
                                    variant={isIdConfirmed ? 'default' : 'outline'}
                                >
                                    <TrendingUp className="h-5 w-5 mr-2" /> Entrar na Sala VIP
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg"><Trophy className="h-5 w-5 text-primary" /></div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Como funciona?</h4>
                            <p className="text-[0.7rem] text-muted-foreground mt-1 leading-relaxed">
                                A Sessão Chinesa ocorre de segunda a sexta. O analista envia as operações em tempo real para você copiar e lucrar. É obrigatório estar cadastrado pelo nosso link para ter o ID validado no banco de dados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex justify-center gap-10 z-40">
               <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-primary transition-all" asChild>
                  <a href="/analisador">Analisador Live</a>
               </Button>
               <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 hover:text-primary transition-all" asChild>
                  <a href="/catalogador">Scanner de Elite</a>
               </Button>
               <Button variant="ghost" className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary relative" disabled>
                  Sessão Chinesa
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
               </Button>
            </footer>

            <Dialog open={isFailureAlertOpen} onOpenChange={setFailureAlertOpen}>
                <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-sm rounded-3xl">
                    <DialogHeader className="text-center items-center">
                        <div className="bg-red-500/10 p-4 rounded-full mb-2">
                            <XCircle className="h-12 w-12 text-red-500"/>
                        </div>
                        <DialogTitle className="font-headline text-2xl font-black uppercase tracking-tighter">ID Não Encontrado</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            Este ID não está registado sob o nosso link de afiliado no banco de dados. Para aceder à Sessão Chinesa, é necessário criar uma nova conta através dos botões abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0 pt-4">
                        <Button asChild className="w-full h-12 font-black uppercase tracking-tighter bg-white text-black hover:bg-white/90">
                            <AffiliateLink href={config?.exnovaUrl || '#'} target="_blank">
                                Abrir Conta Exnova
                            </AffiliateLink>
                        </Button>
                         <Button asChild variant="outline" className="w-full h-12 font-black uppercase tracking-tighter border-white/10">
                            <AffiliateLink href={config?.iqOptionUrl || '#'} target="_blank">
                                Abrir Conta IQ Option
                            </AffiliateLink>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
