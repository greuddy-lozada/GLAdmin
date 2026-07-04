'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export function SubscriptionBanner() {
  const { currentOrg } = useAuth();
  const { t, tp } = useI18n();
  const planName = currentOrg?.plan?.label ?? '';

  if (!currentOrg) return null;

  if (currentOrg.subscriptionStatus !== 'past_due' || !currentOrg.subscriptionExpiresAt) {
    return null;
  }

  const expiresAt = new Date(currentOrg.subscriptionExpiresAt);
  const graceEnd = new Date(expiresAt);
  graceEnd.setDate(graceEnd.getDate() + 7);

  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {tp('subscription.banner.pastDue', {
          date: expiresAt.toLocaleDateString('es-VE'),
          graceEnd: graceEnd.toLocaleDateString('es-VE'),
          plan: planName,
        })}
      </AlertDescription>
      <Link href="/billing">
        <Button variant="outline" size="sm">
          {t('subscription.banner.renew')}
        </Button>
      </Link>
    </Alert>
  );
}
