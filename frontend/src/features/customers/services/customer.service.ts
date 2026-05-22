import apiClient from '@/lib/api/api-client';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../models/customer.model';

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const response = await apiClient.get('/customers');
    return response.data.data;
  },

  async getById(id: number): Promise<Customer> {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data.data;
  },

  async create(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post('/customers', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
