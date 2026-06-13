import apiClient from '@/lib/api/api-client';
import { Category, CreateCategoryRequest } from '../models/category.model';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get('/categories');
    return response.data.data;
  },

  async getById(id: number): Promise<Category> {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.data;
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    const response = await apiClient.post('/categories', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<CreateCategoryRequest>): Promise<Category> {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
