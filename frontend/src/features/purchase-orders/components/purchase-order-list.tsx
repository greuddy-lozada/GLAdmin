'use client';

import { useState } from 'react';
import { Search, Package, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import type { PurchaseOrder } from '../models/purchase-order.model';

interface PurchaseOrderListProps {
  orders: PurchaseOrder[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (order: PurchaseOrder) => void;
  onCreate: () => void;
  onReceive: (order: PurchaseOrder) => void;
  canReceive: boolean;
}

const STATUS_BADGE: Record<string, { className: string; dot: string }> = {
  DRAFT: { className: 'bg-muted text-muted-foreground', dot: 'bg-gray-400' },
  ISSUED: { className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400', dot: 'bg-blue-500' },
  RECEIVED: { className: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400', dot: 'bg-green-500' },
  ANNULLED: { className: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400', dot: 'bg-red-500' },
};

function StatusDot({ status }: { status?: string }) {
  const style = STATUS_BADGE[status ?? 'DRAFT'] ?? STATUS_BADGE.DRAFT;
  return <span className={`inline-block w-2 h-2 rounded-full ${style.dot} mr-1.5 shrink-0`} />;
}

function ProgressBar({ received, total }: { received: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (received / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
        {received}/{total}
      </span>
    </div>
  );
}

export function PurchaseOrderList({
  orders,
  loading,
  selectedId,
  onSelect,
  onCreate,
  onReceive,
  canReceive,
}: PurchaseOrderListProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? orders.filter(
        (o) =>
          (o.code ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (o.supplier?.companyName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-border/50">
      <div className="p-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('purchaseOrders.title')}</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('purchaseOrders.new')}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 h-9"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search.trim() ? t('common.noResults') : t('purchaseOrders.empty')}
          </div>
        ) : (
          sorted.map((order) => {
            const isSelected = order.id === selectedId;
            const totalReceived = (order.details ?? []).reduce(
              (s, d) => s + (d.receivedQuantity ?? 0), 0
            );
            const totalOrdered = (order.details ?? []).reduce(
              (s, d) => s + (d.quantity ?? 0), 0
            );
            const hasPending = totalOrdered > totalReceived;
            const canReceiveThis = canReceive && hasPending && (order.status === 'ISSUED' || order.status === 'RECEIVED');

            return (
              <div
                key={order.id}
                className={`rounded-lg border border-border/50 p-3 cursor-pointer transition-colors hover:border-primary/50 ${
                  isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'
                }`}
                onClick={() => onSelect(order)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={order.status as string} />
                    <span className="text-xs font-mono font-medium">{order.code || `#${order.id.slice(0, 8)}`}</span>
                  </div>
                  {canReceiveThis && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => { e.stopPropagation(); onReceive(order); }}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      {t('purchaseOrders.receive')}
                    </Button>
                  )}
                </div>
                <p className="text-sm font-medium truncate">
                  {order.supplier?.companyName ?? '-'}
                </p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">
                  Bs. {(order.amount != null ? Number(order.amount) : 0).toFixed(2)}
                </p>
                {totalOrdered > 0 && (
                  <div className="mt-1.5">
                    <ProgressBar received={totalReceived} total={totalOrdered} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
