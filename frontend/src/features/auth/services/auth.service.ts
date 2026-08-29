import apiClient from '@/lib/api/api-client';
import { LoginRequest, LoginResponse, RefreshResponse, SelectOrgResponse } from '../models/auth.model';

export interface InvitePreview {
  email: string;
  organization: { id: string; name: string; slug: string };
  role: { id: string; name: string; slug: string };
  expiresAt: string;
}

export interface RegisterWithInviteRequest {
  code: string;
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data.data;
  },

  async getInvite(code: string): Promise<InvitePreview> {
    const response = await apiClient.get(`/auth/invites/${code}`);
    return response.data.data;
  },

  async registerWithInvite(data: RegisterWithInviteRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/register', data);
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

  async selectOrg(organizationId: string): Promise<SelectOrgResponse> {
    const response = await apiClient.post('/auth/select-org', { organizationId });
    return response.data.data;
  },
};
