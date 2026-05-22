'use client';

import { useState, useCallback, useEffect } from 'react';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../models/supplier.model';
import { supplierService } from '../services/supplier.service';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch {
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const createSupplier = useCallback(async (data: CreateSupplierRequest) => {
    setLoading(true);
    try {
      await supplierService.create(data);
      await loadSuppliers();
      return true;
    } catch {
      setError('Error al crear proveedor');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSuppliers]);

  const updateSupplier = useCallback(async (id: number, data: UpdateSupplierRequest) => {
    setLoading(true);
    try {
      await supplierService.update(id, data);
      await loadSuppliers();
      return true;
    } catch {
      setError('Error al actualizar proveedor');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSuppliers]);

  const deleteSupplier = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await supplierService.delete(id);
      await loadSuppliers();
      return true;
    } catch {
      setError('Error al eliminar proveedor');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSuppliers]);

  return { suppliers, loading, error, loadSuppliers, createSupplier, updateSupplier, deleteSupplier };
}
