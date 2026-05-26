'use client';

import { useState, useCallback, useEffect } from 'react';
import { PagoMovilTransaction, CreatePagoMovilTransactionRequest, ReviewPagoMovilTransactionRequest } from '../models/pago-movil-transaction.model';
import { pagoMovilTransactionService } from '../services/pago-movil-transaction.service';

export function usePagoMovilTransactions() {
  const [items, setItems] = useState<PagoMovilTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pagoMovilTransactionService.getAll();
      setItems(data);
    } catch {
      setError('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = useCallback(async (data: CreatePagoMovilTransactionRequest) => {
    setLoading(true);
    try {
      await pagoMovilTransactionService.create(data);
      await loadItems();
      return true;
    } catch {
      setError('Error al crear transacción');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const reviewItem = useCallback(async (id: number, data: ReviewPagoMovilTransactionRequest) => {
    setLoading(true);
    try {
      await pagoMovilTransactionService.review(id, data);
      await loadItems();
      return true;
    } catch {
      setError('Error al revisar transacción');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  return { items, loading, error, loadItems, createItem, reviewItem };
}
