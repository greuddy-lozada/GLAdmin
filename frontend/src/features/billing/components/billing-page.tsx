'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Banknote, DollarSign } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/i18n';
import { parsePlanFeatures } from '@/lib/parse-features';
import { useBilling } from '../hooks/use-billing';
import { BillingPagoMovil } from './billing-pago-movil';
import { BillingCash } from './billing-cash';
import type { Plan } from '../models/billing.model';

const FEATURE_TO_KEY: Record<string, string> = {
  suppliers: 'billing.feature.suppliers',
  customers: 'billing.feature.customers',
  products: 'billing.feature.products',
  export: 'billing.feature.export',
  purchase_orders: 'billing.feature.purchase_orders',
  sales: 'billing.feature.sales',
  inventory: 'billing.feature.inventory',
  api_access: 'billing.feature.api_access',
  audit_log: 'billing.feature.audit_log',
  multiple_orgs: 'billing.feature.multiple_orgs',
  white_label: 'billing.feature.white_label',
  priority_support: 'billing.feature.priority_support',
};

const BASE_FEATURES = new Set(['basic_auth', 'multi_currency', 'basic_reports', 'advanced_reports']);

export default function BillingPage() {
  const { t, tp } = useI18n();
  const { currentOrg } = useAuth();
  const { plans, loading, error } = useBilling();

  const currentPlanName = currentOrg?.plan?.name;
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pagoMovilOpen, setPagoMovilOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);

  const handlePagoMovil = (plan: Plan) => {
    setSelectedPlan(plan);
    setPagoMovilOpen(true);
  };

  const handleCash = (plan: Plan) => {
    setSelectedPlan(plan);
    setCashOpen(true);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-6">
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex flex-col animate-pulse">
                <CardHeader className="p-4 pb-0">
                  <div className="h-5 w-20 bg-muted rounded" />
                  <div className="h-7 w-28 bg-muted rounded mt-1" />
                </CardHeader>
                <CardContent className="flex-1 p-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {currentOrg && currentOrg.subscriptionStatus !== 'inactive' && (
        <Alert>
          <AlertDescription className="leading-relaxed max-w-prose">
            {currentOrg.subscriptionStatus === 'active' && currentOrg.subscriptionExpiresAt
              ? tp('subscription.status.active', {
                  plan: currentOrg.plan?.label ?? '',
                  date: new Date(currentOrg.subscriptionExpiresAt).toLocaleDateString('es-VE'),
                })
              : currentOrg.subscriptionStatus === 'past_due' && currentOrg.subscriptionExpiresAt
                ? tp('subscription.status.pastDue', {
                    date: new Date(currentOrg.subscriptionExpiresAt).toLocaleDateString('es-VE'),
                  })
                : null}
          </AlertDescription>
        </Alert>
      )}
      {currentOrg && currentOrg.subscriptionStatus === 'inactive' && (
        <Alert>
          <AlertDescription className="leading-relaxed max-w-prose">
            {t('subscription.status.inactive')}
          </AlertDescription>
        </Alert>
      )}

      {!loading && plans.length === 0 && !error && (
        <Alert>
          <AlertDescription>{t('billing.error.load')}</AlertDescription>
        </Alert>
      )}

      {!loading && plans.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans
              .filter((p) => p.isActive)
              .map((plan) => {
                const isCurrent = currentPlanName === plan.name;
    const features = parsePlanFeatures(plan.features)
                    .filter((f) => !BASE_FEATURES.has(f) && FEATURE_TO_KEY[f])
                    .map((f) => t(FEATURE_TO_KEY[f]));
                const price = plan.amount / 100;

                return (
                  <Card key={plan.id} className={`flex flex-col ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="p-3 pb-0">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{plan.label}</CardTitle>
                        {isCurrent && <Badge className="text-[10px] h-5">{t('billing.currentPlan')}</Badge>}
                      </div>
                      <CardDescription className="text-lg font-bold text-foreground mt-0.5">
                        ${price}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {plan.interval === 'monthly' ? t('billing.perMonth') : t('billing.perYear')}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-1.5 p-3 pt-1.5">
                      {features.length > 0 && (
                        <ul className="space-y-0">
                          {features.map((label: string, i: number) => (
                            <li key={i} className="text-[11px] text-muted-foreground">
                              {label}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-auto space-y-1">
                        {isCurrent ? (
                          <Button className="w-full" variant="outline" disabled size="sm">
                            {t('billing.currentPlan')}
                          </Button>
                        ) : (
                          <>
                            <Button className="w-full" size="sm" onClick={() => handlePagoMovil(plan)}>
                              <Banknote className="mr-1.5 h-3.5 w-3.5" />
                              {t('subscription.payment.pagoMovil')}
                            </Button>
                            <Button className="w-full" variant="outline" size="sm" onClick={() => handleCash(plan)}>
                              <DollarSign className="mr-1.5 h-3.5 w-3.5" />
                              {t('subscription.payment.cashUsd')}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {mounted && pagoMovilOpen && selectedPlan && createPortal(
        <BillingPagoMovil plan={selectedPlan} open={pagoMovilOpen} onOpenChange={setPagoMovilOpen} />,
        document.body,
      )}
      {mounted && cashOpen && selectedPlan && createPortal(
        <BillingCash plan={selectedPlan} open={cashOpen} onOpenChange={setCashOpen} />,
        document.body,
      )}
    </div>
  );
}
