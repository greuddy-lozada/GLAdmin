'use client';

import { useState, useCallback, useEffect } from 'react';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { userService } from '../services/user.service';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAll();
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

  const createUser = useCallback(async (data: CreateUserRequest) => {
    setLoading(true);
    try {
      await userService.create(data);
      await loadUsers();
      return true;
    } catch {
      setError('Error al crear usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (id: number, data: UpdateUserRequest) => {
    setLoading(true);
    try {
      await userService.update(id, data);
      await loadUsers();
      return true;
    } catch {
      setError('Error al actualizar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  const deleteUser = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await userService.delete(id);
      await loadUsers();
      return true;
    } catch {
      setError('Error al eliminar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadUsers]);

  return { users, loading, error, loadUsers, createUser, updateUser, deleteUser };
}
