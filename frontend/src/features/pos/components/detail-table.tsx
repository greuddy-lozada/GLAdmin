'use client';

import { forwardRef } from 'react';
import { Minus, Plus, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import type { CartItem } from '../models/pos.model';
import type { LocalProduct } from '@/lib/sync/db';
import { ProductSearch } from './product-search';

interface DetailTableProps {
  items: CartItem[];
  onAddToCart: (product: LocalProduct) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export const DetailTable = forwardRef<HTMLInputElement, DetailTableProps>(
  function DetailTable({ items, onAddToCart, onUpdateQuantity, onRemove }: DetailTableProps, ref) {
    const { t } = useI18n();

    if (items.length === 0) {
      return (
        <div className="border rounded-lg p-8">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ShoppingCart className="h-10 w-10" />
            <p>{t('pos.detail.empty')}</p>
            <div className="w-full max-w-md">
              <ProductSearch ref={ref} onAddToCart={onAddToCart} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left p-2 font-medium w-8">#</th>
              <th className="text-left p-2 font-medium">Producto</th>
              <th className="text-center p-2 font-medium w-28">{t('pos.cart.quantity')}</th>
              <th className="text-right p-2 font-medium w-20">Precio</th>
              <th className="text-right p-2 font-medium w-20">Subtotal</th>
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-2 text-sm text-muted-foreground">{idx + 1}</td>
                <td className="p-2 text-sm font-medium">{item.name}</td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      className="h-7 w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); if (v > 0) onUpdateQuantity(item.productId, v); }}
                    />
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="p-2 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="p-2 text-sm text-right font-medium">${item.subtotal.toFixed(2)}</td>
                <td className="p-2">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.productId)}>
                    <X className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className="p-2">
                <ProductSearch ref={ref} onAddToCart={onAddToCart} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);
