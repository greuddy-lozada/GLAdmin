'use client';

import { useState, useCallback, useEffect } from 'react';
import { ForeignExchange, CreateForeignExchangeRequest, UpdateForeignExchangeRequest } from '../models/foreign-exchange.model';
import { foreignExchangeService } from '../services/foreign-exchange.service';

export function useForeignExchanges() {
  const [items, setItems] = useState<ForeignExchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await foreignExchangeService.getAll();
      setItems(data);
    } catch {
      setError('Error al cargar tasas de cambio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = useCallback(async (data: CreateForeignExchangeRequest) => {
    setLoading(true);
    try {
      await foreignExchangeService.create(data);
      await loadItems();
      return true;
    } catch {
      setError('Error al crear tasa de cambio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: number, data: UpdateForeignExchangeRequest) => {
    setLoading(true);
    try {
      await foreignExchangeService.update(id, data);
      await loadItems();
      return true;
    } catch {
      setError('Error al actualizar tasa de cambio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await foreignExchangeService.delete(id);
      await loadItems();
      return true;
    } catch {
      setError('Error al eliminar tasa de cambio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  return { items, loading, error, loadItems, createItem, updateItem, deleteItem };
}
