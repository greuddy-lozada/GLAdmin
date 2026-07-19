'use client';

import { ShoppingCart, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import type { CartItem } from '../models/pos.model';

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  total: number;
  totalUsd: number;
  totalTax: number;
  totalTaxUsd: number;
  exchangeRate: number;
  withholdingPercentage: number | null;
  withholdingAmount: number;
  netToCollect: number;
  onCheckout: () => void;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  total,
  totalUsd,
  totalTax,
  totalTaxUsd,
  exchangeRate,
  withholdingPercentage,
  withholdingAmount,
  netToCollect,
  onCheckout,
}: CartPanelProps) {
  const { t, tp } = useI18n();
  const hasWithholding = withholdingPercentage != null && withholdingAmount > 0;

  if (items.length === 0) {
    return (
      <div className="border border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground h-full min-h-[300px]">
        <ShoppingCart className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm font-medium mb-4">{t('pos.cart.empty')}</p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-xl flex flex-col h-full">
      <div className="p-3 border-b border-border/50 bg-muted/30">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          {t('pos.cart.title')}
          <span className="ml-auto text-xs text-muted-foreground">{items.length} {t('pos.cart.quantity')}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.productId} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="pl-3 py-2 text-xs text-muted-foreground w-6">{idx + 1}</td>
                <td className="py-2 pr-1">
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  {item.taxName && (
                    <p className="text-[10px] text-muted-foreground">{item.taxName} ({item.taxPercentage}%)</p>
                  )}
                </td>
                <td className="py-2 px-1">
                  <div className="flex items-center gap-0.5">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      className="h-6 w-12 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) onUpdateQuantity(item.productId, v); }}
                    />
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="py-2 text-right pr-2">
                  <p className="text-sm font-semibold tabular-nums">Bs. {item.subtotal.toFixed(2)}</p>
                  {item.subtotalUsd > 0 && (
                    <p className="text-[10px] text-muted-foreground tabular-nums">$ {item.subtotalUsd.toFixed(2)}</p>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.productId)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/50 bg-muted/30 rounded-b-xl p-3 space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('pos.cart.subtotal')}</span>
          <span className="tabular-nums">Bs. {(total - totalTax).toFixed(2)}</span>
        </div>
        {totalTax > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('pos.cart.tax')}</span>
            <span className="tabular-nums">Bs. {totalTax.toFixed(2)}</span>
          </div>
        )}
        {hasWithholding && (
          <div className="flex justify-between text-xs text-destructive">
            <span>{tp('pos.withholding.rate', { percentage: String(withholdingPercentage) })}</span>
            <span className="tabular-nums">-Bs. {withholdingAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border/50">
          <span>{t('pos.cart.totalVes')}</span>
          <span className="tabular-nums text-primary">Bs. {(total + totalTax).toFixed(2)}</span>
        </div>
        {totalUsd > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('pos.cart.totalUsd')}</span>
            <span className="tabular-nums">$ {(totalUsd + totalTaxUsd).toFixed(2)}</span>
          </div>
        )}
        {hasWithholding && (
          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/50 border-dashed">
            <span>{t('pos.withholding.netToCollect')}</span>
            <span className="tabular-nums text-primary">Bs. {netToCollect.toFixed(2)}</span>
          </div>
        )}
        {exchangeRate > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {tp('pos.cart.rate', { rate: exchangeRate.toFixed(2) })}
          </p>
        )}

        <Button className="w-full mt-2" size="lg" onClick={onCheckout}>
          {t('pos.payment.checkout')} — Bs. {(hasWithholding ? netToCollect : total + totalTax).toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
