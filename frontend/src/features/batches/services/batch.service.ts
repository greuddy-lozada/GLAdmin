import apiClient from '@/lib/api/api-client';
import { Batch, CreateBatchRequest, UpdateBatchRequest } from '../models/batch.model';

export const batchService = {
  async getAll(): Promise<Batch[]> {
    const response = await apiClient.get('/batches');
    return response.data.data;
  },

  async getById(id: string): Promise<Batch> {
    const response = await apiClient.get(`/batches/${id}`);
    return response.data.data;
  },

  async create(data: CreateBatchRequest): Promise<Batch> {
    const response = await apiClient.post('/batches', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateBatchRequest): Promise<Batch> {
    const response = await apiClient.patch(`/batches/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/batches/${id}`);
  },
};
