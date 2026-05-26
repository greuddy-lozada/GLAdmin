import apiClient from '@/lib/api/api-client';
import { PagoMovilTransaction, CreatePagoMovilTransactionRequest, ReviewPagoMovilTransactionRequest } from '../models/pago-movil-transaction.model';

export const pagoMovilTransactionService = {
  async getAll(status?: string): Promise<PagoMovilTransaction[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/pago-movil/transactions', { params });
    return response.data.data;
  },

  async create(data: CreatePagoMovilTransactionRequest): Promise<PagoMovilTransaction> {
    const response = await apiClient.post('/pago-movil/transactions', data);
    return response.data.data;
  },

  async get(id: number): Promise<PagoMovilTransaction> {
    const response = await apiClient.get(`/pago-movil/transactions/${id}`);
    return response.data.data;
  },

  async review(id: number, data: ReviewPagoMovilTransactionRequest): Promise<PagoMovilTransaction> {
    const response = await apiClient.patch(`/pago-movil/transactions/${id}/review`, data);
    return response.data.data;
  },
};
