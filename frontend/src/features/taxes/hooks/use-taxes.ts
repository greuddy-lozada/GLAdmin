'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Tax, CreateTaxRequest, UpdateTaxRequest } from '../models/tax.model';
import { taxService } from '../services/tax.service';

function buildOptimistic(data: CreateTaxRequest, tempId: number): Tax {
  return {
    id: tempId,
    name: data.name,
    percentage: data.percentage,
    formula: data.formula ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useTaxes() {
  return useOptimisticCrud<Tax, CreateTaxRequest, UpdateTaxRequest>({
    queryKey: ['taxes'],
    queryFn: () => taxService.getAll(),
    createFn: (data) => taxService.create(data),
    updateFn: (id, data) => taxService.update(id, data),
    deleteFn: (id) => taxService.delete(id),
    buildOptimistic,
  });
}
