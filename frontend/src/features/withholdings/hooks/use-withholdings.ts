'use client';

import { useState, useCallback, useEffect } from 'react';
import { Withholding, CreateWithholdingRequest, UpdateWithholdingRequest } from '../models/withholding.model';
import { withholdingService } from '../services/withholding.service';

export function useWithholdings() {
  const [items, setItems] = useState<Withholding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await withholdingService.getAll();
      setItems(data);
    } catch {
      setError('Error al cargar retenciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = useCallback(async (data: CreateWithholdingRequest) => {
    setLoading(true);
    try {
      await withholdingService.create(data);
      await loadItems();
      return true;
    } catch {
      setError('Error al crear retención');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: number, data: UpdateWithholdingRequest) => {
    setLoading(true);
    try {
      await withholdingService.update(id, data);
      await loadItems();
      return true;
    } catch {
      setError('Error al actualizar retención');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await withholdingService.delete(id);
      await loadItems();
      return true;
    } catch {
      setError('Error al eliminar retención');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  return { items, loading, error, loadItems, createItem, updateItem, deleteItem };
}
