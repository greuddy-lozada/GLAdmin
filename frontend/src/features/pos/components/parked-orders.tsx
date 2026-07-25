'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useI18n } from '@/i18n';
import { localDb, type ParkedOrder } from '@/lib/sync/db';

interface ParkedOrdersProps {
  currentCartCount: number;
  onResume: (order: ParkedOrder) => void;
  refreshTrigger: number;
  variant?: 'accordion' | 'sheet';
}

export function ParkedOrders({ currentCartCount, onResume, refreshTrigger, variant = 'accordion' }: ParkedOrdersProps) {
  const { t, tp } = useI18n();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<ParkedOrder[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmResume, setConfirmResume] = useState<ParkedOrder | null>(null);

  const loadOrders = () => {
    localDb.parkedOrders.orderBy('createdAt').toArray()
      .then(setOrders)
      .catch(err => { console.warn('Parked orders load error:', err); });
  };

  useEffect(() => { loadOrders(); }, [refreshTrigger]);

  const handleResume = (order: ParkedOrder) => {
    if (currentCartCount > 0) {
      setConfirmResume(order);
    } else {
      resumeAndClose(order);
    }
  };

  const resumeAndClose = async (order: ParkedOrder) => {
    try {
      onResume(order);
      await localDb.parkedOrders.delete(order.id!);
      loadOrders();
      setConfirmResume(null);
    } catch (err) {
      console.warn('Parked order resume error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await localDb.parkedOrders.delete(id);
      loadOrders();
      setConfirmDelete(null);
    } catch (err) {
      console.warn('Parked order delete error:', err);
    }
  };

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const formatRelative = useCallback((dateStr: string) => {
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `hace ${hrs} h`;
  }, [now]);

  const listContent = (
    <div className={variant === 'sheet' ? 'space-y-2 px-4 pb-4' : 'p-2 space-y-1 max-h-48 overflow-y-auto border-t border-border/50'}>
      {orders.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">{t('pos.park.empty')}</p>}
      {orders.map(o => {
        const itemCount = o.cartItems.length;
        const itemLabel = itemCount === 1 ? '1 item' : `${itemCount} items`;
        return (
          <div key={o.id} className="border border-border/50 rounded-lg p-3 space-y-2 hover:border-border transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{formatRelative(o.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {itemLabel} — Bs. {o.total.toFixed(2)}{o.totalUsd > 0 ? ` / $${o.totalUsd.toFixed(2)}` : ''}
                </p>
                {o.customerName && (
                  <p className="text-xs text-muted-foreground">{o.customerName}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-1.5">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleResume(o)}>
                {t('pos.park.resume')}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => setConfirmDelete(o.id!)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (variant === 'sheet') {
    return (
      <>
        {listContent}
        <ConfirmDialog
          open={confirmResume !== null}
          title={t('pos.park.mergeTitle')}
          message={tp('pos.park.mergeMessage', { count: String(confirmResume?.cartItems.length ?? 0), total: confirmResume?.total.toFixed(2) ?? '0.00' })}
          confirmLabel={t('common.yes')}
          cancelLabel={t('common.no')}
          onConfirm={() => confirmResume && resumeAndClose(confirmResume)}
          onCancel={() => setConfirmResume(null)}
        />
        <ConfirmDialog
          open={confirmDelete !== null}
          title={t('pos.park.delete')}
          message={`${t('common.confirm')}?`}
          confirmLabel={t('common.delete')}
          onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-2 border border-border/50 rounded-lg">
        <Button variant="ghost" className="w-full justify-between" onClick={() => { setOpen(!open); if (!open) loadOrders(); }}>
          <span className="flex items-center gap-2"><Pause className="h-4 w-4" />
            {t('pos.park.title')} {orders.length > 0 && `(${orders.length})`}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {open && listContent}
      </div>

      <ConfirmDialog
        open={confirmResume !== null}
        title={t('pos.park.mergeTitle')}
        message={tp('pos.park.mergeMessage', { count: String(confirmResume?.cartItems.length ?? 0), total: confirmResume?.total.toFixed(2) ?? '0.00' })}
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.no')}
        onConfirm={() => confirmResume && resumeAndClose(confirmResume)}
        onCancel={() => setConfirmResume(null)}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t('pos.park.delete')}
        message={`${t('common.confirm')}?`}
        confirmLabel={t('common.delete')}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}
