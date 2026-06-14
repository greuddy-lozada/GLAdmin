'use client';

import { useI18n } from '@/i18n';

interface SaleSummaryProps {
  total: number;
  totalUsd: number;
  totalTax: number;
  totalTaxUsd: number;
  exchangeRate: number;
  withholdingPercentage?: number | null;
  withholdingAmount?: number;
  withholdingAmountUsd?: number;
  netToCollect?: number;
  netToCollectUsd?: number;
}

export function SaleSummary({ total, totalUsd, totalTax, totalTaxUsd, exchangeRate, withholdingPercentage, withholdingAmount, withholdingAmountUsd, netToCollect, netToCollectUsd }: SaleSummaryProps) {
  const { t, tp } = useI18n();
  const hasWithholding = withholdingPercentage != null && (withholdingAmount ?? 0) > 0;

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
      {hasWithholding && (
        <div className="flex justify-between text-sm text-destructive">
          <span>{tp('pos.withholding.rate', { percentage: String(withholdingPercentage) })}</span>
          <span>-${(withholdingAmount ?? 0).toFixed(2)} / -${(withholdingAmountUsd ?? 0).toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold pt-2 border-t">
        <span>{t('pos.cart.totalVes')}</span>
        <span>${(total + totalTax).toFixed(2)}</span>
      </div>
      {(totalUsd + totalTaxUsd) > 0 && (
        <div className="flex justify-between text-sm">
          <span>{t('pos.cart.totalUsd')}</span>
          <span className="text-muted-foreground">${(totalUsd + totalTaxUsd).toFixed(2)}</span>
        </div>
      )}
      {hasWithholding && (
        <div className="flex justify-between text-base font-semibold pt-1 border-t border-dashed">
          <span>{t('pos.withholding.netToCollect')}</span>
          <span>${(netToCollect ?? total + totalTax).toFixed(2)} / ${(netToCollectUsd ?? totalUsd + totalTaxUsd).toFixed(2)}</span>
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
