import apiClient from '@/lib/api/api-client';
import { AdminPlan, CreateAdminPlanRequest, UpdateAdminPlanRequest } from '../models/admin-plan.model';

export const adminPlansService = {
  async getAll(): Promise<AdminPlan[]> {
    const response = await apiClient.get('/admin/plans');
    return response.data.data;
  },

  async getById(id: string): Promise<AdminPlan> {
    const response = await apiClient.get(`/admin/plans/${id}`);
    return response.data.data;
  },

  async create(data: CreateAdminPlanRequest): Promise<AdminPlan> {
    const response = await apiClient.post('/admin/plans', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateAdminPlanRequest): Promise<AdminPlan> {
    const response = await apiClient.patch(`/admin/plans/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/admin/plans/${id}`);
  },
};
