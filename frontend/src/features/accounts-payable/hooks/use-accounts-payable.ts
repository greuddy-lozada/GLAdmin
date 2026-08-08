'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsPayableService } from '../services/accounts-payable.service';
import type {
  ApStatusFilter,
  RegisterApPaymentRequest,
} from '../models/accounts-payable.model';

export function useAccountsPayable(status: ApStatusFilter = 'open') {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['accounts-payable', status],
    queryFn: () => accountsPayableService.getAll(status),
  });

  const registerPayment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RegisterApPaymentRequest }) =>
      accountsPayableService.registerPayment(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    registerPayment,
  };
}
