'use client';

import * as React from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { VipRequestsTable } from './vip-requests-table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function VipRequestsPanel() {
  const { firestore } = useFirebase();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vipRequests'), orderBy('submittedAt', 'desc'));
  }, [firestore]);

  const { data: requests, isLoading, error } = useCollection(requestsQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Carregando solicitações...</span>
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar solicitações</AlertTitle>
          <AlertDescription>
            Não foi possível buscar os dados do Firestore. Verifique suas permissões e a conexão.
          </AlertDescription>
        </Alert>
    )
  }

  if (!requests || requests.length === 0) {
      return (
         <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Nenhuma solicitação</AlertTitle>
            <AlertDescription>
                Ainda não há nenhuma solicitação de acesso VIP para ser gerenciada.
            </AlertDescription>
        </Alert>
      )
  }

  return <VipRequestsTable requests={requests} />;
}
