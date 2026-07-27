import apiClient from '@/lib/api/api-client';
import { AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest } from '../models/admin-org.model';

export const adminOrgsService = {
  async getAll(isActive?: string): Promise<AdminOrg[]> {
    const params = isActive ? { isActive } : {};
    const response = await apiClient.get('/admin/orgs', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<AdminOrg> {
    const response = await apiClient.get(`/admin/orgs/${id}`);
    return response.data.data;
  },

  async create(data: CreateAdminOrgRequest): Promise<AdminOrg> {
    const response = await apiClient.post('/admin/orgs', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateAdminOrgRequest): Promise<AdminOrg> {
    const response = await apiClient.patch(`/admin/orgs/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/orgs/${id}`);
  },

  async assignUser(orgId: string, userId: string, roleId: string): Promise<void> {
    await apiClient.post(`/admin/orgs/${orgId}/assign-user`, { userId, roleId });
  },

  async removeUser(orgId: string, userId: string): Promise<void> {
    await apiClient.post(`/admin/orgs/${orgId}/remove-user/${userId}`);
  },

  async changeUserRole(orgId: string, userId: string, roleId: string): Promise<void> {
    await apiClient.patch(`/admin/orgs/${orgId}/change-role/${userId}`, { roleId });
  },
};
