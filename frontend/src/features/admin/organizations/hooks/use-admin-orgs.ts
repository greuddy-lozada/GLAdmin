'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest } from '../models/admin-org.model';
import { adminOrgsService } from '../services/admin-orgs.service';

function buildOptimistic(data: CreateAdminOrgRequest, tempId: string): AdminOrg {
  return {
    id: tempId,
    name: data.name,
    slug: data.slug ?? '',
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useAdminOrgs(isActive?: string) {
  return useOptimisticCrud<AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest>({
    queryKey: ['adminOrgs', isActive ?? 'true'],
    queryFn: () => adminOrgsService.getAll(isActive),
    createFn: (data) => adminOrgsService.create(data),
    updateFn: (id, data) => adminOrgsService.update(id, data),
    deleteFn: (id) => adminOrgsService.delete(id),
    buildOptimistic,
  });
}
