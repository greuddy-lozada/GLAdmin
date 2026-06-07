'use client';

import { useState, useCallback, useEffect } from 'react';
import { ExchangeRateDay, CreateExchangeRateRequest, UpdateExchangeRateRequest } from '../models/exchange-rate.model';
import { exchangeRateService } from '../services/exchange-rate.service';

export function useExchangeRates() {
  const [items, setItems] = useState<ExchangeRateDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exchangeRateService.getAll();
      setItems(data);
    } catch {
      setError('Error al cargar tasas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = useCallback(async (data: CreateExchangeRateRequest) => {
    setLoading(true);
    try {
      await exchangeRateService.create(data);
      await loadItems();
      return true;
    } catch {
      setError('Error al crear tasa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: number, data: UpdateExchangeRateRequest) => {
    setLoading(true);
    try {
      await exchangeRateService.update(id, data);
      await loadItems();
      return true;
    } catch {
      setError('Error al actualizar tasa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await exchangeRateService.delete(id);
      await loadItems();
      return true;
    } catch {
      setError('Error al eliminar tasa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  return { items, loading, error, loadItems, createItem, updateItem, deleteItem };
}
