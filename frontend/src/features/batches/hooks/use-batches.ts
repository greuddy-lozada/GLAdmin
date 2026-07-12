'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Batch, CreateBatchRequest, UpdateBatchRequest } from '../models/batch.model';
import { batchService } from '../services/batch.service';

function buildOptimistic(data: CreateBatchRequest, tempId: string): Batch {
  return {
    id: tempId,
    code: data.code,
    description: data.description ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useBatches() {
  return useOptimisticCrud<Batch, CreateBatchRequest, UpdateBatchRequest>({
    queryKey: ['batches'],
    queryFn: () => batchService.getAll(),
    createFn: (data) => batchService.create(data),
    updateFn: (id, data) => batchService.update(id, data),
    deleteFn: (id) => batchService.delete(id),
    buildOptimistic,
  });
}
