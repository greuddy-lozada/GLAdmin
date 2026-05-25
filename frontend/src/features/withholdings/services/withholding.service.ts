import apiClient from '@/lib/api/api-client';
import { Withholding, CreateWithholdingRequest, UpdateWithholdingRequest } from '../models/withholding.model';

export const withholdingService = {
  async getAll(): Promise<Withholding[]> {
    const response = await apiClient.get('/withholdings');
    return response.data.data;
  },

  async getById(id: number): Promise<Withholding> {
    const response = await apiClient.get(`/withholdings/${id}`);
    return response.data.data;
  },

  async create(data: CreateWithholdingRequest): Promise<Withholding> {
    const response = await apiClient.post('/withholdings', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateWithholdingRequest): Promise<Withholding> {
    const response = await apiClient.patch(`/withholdings/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/withholdings/${id}`);
  },
};
