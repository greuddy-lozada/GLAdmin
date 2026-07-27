import apiClient from '@/lib/api/api-client';
import { AdminApproval } from '../models/approval.model';

export const adminApprovalsService = {
  async getAll(status?: string): Promise<AdminApproval[]> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/admin/approvals${params}`);
    return response.data.data;
  },

  async approve(id: string): Promise<void> {
    await apiClient.post(`/admin/approvals/${id}/approve`);
  },

  async reject(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/admin/approvals/${id}/reject`, { reason });
  },
};
