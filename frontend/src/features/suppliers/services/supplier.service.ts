import apiClient from '@/lib/api/api-client';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '../models/supplier.model';

export const supplierService = {
  async getAll(): Promise<Supplier[]> {
    const response = await apiClient.get('/suppliers');
    return response.data.data;
  },

  async getById(id: number): Promise<Supplier> {
    const response = await apiClient.get(`/suppliers/${id}`);
    return response.data.data;
  },

  async create(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await apiClient.post('/suppliers', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateSupplierRequest): Promise<Supplier> {
    const response = await apiClient.patch(`/suppliers/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
