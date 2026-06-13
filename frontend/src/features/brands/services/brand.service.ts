import apiClient from '@/lib/api/api-client';
import { Brand, CreateBrandRequest } from '../models/brand.model';

export const brandService = {
  async getAll(): Promise<Brand[]> {
    const response = await apiClient.get('/brands');
    return response.data.data;
  },

  async getById(id: number): Promise<Brand> {
    const response = await apiClient.get(`/brands/${id}`);
    return response.data.data;
  },

  async create(data: CreateBrandRequest): Promise<Brand> {
    const response = await apiClient.post('/brands', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<CreateBrandRequest>): Promise<Brand> {
    const response = await apiClient.patch(`/brands/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/brands/${id}`);
  },
};
