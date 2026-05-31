'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import type { LocalProduct } from '@/lib/sync/db';

interface ProductGridProps {
  products: LocalProduct[];
  onAddToCart: (product: LocalProduct) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('pos.searchProducts')}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(product => (
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
