'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { ExchangeRateDay, CreateExchangeRateRequest, UpdateExchangeRateRequest } from '../models/exchange-rate.model';
import { exchangeRateService } from '../services/exchange-rate.service';

function buildOptimistic(data: CreateExchangeRateRequest, tempId: number): ExchangeRateDay {
  return {
    id: tempId,
    date: data.date ?? new Date().toISOString(),
    rateBcvUsd: data.rateBcvUsd ?? null,
    rateParalelo: data.rateParalelo ?? null,
    source: data.source ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useExchangeRates() {
  return useOptimisticCrud<ExchangeRateDay, CreateExchangeRateRequest, UpdateExchangeRateRequest>({
    queryKey: ['exchangeRates'],
    queryFn: () => exchangeRateService.getAll(),
    createFn: (data) => exchangeRateService.create(data),
    updateFn: (id, data) => exchangeRateService.update(id, data),
    deleteFn: (id) => exchangeRateService.delete(id),
    buildOptimistic,
  });
}
