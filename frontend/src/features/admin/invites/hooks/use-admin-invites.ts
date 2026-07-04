'use client';

import { useOptimisticCrud } from '@/hooks/use-optimistic-crud';
import { AdminInvite, CreateAdminInviteRequest } from '../models/admin-invite.model';
import { adminInvitesService } from '../services/admin-invites.service';

function buildOptimistic(data: CreateAdminInviteRequest, tempId: number): AdminInvite {
  return {
    id: tempId,
    code: '',
    email: data.email,
    organizationId: data.organizationId,
    roleId: data.roleId,
    invitedById: 0,
    used: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function useAdminInvites() {
  return useOptimisticCrud<AdminInvite, CreateAdminInviteRequest, Record<string, never>>({
    queryKey: ['adminInvites'],
    queryFn: () => adminInvitesService.getAll(),
    createFn: (data) => adminInvitesService.create(data),
    updateFn: async () => { throw new Error('invites: update not supported'); },
    deleteFn: (id) => adminInvitesService.delete(id),
    buildOptimistic,
  });
}
