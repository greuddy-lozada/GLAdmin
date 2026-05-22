import apiClient from '@/lib/api/api-client';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/company.model';

export const companyService = {
  async getAll(): Promise<Company[]> {
    const response = await apiClient.get('/companies');
    return response.data.data;
  },

  async getById(id: number): Promise<Company> {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data.data;
  },

  async create(data: CreateCompanyRequest): Promise<Company> {
    const response = await apiClient.post('/companies', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateCompanyRequest): Promise<Company> {
    const response = await apiClient.patch(`/companies/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  },
};
