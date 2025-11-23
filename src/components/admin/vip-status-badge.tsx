'use client';

import { Badge } from '@/components/ui/badge';
import { type VipStatus } from '@/app/admin/actions';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success';

const statusMap: Record<VipStatus, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: 'Pendente', variant: 'outline' },
  AWAITING_DEPOSIT: { label: 'Aguardando Depósito', variant: 'default' },
  DEPOSIT_PENDING: { label: 'Depósito em Análise', variant: 'default' },
  APPROVED: { label: 'Aprovado (VIP)', variant: 'success' },
  PREMIUM: { label: 'PREMIUM', variant: 'success' },
  REJECTED: { label: 'Rejeitado', variant: 'destructive' },
};

export function VipStatusBadge({ status }: { status: VipStatus }) {
  const { label, variant } = statusMap[status] || { label: 'Desconhecido', variant: 'secondary' };

  return <Badge variant={variant}>{label}</Badge>;
}
