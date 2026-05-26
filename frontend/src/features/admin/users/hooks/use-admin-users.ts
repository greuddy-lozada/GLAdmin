'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminUser } from '../models/admin-user.model';
import { adminUsersService } from '../services/admin-users.service';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminUsersService.getAll();
      setUsers(data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return { users, loading, error, loadUsers };
}
