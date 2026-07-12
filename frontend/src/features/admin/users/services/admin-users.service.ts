import apiClient from '@/lib/api/api-client';
import { AdminUser, UpdateAdminUserRequest } from '../models/admin-user.model';

export const adminUsersService = {
  async getAll(): Promise<AdminUser[]> {
    const response = await apiClient.get('/admin/users');
    return response.data.data;
  },

  async getById(id: string): Promise<AdminUser> {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data.data;
  },

  async update(id: string, data: UpdateAdminUserRequest): Promise<AdminUser> {
    const response = await apiClient.patch(`/admin/users/${id}`, data);
    return response.data.data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },
};
