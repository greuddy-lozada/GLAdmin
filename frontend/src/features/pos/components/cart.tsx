'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import type { CartItem } from '../hooks/use-pos';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  total: number;
  totalUsd: number;
}

export function Cart({ items, onUpdateQuantity, onRemove, total, totalUsd }: CartProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('pos.cart.title')}</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{t('pos.cart.empty')}</p>
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${item.unitPrice} x {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemove(item.productId)}
                  >
                    {t('pos.cart.remove')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>{t('pos.cart.totalVes')}:</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('pos.cart.totalUsd')}:</span>
              <span className="font-semibold">${totalUsd.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
