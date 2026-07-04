'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest } from '../models/admin-org.model';
import { adminOrgsService } from '../services/admin-orgs.service';

function buildOptimistic(data: CreateAdminOrgRequest, tempId: number): AdminOrg {
  return {
    id: tempId,
    name: data.name,
    slug: data.slug ?? '',
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useAdminOrgs() {
  return useOptimisticCrud<AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest>({
    queryKey: ['adminOrgs'],
    queryFn: () => adminOrgsService.getAll(),
    createFn: (data) => adminOrgsService.create(data),
    updateFn: (id, data) => adminOrgsService.update(id, data),
    deleteFn: (id) => adminOrgsService.delete(id),
    buildOptimistic,
  });
}
