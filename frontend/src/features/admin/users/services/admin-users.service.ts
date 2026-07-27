import apiClient from '@/lib/api/api-client';
import { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from '../models/admin-user.model';

export const adminUsersService = {
  async getAll(isActive?: string): Promise<AdminUser[]> {
    const params = isActive ? { isActive } : {};
    const response = await apiClient.get('/admin/users', { params });
    return response.data.data;
  },

  async create(data: CreateAdminUserRequest): Promise<AdminUser> {
    const response = await apiClient.post('/admin/users', data);
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
