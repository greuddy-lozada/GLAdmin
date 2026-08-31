'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from '../models/admin-user.model';
import { adminUsersService } from '../services/admin-users.service';

function buildOptimistic(data: CreateAdminUserRequest, tempId: string): AdminUser {
  return {
    id: tempId,
    firstName: data.firstName,
    lastName: data.lastName,
    userName: data.userName,
    email: data.email,
    idRole: data.idRole,
    isActive: data.isActive ?? true,
    mustChangePassword: false,
  };
}

export function useAdminUsers(isActive?: string, organizationId?: string) {
  return useOptimisticCrud<AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest>({
    queryKey: ['adminUsers', isActive ?? 'true', organizationId ?? 'all'],
    queryFn: () => adminUsersService.getAll(isActive, organizationId),
    createFn: (data) => adminUsersService.create(data),
    updateFn: (id, data) => adminUsersService.update(id, data),
    deleteFn: (id) => adminUsersService.deactivate(id),
    buildOptimistic,
  });
}
