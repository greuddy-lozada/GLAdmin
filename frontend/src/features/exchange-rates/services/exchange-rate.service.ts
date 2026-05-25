import apiClient from '@/lib/api/api-client';
import { ExchangeRate, CreateExchangeRateRequest, UpdateExchangeRateRequest } from '../models/exchange-rate.model';

export const exchangeRateService = {
  async getAll(): Promise<ExchangeRate[]> {
    const response = await apiClient.get('/exchange-rates');
    return response.data.data;
  },

  async getLatest(): Promise<ExchangeRate | null> {
    const response = await apiClient.get('/exchange-rates/latest');
    return response.data.data;
  },

  async create(data: CreateExchangeRateRequest): Promise<ExchangeRate> {
    const response = await apiClient.post('/exchange-rates', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateExchangeRateRequest): Promise<ExchangeRate> {
    const response = await apiClient.patch(`/exchange-rates/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/exchange-rates/${id}`);
  },
};
