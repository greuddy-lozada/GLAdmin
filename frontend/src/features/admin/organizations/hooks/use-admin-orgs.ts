'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminOrg } from '../models/admin-org.model';
import { adminOrgsService } from '../services/admin-orgs.service';

export function useAdminOrgs() {
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrgsService.getAll();
      setOrgs(data);
    } catch {
      setError('Error al cargar organizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  return { orgs, loading, error, loadOrgs };
}
