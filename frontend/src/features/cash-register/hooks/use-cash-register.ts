'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegisterService } from '../services/cash-register.service';
import { CashRegister, CreateCashRegisterRequest, UpdateCashRegisterRequest } from '../models/cash-register.model';
import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';

function buildOptimistic(data: CreateCashRegisterRequest, tempId: string): CashRegister {
  return {
    id: tempId,
    name: data.name,
    code: data.code,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useCashRegisters() {
  return useOptimisticCrud<CashRegister, CreateCashRegisterRequest, UpdateCashRegisterRequest>({
    queryKey: ['cashRegisters'],
    queryFn: () => cashRegisterService.getAll(),
    createFn: (data) => cashRegisterService.create(data),
    updateFn: (id, data) => cashRegisterService.update(id, data),
    deleteFn: (id) => cashRegisterService.delete(id),
    buildOptimistic,
  });
}

export function useMyActiveSession() {
  return useQuery({
    queryKey: ['my-active-session'],
    queryFn: () => cashRegisterService.myActiveSession(),
    refetchInterval: 30_000,
  });
}

export function useOpenRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cashRegisterId, initialCash, initialCashUsd, notes }: { cashRegisterId: string; initialCash: number; initialCashUsd?: number; notes?: string }) =>
      cashRegisterService.open(cashRegisterId, { initialCash, initialCashUsd, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-active-session'] });
    },
  });
}

export function useCloseRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, countedCash, notes }: { sessionId: string; countedCash: number; notes?: string }) =>
      cashRegisterService.close(sessionId, { countedCash, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-active-session'] });
    },
  });
}
