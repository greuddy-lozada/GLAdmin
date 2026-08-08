'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import type { LocalProduct } from '@/lib/sync/db';

interface ProductRowProps {
  product: LocalProduct;
  onAdd: (product: LocalProduct) => void;
  highlighted?: boolean;
}

export function ProductRow({ product, onAdd, highlighted }: ProductRowProps) {
  const { t } = useI18n();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleClick = () => {
    if (outOfStock) return;
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 350);
  };

  const stockClass =
    product.stock === 0
      ? 'text-destructive'
      : product.stock <= 5
        ? 'text-amber-600'
        : 'text-muted-foreground';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={cn(
        'flex w-full items-center gap-3 border-b border-border/40 px-3 py-2.5 text-left transition-colors',
        'hover:bg-accent/40 active:bg-accent/60',
        'disabled:cursor-not-allowed disabled:opacity-50',
        highlighted && 'bg-accent/50 ring-1 ring-inset ring-primary/30',
        added && 'bg-primary/5',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{product.name}</p>
        {product.code && (
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{product.code}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">Bs. {product.price.toFixed(2)}</p>
        <p className={cn('text-[11px] tabular-nums', stockClass)}>
          {outOfStock ? t('pos.stock.outOfStock') : `${product.stock}`}
        </p>
      </div>
      {added && (
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      )}
    </button>
  );
}
