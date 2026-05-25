'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePurchaseOrders } from '@/features/purchase-orders/hooks/use-purchase-orders';
import { PurchaseOrder, CreatePurchaseOrderRequest } from '@/features/purchase-orders/models/purchase-order.model';
import { purchaseOrderService } from '@/features/purchase-orders/services/purchase-order.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

export default function PurchaseOrdersPage() {
  const { items, loading, loadItems } = usePurchaseOrders();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canCreate = hasMinLevel(role, 60);
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<CreatePurchaseOrderRequest>({
    idSupplier: 0,
    code: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 1,
    status: 1,
    details: [],
  });
  const [suppliers, setSuppliers] = useState<{ id: number; companyName: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; code: string; name: string }[]>([]);
  const [exchangeRates, setExchangeRates] = useState<{ id: number; rate: number; date: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const columns: Column<PurchaseOrder>[] = [
    { field: 'id', headerName: t('purchaseOrders.field.id') },
    {
      field: 'supplier',
      headerName: t('purchaseOrders.field.supplier'),
      render: (row) => row.supplier?.companyName ?? '-',
    },
    { field: 'code', headerName: t('purchaseOrders.field.code') },
    {
      field: 'amount',
      headerName: t('purchaseOrders.field.amount'),
      render: (row) => (row.amount != null ? `Bs. ${Number(row.amount).toFixed(2)}` : '-'),
    },
    {
      field: 'amountUsd',
      headerName: t('purchaseOrders.field.amountUsd'),
      render: (row) => (row.amountUsd != null ? `USD ${Number(row.amountUsd).toFixed(2)}` : '-'),
    },
    {
      field: 'date',
      headerName: t('purchaseOrders.field.date'),
      render: (row) => (row.date ? new Date(row.date).toLocaleDateString() : '-'),
    },
  ];

  useEffect(() => {
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => {});
    apiClient.get('/products').then((r) => setProducts(r.data.data || [])).catch(() => {});
    apiClient.get('/exchange-rates').then((r) => setExchangeRates(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setSelectedItem(null);
    setError('');
    setFormData({
      idSupplier: 0,
      code: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      amountUsd: 0,
      exchangeRate: 0,
      exchangeRateId: 0,
      paymentMethod: 1,
      status: 1,
      details: [],
    });
    setFormOpen(true);
  };

  const addDetail = () => {
    setFormData({
      ...formData,
      details: [...(formData.details || []), { idProduct: 0, quantity: 1, subtotal: 0, observation: '' }],
    });
  };

  const removeDetail = (index: number) => {
    setFormData({
      ...formData,
      details: (formData.details || []).filter((_, i) => i !== index),
    });
  };

  const updateDetail = (index: number, field: string, value: unknown) => {
    const updated = [...(formData.details || [])];
    (updated[index] as Record<string, unknown>)[field] = value;
    setFormData({ ...formData, details: updated });
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        amount: Number(formData.amount),
        amountUsd: Number(formData.amountUsd ?? 0),
        exchangeRate: Number(formData.exchangeRate ?? 0),
        exchangeRateId: Number(formData.exchangeRateId ?? 0),
        idSupplier: Number(formData.idSupplier),
      };
      if (selectedItem) {
        await purchaseOrderService.update(selectedItem.id, {
          idSupplier: data.idSupplier,
          code: data.code,
          date: data.date,
          amount: data.amount,
          amountUsd: data.amountUsd,
          exchangeRate: data.exchangeRate,
          exchangeRateId: data.exchangeRateId,
          paymentMethod: data.paymentMethod,
          status: data.status,
        });
      } else {
        await purchaseOrderService.create(data);
      }
      await loadItems();
      sileo.success({ description: selectedItem ? t('purchaseOrders.updated') : t('purchaseOrders.created') });
      setFormOpen(false);
    } catch {
      setError(t('purchaseOrders.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await purchaseOrderService.delete(deleteTarget.id);
      await loadItems();
      sileo.success({ description: t('purchaseOrders.deleted') });
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('purchaseOrders.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedItem ? t('purchaseOrders.edit') : t('purchaseOrders.new')}
      onClose={() => { setFormOpen(false); setSelectedItem(null); }}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.supplier')}</Label>
            <Select value={String(formData.idSupplier)} onValueChange={(v) => setFormData({ ...formData, idSupplier: Number(v) })}>
              <SelectTrigger><SelectValue placeholder={t('common.selectSupplier')} /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.code')}</Label>
            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.date')}</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.amount')} (Bs.)</Label>
            <Input type="number" step="0.01" value={formData.amount}
              onChange={(e) => {
                const amt = Number(e.target.value);
                const er = exchangeRates.find((r) => r.id === formData.exchangeRateId);
                setFormData({
                  ...formData,
                  amount: amt,
                  amountUsd: er && er.rate > 0 ? amt / er.rate : formData.amountUsd,
                });
              }} required />
          </div>
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.amountUsd')}</Label>
            <Input type="number" step="0.01" value={formData.amountUsd ?? 0}
              onChange={(e) => setFormData({ ...formData, amountUsd: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.exchangeRate')}</Label>
            <Select value={String(formData.exchangeRateId || '')}
              onValueChange={(v) => {
                const er = exchangeRates.find((r) => r.id === Number(v));
                setFormData({
                  ...formData,
                  exchangeRateId: Number(v),
                  exchangeRate: er?.rate ?? 0,
                  amountUsd: er && er.rate > 0 ? (formData.amount ?? 0) / er.rate : formData.amountUsd,
                });
              }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tasa" /></SelectTrigger>
              <SelectContent>
                {exchangeRates.map((er) => (
                  <SelectItem key={er.id} value={String(er.id)}>
                    {er.date ? new Date(er.date).toLocaleDateString() : '—'} — {er.rate} Bs./USD
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedItem && (
            <>
              <div className="flex items-center justify-between">
                <Label>{t('purchaseOrders.details')}</Label>
                <Button variant="outline" size="sm" onClick={addDetail}>
                  <Plus className="mr-2 h-4 w-4" /> {t('purchaseOrders.addDetail')}
                </Button>
              </div>
              {(formData.details || []).map((detail, index) => (
                <div key={index} className="space-y-2 rounded border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tp('purchaseOrders.detailLabel', { index: String(index + 1) })}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeDetail(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('purchaseOrders.field.product')}</Label>
                    <Select value={String(detail.idProduct)}
                      onValueChange={(v) => updateDetail(index, 'idProduct', Number(v))}>
                      <SelectTrigger><SelectValue placeholder={t('common.selectProduct')} /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.code} - {p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>{t('purchaseOrders.field.quantity')}</Label>
                      <Input type="number" value={detail.quantity}
                        onChange={(e) => updateDetail(index, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('purchaseOrders.field.subtotal')}</Label>
                      <Input type="number" value={detail.subtotal}
                        onChange={(e) => updateDetail(index, 'subtotal', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={60}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('purchaseOrders.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        onEdit={canEdit ? (item) => {
          setSelectedItem(item);
          setFormOpen(true);
        } : undefined}
        onDelete={canDelete ? (item) => {
          setDeleteTarget(item);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('purchaseOrders.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('purchaseOrders.delete')}
        message={tp('purchaseOrders.deleteConfirm', { code: deleteTarget?.code ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
