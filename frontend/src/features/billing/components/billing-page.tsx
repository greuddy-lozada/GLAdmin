'use client';

import { useAuth } from '@/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/i18n';
import { useBilling } from '../hooks/use-billing';

export default function BillingPage() {
  const { t } = useI18n();
  const { currentOrg } = useAuth();
  const { plans, loading, checkoutLoading, error, subscribe } = useBilling();

  const currentPlanName = currentOrg?.plan?.name;

  const handleSubscribe = async (planId: number) => {
    const orgId = currentOrg?.id;
    if (!orgId) return;

    const result = await subscribe(planId, orgId);
    if (result?.url) {
      setTimeout(() => { window.location.href = result.url; }, 0);
    }
  };

  const parseFeatures = (features: string): string[] => {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return features ? features.split(',').map((f) => f.trim()).filter(Boolean) : [];
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col animate-pulse">
            <CardHeader>
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {!loading && plans.length === 0 && !error && (
        <Alert>
          <AlertDescription>{t('billing.error.load')}</AlertDescription>
        </Alert>
      )}

      {!loading && plans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans
            .filter((p) => p.isActive)
            .map((plan) => {
              const isCurrent = currentPlanName === plan.name;
              const features = parseFeatures(plan.features);

              return (
                <Card key={plan.id} className={`flex flex-col ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.label}</CardTitle>
                      {isCurrent && (
                        <Badge>{t('billing.currentPlan')}</Badge>
                      )}
                    </div>
                    <CardDescription className="text-2xl font-bold text-foreground mt-2">
                      ${plan.amount / 100}
                      <span className="text-sm font-normal text-muted-foreground">
                        {plan.interval === 'month' ? t('billing.perMonth') : t('billing.perYear')}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-4">
                    {features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">{t('billing.features')}</p>
                        <ul className="space-y-1">
                          {features.map((f: string, i: number) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-auto">
                      <Button
                        className="w-full"
                        variant={isCurrent ? 'outline' : 'default'}
                        disabled={isCurrent || checkoutLoading}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {checkoutLoading ? t('common.loading') : isCurrent ? t('billing.currentPlan') : t('billing.subscribe')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
