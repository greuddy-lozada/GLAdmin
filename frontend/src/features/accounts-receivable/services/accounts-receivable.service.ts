import apiClient from '@/lib/api/api-client';
import type {
  AccountsReceivable,
  ArStatusFilter,
  RegisterArPaymentRequest,
} from '../models/accounts-receivable.model';

export const accountsReceivableService = {
  async getAll(status: ArStatusFilter = 'open'): Promise<AccountsReceivable[]> {
    const response = await apiClient.get('/accounts-receivable', {
      params: { status, limit: 100 },
    });
    return response.data.data;
  },

  async getById(id: string): Promise<AccountsReceivable> {
    const response = await apiClient.get(`/accounts-receivable/${id}`);
    return response.data.data;
  },

  async registerPayment(
    id: string,
    data: RegisterArPaymentRequest,
  ): Promise<AccountsReceivable> {
    const response = await apiClient.post(`/accounts-receivable/${id}/payments`, data);
    return response.data.data;
  },
};
