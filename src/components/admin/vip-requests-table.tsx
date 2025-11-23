'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { VipStatusBadge } from './vip-status-badge';
import { updateVipRequestStatus, type VipStatus } from '@/app/admin/actions';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

// Define the type for a single request object
export type VipRequest = {
  id: string; // Document ID from Firestore
  brokerId: string;
  userId: string;
  userEmail: string;
  status: VipStatus;
  submittedAt: Timestamp; // Keep as Firestore Timestamp for accurate sorting/display
};

type VipRequestsTableProps = {
  requests: VipRequest[];
};

export function VipRequestsTable({ requests }: VipRequestsTableProps) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusUpdate = async (userId: string, newStatus: VipStatus) => {
    setUpdatingId(userId);
    const result = await updateVipRequestStatus(userId, newStatus);
    if (result.success) {
      toast({
        title: 'Sucesso!',
        description: result.message,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result.message,
      });
    }
    setUpdatingId(null);
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleString('pt-BR');
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email do Usuário</TableHead>
            <TableHead>ID da Corretora</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.userEmail}</TableCell>
              <TableCell>{request.brokerId}</TableCell>
              <TableCell>{formatDate(request.submittedAt)}</TableCell>
              <TableCell>
                <VipStatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-right">
                {updatingId === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'AWAITING_DEPOSIT')}>
                        Aprovar Cadastro
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'PREMIUM')}>
                        Liberar Acesso PREMIUM
                      </DropdownMenuItem>
                       <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(request.id, 'REJECTED')}>
                        Rejeitar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
