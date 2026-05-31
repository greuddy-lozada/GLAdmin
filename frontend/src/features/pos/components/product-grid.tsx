'use client';

import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import type { LocalProduct } from '@/lib/sync/db';

interface ProductGridProps {
  products: LocalProduct[];
  onAddToCart: (product: LocalProduct) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Input placeholder={t('pos.searchProducts')} className="w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <button
            type="button"
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              ${product.price} | ${product.priceUsd || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('pos.stock')}: {product.stock}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
