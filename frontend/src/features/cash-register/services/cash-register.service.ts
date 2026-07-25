import apiClient from '@/lib/api/api-client';
import {
  CashRegister, RegisterSession, RegisterSettlement,
  CreateCashRegisterRequest, UpdateCashRegisterRequest,
  OpenRegisterRequest, CloseRegisterRequest,
} from '../models/cash-register.model';

export const cashRegisterService = {
  async getAll(): Promise<CashRegister[]> {
    const response = await apiClient.get('/cash-registers');
    return response.data.data;
  },

  async getById(id: string): Promise<CashRegister> {
    const response = await apiClient.get(`/cash-registers/${id}`);
    return response.data;
  },

  async create(data: CreateCashRegisterRequest): Promise<CashRegister> {
    const response = await apiClient.post('/cash-registers', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateCashRegisterRequest): Promise<CashRegister> {
    const response = await apiClient.patch(`/cash-registers/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cash-registers/${id}`);
  },

  async open(cashRegisterId: string, data: OpenRegisterRequest): Promise<RegisterSession> {
    const response = await apiClient.post(`/cash-registers/${cashRegisterId}/open`, data);
    return response.data.data;
  },

  async close(sessionId: string, data: CloseRegisterRequest): Promise<{ session: RegisterSession; settlement: RegisterSettlement }> {
    const response = await apiClient.post(`/cash-registers/sessions/${sessionId}/close`, data);
    return response.data.data;
  },

  async myActiveSession(): Promise<RegisterSession | null> {
    const response = await apiClient.get('/cash-registers/my-active-session');
    return response.data.data;
  },

  async getSessions(status?: string): Promise<RegisterSession[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/cash-registers/sessions', { params });
    return response.data.data;
  },
};
