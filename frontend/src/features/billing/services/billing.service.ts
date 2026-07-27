import apiClient from '@/lib/api/api-client';
import { Plan, CreateCheckoutSessionResponse } from '../models/billing.model';

export const billingService = {
  async getPlans(): Promise<Plan[]> {
    const response = await apiClient.get('/admin/plans');
    return response.data.data;
  },

  async createCheckoutSession(planId: number, organizationId: number): Promise<CreateCheckoutSessionResponse> {
    const response = await apiClient.post('/payments/create-checkout-session', { planId, organizationId });
    return response.data.data;
  },
};
