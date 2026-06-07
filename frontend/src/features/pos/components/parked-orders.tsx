'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useI18n } from '@/i18n';
import { localDb, type ParkedOrder } from '@/lib/sync/db';

interface ParkedOrdersProps {
  currentCartCount: number;
  onResume: (order: ParkedOrder) => void;
  refreshTrigger: number;
}

export function ParkedOrders({ currentCartCount, onResume, refreshTrigger }: ParkedOrdersProps) {
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

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `hace ${hrs} h`;
  };

  return (
    <>
      <div className="mt-2 border rounded-lg">
        <Button variant="ghost" className="w-full justify-between" onClick={() => { setOpen(!open); if (!open) loadOrders(); }}>
          <span className="flex items-center gap-2"><Pause className="h-4 w-4" />
            {t('pos.park.title')} {orders.length > 0 && `(${orders.length})`}
          </span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {open && (
          <div className="p-2 space-y-1 max-h-48 overflow-y-auto border-t">
            {orders.length === 0 && <p className="text-sm text-muted-foreground p-2">{t('pos.park.empty')}</p>}
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm">
                <div>
                  <span className="font-mono text-xs">{o.label}</span>
                  <span className="text-muted-foreground ml-2">
                    — {tp('pos.park.item', { n: o.label.replace(/\D/g, ''), count: String(o.cartItems.length) })}
                  </span>
                  <span className="text-muted-foreground ml-1">— Bs. {o.total.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground ml-1">— {formatRelative(o.createdAt)}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleResume(o)}>{t('pos.park.resume')}</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setConfirmDelete(o.id!)}>{t('pos.park.delete')}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
