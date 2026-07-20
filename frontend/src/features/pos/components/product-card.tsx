'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import type { LocalProduct } from '@/lib/sync/db';

interface ProductCardProps {
  product: LocalProduct;
  onAdd: (product: LocalProduct) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const { t } = useI18n();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 400);
  };

  const stockColor =
    product.stock === 0 ? 'text-destructive border-destructive/30' :
    product.stock <= 5 ? 'text-yellow-600 border-yellow-600/30' : '';

  return (
    <button
      onClick={handleClick}
      className={`relative w-full text-left border border-border/50 rounded-lg p-3 bg-card hover:bg-accent/10 hover:border-primary/40 transition-all duration-150 cursor-pointer group active:scale-[0.97] ${added ? 'border-primary bg-primary/5' : ''}`}
    >
      {added && (
        <span className="absolute top-2 right-2 text-primary">
          <Check className="h-4 w-4" />
        </span>
      )}
      <p className="text-sm font-medium leading-tight truncate pr-6">{product.name}</p>
      {product.code && (
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{product.code}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <p className="text-sm font-semibold tabular-nums">Bs. {product.price.toFixed(2)}</p>
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0 h-auto ${stockColor}`}
        >
          {product.stock === 0 ? t('pos.stock.outOfStock') : `${product.stock}`}
        </Badge>
      </div>
    </button>
  );
}
