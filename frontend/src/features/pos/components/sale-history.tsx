'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { localDb, type LocalSale } from '@/lib/sync/db';

export function SaleHistory() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sales, setSales] = useState<LocalSale[]>([]);

  useEffect(() => {
    if (!open) return;
    localDb.sales.orderBy('id').reverse().limit(10).toArray().then(setSales);
  }, [open]);

  return (
    <div className="border rounded-lg">
      <Button variant="ghost" className="w-full justify-between" onClick={() => setOpen(!open)}>
        <span className="flex items-center gap-2"><Receipt className="h-4 w-4" />{t('pos.sales.title')}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open && (
        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
          {sales.length === 0 && <p className="text-sm text-muted-foreground p-2">{t('pos.sales.empty')}</p>}
          {sales.map(s => {
            const data = s.data as { code?: string; amount?: number; date?: string };
            return (
              <div key={s.id} className="text-sm flex justify-between p-1.5 rounded hover:bg-muted/50">
                <span className="font-mono text-xs">{data.code ?? `#${s.id}`}</span>
                <span className="text-muted-foreground">${data.amount?.toFixed(2) ?? '0.00'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
