'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsReceivableService } from '../services/accounts-receivable.service';
import type {
  ArStatusFilter,
  RegisterArPaymentRequest,
} from '../models/accounts-receivable.model';

export function useAccountsReceivable(status: ArStatusFilter = 'open') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['accounts-receivable', status],
    queryFn: () => accountsReceivableService.getAll(status),
  });

  const registerPayment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RegisterArPaymentRequest }) =>
      accountsReceivableService.registerPayment(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    registerPayment,
  };
}
