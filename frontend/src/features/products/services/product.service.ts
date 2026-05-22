import apiClient from '@/lib/api/api-client';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get('/products');
    return response.data.data;
  },

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post('/products', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    const response = await apiClient.patch(`/products/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
