'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';
import { localDb, type LocalProduct } from '@/lib/sync/db';

interface ProductSearchProps {
  onAddToCart: (product: LocalProduct) => void;
}

export const ProductSearch = forwardRef<HTMLInputElement, ProductSearchProps>(
  function ProductSearch({ onAddToCart }: ProductSearchProps, ref) {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocalProduct[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [brandMap, setBrandMap] = useState<Record<string, string>>({});
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
    const internalRef = useRef<HTMLInputElement>(null);
    const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      localDb.brands.toArray().then((bs) => {
        const map: Record<string, string> = {};
        for (const b of bs) map[b.id] = b.name;
        setBrandMap(map);
      });
      localDb.categories.toArray().then((cs) => {
        const map: Record<string, string> = {};
        for (const c of cs) map[c.id] = c.name;
        setCategoryMap(map);
      });
    }, []);

    useEffect(() => {
      setHighlightedIndex(null);
    }, [results]);

    const handleSearch = (q: string) => {
      setQuery(q);
      clearTimeout(debounce.current);
      if (q.length < 1) { setResults([]); setOpen(false); return; }
      setLoading(true);
      debounce.current = setTimeout(() => {
        localDb.products
          .where('name').startsWithIgnoreCase(q)
          .or('code').startsWith(q)
          .limit(10)
          .toArray()
          .then(r => { setResults(r); setOpen(true); })
          .catch(err => { console.warn('Product search error:', err); setResults([]); })
          .finally(() => setLoading(false));
      }, 150);
    };

    const scrollIntoView = (idx: number) => {
      const container = listRef.current;
      if (!container) return;
      const item = container.children[idx] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    };

    const handleSelect = (product: LocalProduct) => {
      onAddToCart(product);
      setQuery('');
      setOpen(false);
      internalRef.current?.focus();
    };

    return (
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          autoFocus
          placeholder={t('pos.detail.addProduct')}
          className="pl-9 w-full border-dashed"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex(prev => {
                const next = prev === null ? 0 : prev >= results.length - 1 ? 0 : prev + 1;
                scrollIntoView(next);
                return next;
              });
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex(prev => {
                const next = prev === null ? results.length - 1 : prev <= 0 ? results.length - 1 : prev - 1;
                scrollIntoView(next);
                return next;
              });
            }
            if (e.key === 'Enter' && open && highlightedIndex !== null && results[highlightedIndex]) {
              e.preventDefault();
              handleSelect(results[highlightedIndex]);
            }
          }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        {open && results.length > 0 && (
          <div ref={listRef} className="absolute z-50 top-full mt-1 w-full bg-card border border-border/50 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {results.map((p, idx) => (
              <button key={p.id} type="button" className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 ${highlightedIndex === idx ? 'bg-accent' : 'hover:bg-accent'}`} onMouseDown={() => handleSelect(p)}>
                <span className="flex-1 font-medium">
                  {p.name}
                  {p.brandId && brandMap[p.brandId] && <span className="text-xs text-muted-foreground ml-1">({brandMap[p.brandId]})</span>}
                </span>
                <span className="text-muted-foreground">
                  {p.categoryId && categoryMap[p.categoryId] ? `${categoryMap[p.categoryId]} · ` : ''}
                  $ {(p.priceUsd ?? 0).toFixed(2)} — Bs. {(p.price ?? 0).toFixed(2)}
                </span>
                <Badge variant={p.stock <= 5 ? 'outline' : 'secondary'} className={p.stock === 0 ? 'text-destructive' : p.stock <= 5 ? 'text-yellow-600' : ''}>
                  {p.stock === 0 ? t('pos.stock.outOfStock') : `${t('pos.detail.quantity')}: ${p.stock}`}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
