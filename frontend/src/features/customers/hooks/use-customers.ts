'use client';

import { useState, useCallback, useEffect } from 'react';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../models/customer.model';
import { customerService } from '../services/customer.service';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch {
      setError('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const createCustomer = useCallback(async (data: CreateCustomerRequest) => {
    setLoading(true);
    try {
      await customerService.create(data);
      await loadCustomers();
      return true;
    } catch {
      setError('Error al crear cliente');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  const updateCustomer = useCallback(async (id: number, data: UpdateCustomerRequest) => {
    setLoading(true);
    try {
      await customerService.update(id, data);
      await loadCustomers();
      return true;
    } catch {
      setError('Error al actualizar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  const deleteCustomer = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await customerService.delete(id);
      await loadCustomers();
      return true;
    } catch {
      setError('Error al eliminar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCustomers]);

  return { customers, loading, error, loadCustomers, createCustomer, updateCustomer, deleteCustomer };
}
