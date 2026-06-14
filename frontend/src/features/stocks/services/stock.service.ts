import apiClient from '@/lib/api/api-client';
import { Stock, StockAlert, CreateStockRequest, UpdateStockRequest } from '../models/stock.model';

export const stockService = {
  async getAlerts(threshold = 5): Promise<StockAlert[]> {
    const res = await apiClient.get('/stocks/alerts', { params: { threshold } });
    return res.data.data;
  },

  async getAll(): Promise<Stock[]> {
    const response = await apiClient.get('/stocks');
    return response.data.data;
  },

  async getById(id: number): Promise<Stock> {
    const response = await apiClient.get(`/stocks/${id}`);
    return response.data.data;
  },

  async create(data: CreateStockRequest): Promise<Stock> {
    const response = await apiClient.post('/stocks', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateStockRequest): Promise<Stock> {
    const response = await apiClient.patch(`/stocks/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/stocks/${id}`);
  },
};
