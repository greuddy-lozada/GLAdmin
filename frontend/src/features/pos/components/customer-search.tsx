'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { localDb, type LocalCustomer } from '@/lib/sync/db';

interface CustomerSearchProps {
  value?: number;
  onChange: (customerId: number | undefined, customerName?: string, customerTaxId?: string, withholdingPercentage?: number | null) => void;
}

export const CustomerSearch = forwardRef<HTMLInputElement, CustomerSearchProps>(
  function CustomerSearch({ value, onChange }: CustomerSearchProps, ref) {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocalCustomer[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<LocalCustomer | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const internalRef = useRef<HTMLInputElement>(null);
    const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!value) { setSelected(null); return; }
      localDb.customers.get(value).then(c => { if (c) setSelected(c); }).catch(console.warn);
    }, [value]);

    useEffect(() => {
      setHighlightedIndex(null);
    }, [results]);

    const handleSearch = (q: string) => {
      setQuery(q);
      clearTimeout(debounce.current);
      if (q.length < 2) { setResults([]); setOpen(false); return; }
      setLoading(true);
      debounce.current = setTimeout(() => {
        localDb.customers
          .where('firstName').startsWithIgnoreCase(q)
          .or('lastName').startsWithIgnoreCase(q)
          .or('taxId').startsWith(q)
          .limit(8)
          .toArray()
          .then(r => { setResults(r); setOpen(true); })
          .catch(err => { console.warn('Customer search error:', err); setResults([]); })
          .finally(() => setLoading(false));
      }, 200);
    };

    const scrollIntoView = (idx: number) => {
      const container = listRef.current;
      if (!container) return;
      const item = container.children[idx] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    };

    const handleSelect = (customer: LocalCustomer) => {
      setSelected(customer);
      onChange(customer.id, `${customer.firstName} ${customer.lastName}`, customer.taxId, customer.isWithholdingAgent ? customer.withholdingPercentage : null);
      setQuery('');
      setOpen(false);
    };

    const handleClear = () => {
      setSelected(null);
      onChange(undefined, undefined, undefined, null);
    };

    return (
      <div className="relative flex-1">
        {selected ? (
          <div className="flex items-center gap-2 bg-primary/10 rounded-md px-3 py-2">
            <span className="text-sm font-medium">{selected.firstName} {selected.lastName}</span>
            {selected.taxId && <span className="text-xs text-muted-foreground">({selected.taxId})</span>}
            {selected.isWithholdingAgent && (
              <span className="text-[10px] font-semibold text-primary border border-primary rounded px-1 leading-none">
                {t('pos.withholding.agentBadge')}
              </span>
            )}
            <button type="button" onClick={handleClear} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={(node) => {
                internalRef.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
              }}
              autoFocus
              placeholder={t('pos.customer.search')}
              className="pl-9"
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
              <div ref={listRef} className="absolute z-50 top-full mt-1 w-full bg-card border rounded-md shadow-lg max-h-64 overflow-y-auto">
                {results.map((c, idx) => (
                  <button key={c.id} type="button" className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${highlightedIndex === idx ? 'bg-accent' : 'hover:bg-accent'}`} onMouseDown={() => handleSelect(c)}>
                    {c.firstName} {c.lastName}
                    {c.taxId && <span className="text-xs text-muted-foreground ml-auto">{c.taxId}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);
