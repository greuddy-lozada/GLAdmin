import apiClient from '@/lib/api/api-client';
import { Tax, CreateTaxRequest, UpdateTaxRequest } from '../models/tax.model';

export const taxService = {
  async getAll(): Promise<Tax[]> {
    const response = await apiClient.get('/taxes');
    return response.data.data;
  },

  async getById(id: number): Promise<Tax> {
    const response = await apiClient.get(`/taxes/${id}`);
    return response.data.data;
  },

  async create(data: CreateTaxRequest): Promise<Tax> {
    const response = await apiClient.post('/taxes', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateTaxRequest): Promise<Tax> {
    const response = await apiClient.patch(`/taxes/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/taxes/${id}`);
  },
};
