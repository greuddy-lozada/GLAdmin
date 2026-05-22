import apiClient from '@/lib/api/api-client';
import { Role } from '../models/role.model';

export const roleService = {
  async getAll(): Promise<Role[]> {
    const response = await apiClient.get('/roles');
    return response.data.data;
  },
};
