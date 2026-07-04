'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';
import { productService } from '../services/product.service';

function buildOptimistic(data: CreateProductRequest, tempId: number): Product {
  return {
    id: tempId,
    code: data.code,
    name: data.name,
    price: data.price ?? 0,
    dollarPrice: data.dollarPrice,
    baseCost: data.baseCost,
    margin: data.margin ?? 20,
    idTax: data.idTax,
    idBrand: data.idBrand,
    idCategory: data.idCategory,
    observation: data.observation,
    image: data.image,
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useProducts() {
  return useOptimisticCrud<Product, CreateProductRequest, UpdateProductRequest>({
    queryKey: ['products'],
    queryFn: () => productService.getAll(),
    createFn: (data) => productService.create(data),
    updateFn: (id, data) => productService.update(id, data),
    deleteFn: (id) => productService.delete(id),
    buildOptimistic,
  });
}
