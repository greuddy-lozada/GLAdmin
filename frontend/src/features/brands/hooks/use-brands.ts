'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Brand, CreateBrandRequest } from '../models/brand.model';
import { brandService } from '../services/brand.service';

function buildOptimistic(data: CreateBrandRequest, tempId: string): Brand {
  return {
    id: tempId,
    name: data.name,
    description: data.description,
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useBrands() {
  return useOptimisticCrud<Brand, CreateBrandRequest, Partial<CreateBrandRequest>>({
    queryKey: ['brands'],
    queryFn: () => brandService.getAll(),
    createFn: (data) => brandService.create(data),
    updateFn: (id, data) => brandService.update(id, data),
    deleteFn: (id) => brandService.delete(id),
    buildOptimistic,
  });
}
