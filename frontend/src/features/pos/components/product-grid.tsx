'use client';

import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { localDb, type LocalProduct } from '@/lib/sync/db';
import { ProductCard } from './product-card';

interface ProductGridProps {
  onAddToCart: (product: LocalProduct) => void;
  refreshTrigger?: number;
}

export interface ProductGridHandle {
  focusSearch: () => void;
}

interface CategoryGroup {
  name: string;
  products: LocalProduct[];
}

export const ProductGrid = forwardRef<ProductGridHandle, ProductGridProps>(
  function ProductGrid({ onAddToCart, refreshTrigger }: ProductGridProps, ref) {
    const { t } = useI18n();
    const [allProducts, setAllProducts] = useState<LocalProduct[]>([]);
    const [categories, setCategories] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useImperativeHandle(ref, () => ({
      focusSearch: () => {
        const input = document.querySelector<HTMLInputElement>('#pos-product-search-input');
        input?.focus();
      },
    }));

    const loadProducts = () => {
      setLoading(true);
      Promise.all([
        localDb.products.toArray(),
        localDb.categories.toArray(),
      ]).then(([products, cats]) => {
        setAllProducts(products);
        const map: Record<string, string> = {};
        for (const c of cats) map[c.id] = c.name;
        setCategories(map);
        setLoading(false);
      }).catch(() => setLoading(false));
    };

    useEffect(() => { loadProducts(); }, [refreshTrigger]);

    const filtered = useMemo(() => {
      if (!query) return allProducts;
      const q = query.toLowerCase();
      return allProducts.filter(p =>
        p.name.toLowerCase().startsWith(q) || (p.code?.toLowerCase().includes(q) ?? false),
      );
    }, [allProducts, query]);

    const grouped = useMemo(() => {
      const groups: Map<string, LocalProduct[]> = new Map();
      const uncategorized: LocalProduct[] = [];

      for (const product of filtered) {
        if (product.categoryId && categories[product.categoryId]) {
          const catName = categories[product.categoryId];
          if (!groups.has(catName)) groups.set(catName, []);
          groups.get(catName)!.push(product);
        } else {
          uncategorized.push(product);
        }
      }

      const result: CategoryGroup[] = [];
      for (const [name, products] of groups) {
        result.push({ name, products });
      }
      if (uncategorized.length > 0) {
        result.push({ name: t('products.uncategorized'), products: uncategorized });
      }
      return result;
    }, [filtered, categories, t]);

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t('pos.loading')}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="pos-product-search-input"
            placeholder={t('pos.searchProducts')}
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t('pos.detail.empty')}
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.name}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {group.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {group.products.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);
