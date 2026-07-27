'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { sileo } from 'sileo';
import { useI18n } from '@/i18n';
import { Plan } from '../models/billing.model';
import { billingService } from '../services/billing.service';
import { extractApiError, extractApiErrorCode } from '@/lib/api/extract-api-error';

export function useBilling() {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      sileo.success({ description: t('billing.success') });
    } else if (searchParams.get('canceled') === 'true') {
      sileo.info({ description: t('billing.canceled') });
    }
  }, [searchParams, t]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await billingService.getPlans();
      setPlans(data);
    } catch (err) {
      setError(extractApiError(err) ?? t('billing.error.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const subscribe = useCallback(async (planId: number, organizationId: number) => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const result = await billingService.createCheckoutSession(planId, organizationId);
      return result;
    } catch (err) {
      const code = extractApiErrorCode(err);
      if (code === 'BILLING.STRIPE_NOT_CONFIGURED') {
        setError(t('billing.error.notConfigured'));
      } else {
        setError(extractApiError(err) ?? t('billing.error.checkout'));
      }
      return null;
    } finally {
      setCheckoutLoading(false);
    }
  }, [t]);

  return { plans, loading, checkoutLoading, error, loadPlans, subscribe };
}
