'use client';

import { useState, useCallback, useEffect } from 'react';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/company.model';
import { companyService } from '../services/company.service';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getAll();
      setCompanies(data);
    } catch {
      setError('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const createCompany = useCallback(async (data: CreateCompanyRequest) => {
    setLoading(true);
    try {
      await companyService.create(data);
      await loadCompanies();
      return true;
    } catch {
      setError('Error al crear empresa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCompanies]);

  const updateCompany = useCallback(async (id: number, data: UpdateCompanyRequest) => {
    setLoading(true);
    try {
      await companyService.update(id, data);
      await loadCompanies();
      return true;
    } catch {
      setError('Error al actualizar empresa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCompanies]);

  const deleteCompany = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await companyService.delete(id);
      await loadCompanies();
      return true;
    } catch {
      setError('Error al eliminar empresa');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCompanies]);

  return { companies, loading, error, loadCompanies, createCompany, updateCompany, deleteCompany };
}
