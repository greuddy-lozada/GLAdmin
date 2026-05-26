import apiClient from '@/lib/api/api-client';
import { Plan, CreateCheckoutSessionResponse } from '../models/billing.model';

function extractError(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as any).response;
    if (resp?.data?.message) {
      const msg = resp.data.message;
      return Array.isArray(msg) ? msg[0] : msg;
    }
  }
  return null;
}

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

export { extractError };
