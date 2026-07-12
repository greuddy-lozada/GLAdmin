import apiClient from '@/lib/api/api-client';
import {
  SystemPagoMovilConfig,
  SubscriptionPayment,
  CreateSubscriptionPaymentRequest,
  ReviewSubscriptionPaymentRequest,
} from '../models/subscription-payment.model';

export const subscriptionPaymentService = {
  async getConfig(): Promise<SystemPagoMovilConfig> {
    const res = await apiClient.get('/subscription-payments/config');
    return res.data.data;
  },

  async findAll(status?: string): Promise<SubscriptionPayment[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get('/subscription-payments', { params });
    return res.data.data;
  },

  async findAllAdmin(status?: string): Promise<SubscriptionPayment[]> {
    const params = status ? { status } : {};
    const res = await apiClient.get('/subscription-payments/admin', { params });
    return res.data.data;
  },

  async create(dto: CreateSubscriptionPaymentRequest): Promise<SubscriptionPayment> {
    const res = await apiClient.post('/subscription-payments', dto);
    return res.data.data;
  },

  async review(id: string, dto: ReviewSubscriptionPaymentRequest): Promise<SubscriptionPayment> {
    const res = await apiClient.patch(`/subscription-payments/${id}/review`, dto);
    return res.data.data;
  },
};
