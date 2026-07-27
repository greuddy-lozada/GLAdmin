'use client';

import { useState, useCallback } from 'react';
import { sileo } from 'sileo';
import { useI18n } from '@/i18n';
import { extractApiError } from '@/lib/api/extract-api-error';
import { subscriptionPaymentService } from '../services/subscription-payment.service';
import type {
  SystemPagoMovilConfig,
  SubscriptionPayment,
  CreateSubscriptionPaymentRequest,
} from '../models/subscription-payment.model';

export function useSubscriptionPayment() {
  const { t } = useI18n();
  const [config, setConfig] = useState<SystemPagoMovilConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const data = await subscriptionPaymentService.getConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Failed to load PagoMovil config', extractApiError(err));
    }
  }, []);

  const create = useCallback(async (dto: CreateSubscriptionPaymentRequest): Promise<boolean> => {
    setSubmitting(true);
    try {
      await subscriptionPaymentService.create(dto);
      sileo.success({ description: t('subscription.payment.submitted') });
      return true;
    } catch (err) {
      sileo.error({ description: extractApiError(err) ?? t('subscription.payment.error.create') });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [t]);

  return { config, submitting, loadConfig, create };
}

export function useAdminSubscriptionPayments() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await subscriptionPaymentService.findAllAdmin(status);
      setPayments(data);
    } catch (err) {
      setError(extractApiError(err) ?? t('subscription.admin.error.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const review = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    try {
      await subscriptionPaymentService.review(id, { status });
      const key = status === 'approved' ? 'subscription.admin.approved' : 'subscription.admin.rejected';
      sileo.success({ description: t(key) });
      await load();
      return true;
    } catch (err) {
      sileo.error({ description: extractApiError(err) ?? t('subscription.admin.error.review') });
      return false;
    }
  }, [t, load]);

  return { payments, loading, error, load, review };
}
