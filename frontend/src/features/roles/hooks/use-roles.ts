'use client';

import { useState, useCallback, useEffect } from 'react';
import { Role } from '../models/role.model';
import { roleService } from '../services/role.service';

export function useRoles() {
  const [items, setItems] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roleService.getAll();
      setItems(data);
    } catch {
      setError('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return { items, loading, error, loadItems };
}
