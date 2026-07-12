'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';
import { userService } from '../services/user.service';

function buildOptimistic(data: CreateUserRequest, tempId: string): User {
  return {
    id: tempId,
    firstName: data.firstName,
    lastName: data.lastName,
    userName: data.userName,
    email: data.email,
    idRole: data.idRole,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useUsers() {
  return useOptimisticCrud<User, CreateUserRequest, UpdateUserRequest>({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
    createFn: (data) => userService.create(data),
    updateFn: (id, data) => userService.update(id, data),
    deleteFn: (id) => userService.delete(id),
    buildOptimistic,
  });
}
