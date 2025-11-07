'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MoveRight, Send, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const FormSchema = z.object({
  userId: z
    .string()
    .min(6, {
      message: 'O ID deve ter pelo menos 6 caracteres.',
    })
    .regex(/^[0-9]+$/, {
      message: 'O ID deve conter apenas números.',
    }),
});

const affiliateLinks = {
    iqOption: 'https://affiliate.iqoption.net/redir/?aff=198544&aff_model=revenue&afftrack=',
    exnova: 'https://exnova.com/lp/start-trading/?aff=198544&aff_model=revenue&afftrack=',
    telegram: 'https://t.me/Trader_chines'
};

const RegistrationButtons = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button asChild size="lg">
            <a href={affiliateLinks.iqOption} target="_blank" rel="noopener noreferrer">
                IQ Option
                <MoveRight className="ml-2 h-5 w-5" />
            </a>
        </Button>
        <Button asChild size="lg">
            <a href={affiliateLinks.exnova} target="_blank" rel="noopener noreferrer">
                Exnova
                <MoveRight className="ml-2 h-5 w-5" />
            </a>
        </Button>
    </div>
);


export default function SessaoChinesaPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFailDialog, setShowFailDialog] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      userId: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setShowFailDialog(true);
    form.reset();
  }

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    field.onChange(value);
  };
  

  return (
    <>
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2">
            <h1 className="font-headline text-5xl font-bold text-primary">SESSÃO CHINESA</h1>
            <p className="text-lg text-muted-foreground">
                Para acessar, cadastre-se em uma das plataformas abaixo e realize um depósito de qualquer valor.
            </p>
        </div>
        
        <RegistrationButtons />
        
        <Card>
          <CardHeader>
            <CardTitle>Já fez o cadastro?</CardTitle>
            <CardDescription>Insira seu ID</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent>
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                            placeholder="ID do usuário" 
                            inputMode="numeric"
                            {...field}
                            onChange={(e) => handleNumericInput(e, field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col gap-4 sm:flex-row">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar ID
                </Button>
                <Button variant="secondary" className="w-full sm:w-auto" disabled>
                  <ZoomIn className="mr-2 h-4 w-4" />
                  Entrar na Sessão
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
    
    <AlertDialog open={showFailDialog} onOpenChange={setShowFailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Falha ao entrar ❌</AlertDialogTitle>
            <AlertDialogDescription>
              Seu cadastro não foi encontrado. Por favor, certifique-se de que se cadastrou e depositou através de um dos nossos links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
             <RegistrationButtons />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction asChild className="bg-sky-500 hover:bg-sky-600">
              <a href={affiliateLinks.telegram} target="_blank" rel="noopener noreferrer">
                <Send className="mr-2 h-4 w-4" />
                Falar com Suporte
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
