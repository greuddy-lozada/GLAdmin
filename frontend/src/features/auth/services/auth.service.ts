import apiClient from '@/lib/api/api-client';
import { LoginRequest, LoginResponse } from '../models/auth.model';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  async getMe(): Promise<LoginResponse['user']> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.delete('/auth/logout');
  },
};
