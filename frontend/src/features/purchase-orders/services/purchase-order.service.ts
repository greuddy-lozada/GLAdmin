import apiClient from '@/lib/api/api-client';
import { PurchaseOrder, CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest } from '../models/purchase-order.model';

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrder[]> {
    const response = await apiClient.get('/purchase-orders');
    return response.data.data;
  },

  async getById(id: number): Promise<PurchaseOrder> {
    const response = await apiClient.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  async create(data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data.data;
  },

  async update(id: number, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await apiClient.patch(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/purchase-orders/${id}`);
  },

  async receive(id: number, details: { id: number; quantity: number }[]): Promise<PurchaseOrder> {
    const response = await apiClient.post(`/purchase-orders/${id}/receive`, { details });
    return response.data;
  },
};
