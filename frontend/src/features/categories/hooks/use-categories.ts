'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Category, CreateCategoryRequest } from '../models/category.model';
import { categoryService } from '../services/category.service';

function buildOptimistic(data: CreateCategoryRequest, tempId: number): Category {
  return {
    id: tempId,
    name: data.name,
    description: data.description,
    idParent: data.idParent,
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useCategories() {
  return useOptimisticCrud<Category, CreateCategoryRequest, Partial<CreateCategoryRequest>>({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    createFn: (data) => categoryService.create(data),
    updateFn: (id, data) => categoryService.update(id, data),
    deleteFn: (id) => categoryService.delete(id),
    buildOptimistic,
  });
}
