import apiClient from '@/lib/api/api-client';
import { AdminInvite, CreateAdminInviteRequest } from '../models/admin-invite.model';

export const adminInvitesService = {
  async getAll(): Promise<AdminInvite[]> {
    const response = await apiClient.get('/admin/invites');
    return response.data.data;
  },

  async create(data: CreateAdminInviteRequest): Promise<AdminInvite> {
    const response = await apiClient.post('/admin/invites', data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/invites/${id}`);
  },
};
