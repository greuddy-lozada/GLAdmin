'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminPlan } from '../models/admin-plan.model';
import { adminPlansService } from '../services/admin-plans.service';

export function useAdminPlans() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminPlansService.getAll();
      setPlans(data);
    } catch {
      setError('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return { plans, loading, error, loadPlans };
}
