'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SlideForm } from '@/components/ui/slide-form';
import { useI18n } from '@/i18n';
import { useSubscriptionPayment } from '../hooks/use-subscription-payment';
import type { Plan } from '../models/billing.model';

interface BillingCashProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingCash({ plan, open, onOpenChange }: BillingCashProps) {
  const { t } = useI18n();
  const { submitting, create } = useSubscriptionPayment();
  const [error, setError] = useState('');

  const amountUsd = plan.amount / 100;

  const handleSubmit = async () => {
    setError('');
    const ok = await create({
      planId: plan.id,
      method: 'cash_usd',
    });
    if (ok) onOpenChange(false);
  };

  return (
    <SlideForm
      open={open}
      title={t('subscription.payment.cashTitle')}
      onClose={() => onOpenChange(false)}
      panel={
        <div className="space-y-6">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{t('subscription.payment.amountToPay')}</p>
            <p className="text-3xl font-bold">${amountUsd.toFixed(2)}</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-sm space-y-2">
            <p>{t('subscription.payment.cashInstructions')}</p>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            <DollarSign className="mr-2 h-5 w-5" />
            {submitting ? t('common.saving') : t('subscription.payment.cashSubmit')}
          </Button>
        </div>
      }
    >
      <></>
    </SlideForm>
  );
}
