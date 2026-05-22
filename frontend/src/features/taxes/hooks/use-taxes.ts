'use client';

import { useState, useCallback, useEffect } from 'react';
import { Tax, CreateTaxRequest, UpdateTaxRequest } from '../models/tax.model';
import { taxService } from '../services/tax.service';

export function useTaxes() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTaxes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taxService.getAll();
      setTaxes(data);
    } catch {
      setError('Error al cargar impuestos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTaxes();
  }, [loadTaxes]);

  const createTax = useCallback(async (data: CreateTaxRequest) => {
    setLoading(true);
    try {
      await taxService.create(data);
      await loadTaxes();
      return true;
    } catch {
      setError('Error al crear impuesto');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTaxes]);

  const updateTax = useCallback(async (id: number, data: UpdateTaxRequest) => {
    setLoading(true);
    try {
      await taxService.update(id, data);
      await loadTaxes();
      return true;
    } catch {
      setError('Error al actualizar impuesto');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTaxes]);

  const deleteTax = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await taxService.delete(id);
      await loadTaxes();
      return true;
    } catch {
      setError('Error al eliminar impuesto');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadTaxes]);

  return { taxes, loading, error, loadTaxes, createTax, updateTax, deleteTax };
}
