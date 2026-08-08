'use client';

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type KeyboardEvent,
} from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import { localDb, type LocalProduct } from '@/lib/sync/db';
import { ProductRow } from './product-row';

interface ProductGridProps {
  onAddToCart: (product: LocalProduct) => void;
  refreshTrigger?: number;
}

export interface ProductGridHandle {
  focusSearch: () => void;
}

const ALL = '__all__';

export const ProductGrid = forwardRef<ProductGridHandle, ProductGridProps>(
  function ProductGrid({ onAddToCart, refreshTrigger }: ProductGridProps, ref) {
    const { t } = useI18n();
    const [allProducts, setAllProducts] = useState<LocalProduct[]>([]);
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [categoryId, setCategoryId] = useState(ALL);
    const [highlighted, setHighlighted] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focusSearch: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      setLoading(true);
      Promise.all([localDb.products.toArray(), localDb.categories.toArray()])
        .then(([products, cats]) => {
          setAllProducts(products);
          const map: Record<string, string> = {};
          for (const c of cats) map[c.id] = c.name;
          setCategoryMap(map);
        })
        .catch(console.warn)
        .finally(() => setLoading(false));
    }, [refreshTrigger]);

    const chips = useMemo(() => {
      const used = new Set<string>();
      for (const p of allProducts) {
        if (p.categoryId && categoryMap[p.categoryId]) used.add(p.categoryId);
      }
      return [...used]
        .map((id) => ({ id, name: categoryMap[id] }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }, [allProducts, categoryMap]);

    const filtered = useMemo(() => {
      let list = allProducts;
      if (categoryId !== ALL) {
        list = list.filter((p) => p.categoryId === categoryId);
      }
      const q = query.trim().toLowerCase();
      if (q) {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.code?.toLowerCase().includes(q) ?? false),
        );
      }
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }, [allProducts, categoryId, query]);

    useEffect(() => {
      setHighlighted(0);
    }, [query, categoryId, filtered.length]);

    useEffect(() => {
      const container = listRef.current;
      if (!container) return;
      const item = container.querySelector<HTMLElement>(`[data-row-index="${highlighted}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }, [highlighted]);

    const addProduct = (product: LocalProduct) => {
      if (product.stock <= 0) return;
      onAddToCart(product);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const product = filtered[highlighted] ?? filtered[0];
        if (product) addProduct(product);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setQuery('');
        setHighlighted(0);
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t('pos.loading')}
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="pos-product-search-input"
            placeholder={t('pos.searchProducts')}
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoFocus
          />
        </div>

        {chips.length > 0 && (
          <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Chip
              active={categoryId === ALL}
              onClick={() => setCategoryId(ALL)}
              label={t('pos.allCategories')}
            />
            {chips.map((c) => (
              <Chip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                label={c.name}
              />
            ))}
          </div>
        )}

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/50 bg-card"
          role="listbox"
          aria-label={t('pos.searchProducts')}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              {t('pos.detail.empty')}
            </div>
          ) : (
            filtered.map((product, index) => (
              <div key={product.id} data-row-index={index} role="option" aria-selected={highlighted === index}>
                <ProductRow
                  product={product}
                  onAdd={addProduct}
                  highlighted={highlighted === index}
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/60 bg-background text-muted-foreground hover:bg-accent/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}
