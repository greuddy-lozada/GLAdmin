'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Stock, CreateStockRequest, UpdateStockRequest } from '../models/stock.model';
import { stockService } from '../services/stock.service';

function buildOptimistic(data: CreateStockRequest, tempId: number): Stock {
  return {
    id: tempId,
    idProduct: data.idProduct,
    idSupplier: data.idSupplier,
    idBatch: data.idBatch,
    existence: data.existence,
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useStocks() {
  return useOptimisticCrud<Stock, CreateStockRequest, UpdateStockRequest>({
    queryKey: ['stocks'],
    queryFn: () => stockService.getAll(),
    createFn: (data) => stockService.create(data),
    updateFn: (id, data) => stockService.update(id, data),
    deleteFn: (id) => stockService.delete(id),
    buildOptimistic,
  });
}
