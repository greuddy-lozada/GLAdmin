import apiClient from '@/lib/api/api-client';
import type {
  AccountsPayable,
  ApStatusFilter,
  RegisterApPaymentRequest,
} from '../models/accounts-payable.model';

export const accountsPayableService = {
  async getAll(status: ApStatusFilter = 'open'): Promise<AccountsPayable[]> {
    const response = await apiClient.get('/accounts-payable', {
      params: { status, limit: 100 },
    });
    return response.data.data;
  },

  async getById(id: string): Promise<AccountsPayable> {
    const response = await apiClient.get(`/accounts-payable/${id}`);
    return response.data.data;
  },

  async registerPayment(
    id: string,
    data: RegisterApPaymentRequest,
  ): Promise<AccountsPayable> {
    const response = await apiClient.post(`/accounts-payable/${id}/payments`, data);
    return response.data.data;
  },
};
