import apiClient from '@/lib/api/api-client';
import { AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest } from '../models/admin-org.model';

export const adminOrgsService = {
  async getAll(): Promise<AdminOrg[]> {
    const response = await apiClient.get('/admin/orgs');
    return response.data.data;
  },

  async getById(id: number): Promise<AdminOrg> {
    const response = await apiClient.get(`/admin/orgs/${id}`);
    return response.data.data;
  },

  async create(data: CreateAdminOrgRequest): Promise<AdminOrg> {
    const response = await apiClient.post('/admin/orgs', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateAdminOrgRequest): Promise<AdminOrg> {
    const response = await apiClient.patch(`/admin/orgs/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/orgs/${id}`);
  },
};
