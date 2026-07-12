'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { PagoMovilTransaction, CreatePagoMovilTransactionRequest, ReviewPagoMovilTransactionRequest } from '../models/pago-movil-transaction.model';
import { pagoMovilTransactionService } from '../services/pago-movil-transaction.service';

function buildOptimistic(data: CreatePagoMovilTransactionRequest, tempId: string): PagoMovilTransaction {
  return {
    id: tempId,
    organizationId: '',
    userId: '',
    amountVes: data.amountVes,
    amountUsd: data.amountUsd,
    bankId: data.bankId,
    phoneNumber: data.phoneNumber,
    reference: data.reference,
    proofImage: data.proofImage ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function usePagoMovilTransactions() {
  const queryClient = useQueryClient();

  const crud = useOptimisticCrud<PagoMovilTransaction, CreatePagoMovilTransactionRequest, ReviewPagoMovilTransactionRequest>({
    queryKey: ['pagoMovilTransactions'],
    queryFn: () => pagoMovilTransactionService.getAll(),
    createFn: (data) => pagoMovilTransactionService.create(data),
    updateFn: async () => { throw new Error('transactions: update not supported — use review'); },
    deleteFn: async () => { throw new Error('transactions: delete not supported'); },
    buildOptimistic,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewPagoMovilTransactionRequest }) =>
      pagoMovilTransactionService.review(id, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pagoMovilTransactions'] });
    },
  });

  return {
    ...crud,
    review: { mutate: reviewMutation.mutate, isPending: reviewMutation.isPending },
  };
}
