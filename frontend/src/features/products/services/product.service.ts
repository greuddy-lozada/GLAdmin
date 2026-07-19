import apiClient from '@/lib/api/api-client';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  productSchema,
} from '../models/product.model';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get('/products?includeStock=true');
    return productSchema.array().parse(response.data.data);
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get(`/products/${id}`);
    return productSchema.parse(response.data.data);
  },

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post('/products', data);
    return productSchema.parse(response.data.data);
  },

  async update(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await apiClient.patch(`/products/${id}`, data);
    return productSchema.parse(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
