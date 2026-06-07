'use client';

import { useI18n } from '@/i18n';

interface SaleSummaryProps {
  total: number;
  totalUsd: number;
  totalTax: number;
  totalTaxUsd: number;
  exchangeRate: number;
}

export function SaleSummary({ total, totalUsd, totalTax, totalTaxUsd, exchangeRate }: SaleSummaryProps) {
  const { t, tp } = useI18n();

  return (
    <div className="mt-4 border rounded-lg p-4 space-y-1 bg-muted/30">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{t('pos.cart.subtotal')}</span>
        <span>${(total - totalTax).toFixed(2)} / ${(totalUsd - totalTaxUsd).toFixed(2)}</span>
      </div>
      {totalTax > 0 && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t('pos.cart.tax')}</span>
          <span>${totalTax.toFixed(2)} / ${totalTaxUsd.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>{t('pos.cart.totalVes')}</span>
        <span>${total.toFixed(2)}</span>
      </div>
      {totalUsd > 0 && (
        <div className="flex justify-between text-sm">
          <span>{t('pos.cart.totalUsd')}</span>
          <span className="text-muted-foreground">${totalUsd.toFixed(2)}</span>
        </div>
      )}
      {exchangeRate > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{tp('pos.cart.rate', { rate: exchangeRate.toFixed(2) })}</span>
        </div>
      )}
    </div>
  );
}
