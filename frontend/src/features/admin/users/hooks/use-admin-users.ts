'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { AdminUser, UpdateAdminUserRequest } from '../models/admin-user.model';
import { adminUsersService } from '../services/admin-users.service';

function buildOptimistic(data: UpdateAdminUserRequest, tempId: string): AdminUser {
  return {
    id: tempId,
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    idRole: data.roleId ?? '',
    isActive: data.isActive ?? true,
    mustChangePassword: false,
  };
}

export function useAdminUsers() {
  return useOptimisticCrud<AdminUser, UpdateAdminUserRequest, UpdateAdminUserRequest>({
    queryKey: ['adminUsers'],
    queryFn: () => adminUsersService.getAll(),
    createFn: async () => { throw new Error('admin users: create not supported'); },
    updateFn: (id, data) => adminUsersService.update(id, data),
    deleteFn: (id) => adminUsersService.deactivate(id),
    buildOptimistic,
  });
}
