'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Receipt, Eye, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/i18n';
import { localDb, type LocalSale } from '@/lib/sync/db';
import type { CreateSaleRequest } from '../models/pos.model';

interface SaleHistoryProps {
  onSelectSale: (sale: LocalSale) => void;
}

const PAGE_SIZE = 20;

export function SaleHistory({ onSelectSale }: SaleHistoryProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState<LocalSale[]>([]);
  const [allSales, setAllSales] = useState<LocalSale[]>([]);
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
    const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  const loadAll = useCallback(async () => {
    const all = await localDb.sales.orderBy('id').reverse().toArray();
    setAllSales(all);

    const cIds = [...new Set(
      all
        .map(s => (s.data as CreateSaleRequest).idCustomer)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    )];
    if (cIds.length > 0) {
      const customers = await localDb.customers.bulkGet(cIds);
      const names: Record<string, string> = {};
      for (const c of customers) {
        if (c) names[c.id] = `${c.firstName} ${c.lastName}`;
      }
      setCustomerNames(names);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadAll();
  }, [open, loadAll]);

  const filtered = useCallback(() => {
    let result = allSales;

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s => {
        const data = s.data as CreateSaleRequest;
        if ((data.code ?? '').toLowerCase().includes(q)) return true;
        if (data.idCustomer && customerNames[data.idCustomer]?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    if (fromDate) {
      const from = new Date(fromDate).getTime();
      result = result.filter(s => {
        const data = s.data as CreateSaleRequest;
        return data.date ? new Date(data.date).getTime() >= from : true;
      });
    }

    if (toDate) {
      const to = new Date(toDate).getTime() + 86400000;
      result = result.filter(s => {
        const data = s.data as CreateSaleRequest;
        return data.date ? new Date(data.date).getTime() <= to : true;
      });
    }

    return result;
  }, [allSales, query, fromDate, toDate, customerNames]);

  useEffect(() => {
    setPage(1);
  }, [query, fromDate, toDate]);

  const paged = useCallback(() => {
    const f = filtered();
    const end = page * PAGE_SIZE;
    setHasMore(end < f.length);
    return f.slice(0, end);
  }, [filtered, page]);

  useEffect(() => {
    setSales(paged());
  }, [paged]);

  return (
    <div className="border border-border/50 rounded-lg">
      <Button variant="ghost" className="w-full justify-between" onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2"><Receipt className="h-4 w-4" />{t('pos.sales.title')}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="p-2 space-y-2 border-t border-border/50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('pos.sales.search')}
                className="pl-7 h-8 text-xs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {(fromDate || toDate || query) && (
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { setQuery(''); setFromDate(''); setToDate(''); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              className="h-8 text-xs"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title={t('pos.sales.fromDate')}
            />
            <Input
              type="date"
              className="h-8 text-xs"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title={t('pos.sales.toDate')}
            />
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {sales.length === 0 && <p className="text-sm text-muted-foreground p-2 text-center">{t('pos.sales.empty')}</p>}
            {sales.map(s => {
              const data = s.data as CreateSaleRequest;
              const custLabel = data.idCustomer ? customerNames[data.idCustomer] : '';
              const time = data.date ? new Date(data.date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <div
                  key={s.id}
                  className="text-sm flex justify-between items-center p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onSelectSale(s); }}
                  title={t('pos.sales.detail')}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Eye className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs shrink-0">#{data.code}</span>
                    <span className="text-muted-foreground truncate">{custLabel}</span>
                  </div>
                  <span className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">{time}</span>
                    <span className="text-xs font-medium tabular-nums">Bs. {data.amount?.toFixed(2)}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setPage(p => p + 1)}>
              {t('pos.sales.loadMore')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
