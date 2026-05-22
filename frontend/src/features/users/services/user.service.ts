import apiClient from '@/lib/api/api-client';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/user.model';

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data.data;
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  async create(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
