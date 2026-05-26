import apiClient from '@/lib/api/api-client';
import { LoginRequest, LoginResponse, RefreshResponse, SelectOrgResponse } from '../models/auth.model';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  async getMe(): Promise<LoginResponse['user']> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async selectOrg(organizationId: number): Promise<SelectOrgResponse> {
    const response = await apiClient.post('/auth/select-org', { organizationId });
    return response.data.data;
  },
};
