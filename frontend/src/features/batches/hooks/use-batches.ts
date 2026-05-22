'use client';

import { useState, useCallback, useEffect } from 'react';
import { Batch, CreateBatchRequest, UpdateBatchRequest } from '../models/batch.model';
import { batchService } from '../services/batch.service';

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await batchService.getAll();
      setBatches(data);
    } catch {
      setError('Error al cargar lotes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const createBatch = useCallback(async (data: CreateBatchRequest) => {
    setLoading(true);
    try {
      await batchService.create(data);
      await loadBatches();
      return true;
    } catch {
      setError('Error al crear lote');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadBatches]);

  const updateBatch = useCallback(async (id: number, data: UpdateBatchRequest) => {
    setLoading(true);
    try {
      await batchService.update(id, data);
      await loadBatches();
      return true;
    } catch {
      setError('Error al actualizar lote');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadBatches]);

  const deleteBatch = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await batchService.delete(id);
      await loadBatches();
      return true;
    } catch {
      setError('Error al eliminar lote');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadBatches]);

  return { batches, loading, error, loadBatches, createBatch, updateBatch, deleteBatch };
}
