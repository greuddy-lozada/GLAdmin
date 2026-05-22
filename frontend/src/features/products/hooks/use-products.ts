'use client';

import { useState, useCallback, useEffect } from 'react';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';
import { productService } from '../services/product.service';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch {
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = useCallback(async (data: CreateProductRequest) => {
    setLoading(true);
    try {
      await productService.create(data);
      await loadProducts();
      return true;
    } catch {
      setError('Error al crear producto');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: number, data: UpdateProductRequest) => {
    setLoading(true);
    try {
      await productService.update(id, data);
      await loadProducts();
      return true;
    } catch {
      setError('Error al actualizar producto');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await productService.delete(id);
      await loadProducts();
      return true;
    } catch {
      setError('Error al eliminar producto');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  return { products, loading, error, loadProducts, createProduct, updateProduct, deleteProduct };
}
