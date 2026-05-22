import apiClient from '@/lib/api/api-client';
import { ForeignExchange, CreateForeignExchangeRequest, UpdateForeignExchangeRequest } from '../models/foreign-exchange.model';

export const foreignExchangeService = {
  async getAll(): Promise<ForeignExchange[]> {
    const response = await apiClient.get('/foreign-exchanges');
    return response.data.data;
  },

  async getById(id: number): Promise<ForeignExchange> {
    const response = await apiClient.get(`/foreign-exchanges/${id}`);
    return response.data.data;
  },

  async create(data: CreateForeignExchangeRequest): Promise<ForeignExchange> {
    const response = await apiClient.post('/foreign-exchanges', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateForeignExchangeRequest): Promise<ForeignExchange> {
    const response = await apiClient.patch(`/foreign-exchanges/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/foreign-exchanges/${id}`);
  },
};
