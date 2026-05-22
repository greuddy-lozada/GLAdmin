'use client';

import { useState, useCallback, useEffect } from 'react';
import { Stock, CreateStockRequest, UpdateStockRequest } from '../models/stock.model';
import { stockService } from '../services/stock.service';

export function useStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockService.getAll();
      setStocks(data);
    } catch {
      setError('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const createStock = useCallback(async (data: CreateStockRequest) => {
    setLoading(true);
    try {
      await stockService.create(data);
      await loadStocks();
      return true;
    } catch {
      setError('Error al crear entrada');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStocks]);

  const updateStock = useCallback(async (id: number, data: UpdateStockRequest) => {
    setLoading(true);
    try {
      await stockService.update(id, data);
      await loadStocks();
      return true;
    } catch {
      setError('Error al actualizar entrada');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStocks]);

  const deleteStock = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await stockService.delete(id);
      await loadStocks();
      return true;
    } catch {
      setError('Error al eliminar entrada');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadStocks]);

  return { stocks, loading, error, loadStocks, createStock, updateStock, deleteStock };
}
