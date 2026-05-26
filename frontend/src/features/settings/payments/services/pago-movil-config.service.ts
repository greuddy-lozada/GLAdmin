import apiClient from '@/lib/api/api-client';
import { PagoMovilConfig, CreatePagoMovilConfigRequest, UpdatePagoMovilConfigRequest } from '../models/pago-movil-config.model';

export const pagoMovilConfigService = {
  async get(): Promise<PagoMovilConfig | null> {
    const response = await apiClient.get('/pago-movil/config');
    return response.data.data ?? null;
  },

  async create(data: CreatePagoMovilConfigRequest): Promise<PagoMovilConfig> {
    const response = await apiClient.post('/pago-movil/config', data);
    return response.data.data;
  },

  async update(data: UpdatePagoMovilConfigRequest): Promise<PagoMovilConfig> {
    const response = await apiClient.patch('/pago-movil/config', data);
    return response.data.data;
  },

  async deactivate(): Promise<void> {
    await apiClient.delete('/pago-movil/config');
  },
};
