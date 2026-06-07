'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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
import { PurchaseOrder, CreatePurchaseOrderRequest, PurchaseOrderStatus, PURCHASE_ORDER_TRANSITIONS } from '@/features/purchase-orders/models/purchase-order.model';
import { purchaseOrderService } from '@/features/purchase-orders/services/purchase-order.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

const STATUS_LABEL_KEY: Record<number, string> = {
  [PurchaseOrderStatus.Draft]: 'purchaseOrders.status.draft',
  [PurchaseOrderStatus.Sent]: 'purchaseOrders.status.sent',
  [PurchaseOrderStatus.Approved]: 'purchaseOrders.status.approved',
  [PurchaseOrderStatus.Received]: 'purchaseOrders.status.received',
  [PurchaseOrderStatus.Cancelled]: 'purchaseOrders.status.cancelled',
};

interface DetailForm {
  idProduct: number;
  quantity: number;
  unitPrice: number;
  unitPriceUsd: number;
  subtotal: number;
  subtotalUsd: number;
  observation: string;
}

interface PurchaseOrderFormData {
  idSupplier: number;
  code: string;
  date: string;
  amount: number;
  amountUsd: number;
  exchangeRate: number;
  exchangeRateId?: number;
  paymentMethod: number;
  status: number;
  details: DetailForm[];
}

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
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    idSupplier: 0,
    code: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    amountUsd: 0,
    exchangeRate: 0,
    exchangeRateId: undefined,
    paymentMethod: 1,
    status: 1,
    details: [],
  });
  const [suppliers, setSuppliers] = useState<{ id: number; companyName: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; code: string; name: string; price: number; priceUsd: number }[]>([]);
  const [exchangeRates, setExchangeRates] = useState<{ id: number; rate: number; date: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

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
    {
      field: 'status',
      headerName: t('purchaseOrders.field.status'),
      render: (row) => {
        const key = STATUS_LABEL_KEY[row.status ?? 1];
        const label = key ? t(key) : '-';
        return <span className="text-xs font-medium">{label}</span>;
      },
    },
    {
      field: 'details',
      headerName: t('purchaseOrders.details'),
      render: (row) => {
        const count = row.details?.length ?? 0;
        return (
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === row.id ? null : row.id); }}
          >
            {tp('purchaseOrders.items', { count: String(count) })}
            {expandedRow === row.id
              ? <ChevronDown className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />}
          </button>
        );
      },
    },
  ];

  useEffect(() => {
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => console.warn('Failed to load suppliers'));
    apiClient.get('/products').then((r) => setProducts(r.data.data || [])).catch(() => console.warn('Failed to load products'));
    apiClient.get('/exchange-rates').then((r) => setExchangeRates(r.data.data || [])).catch(() => console.warn('Failed to load exchange rates'));
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
      exchangeRateId: undefined,
      paymentMethod: 1,
      status: PurchaseOrderStatus.Draft,
      details: [],
    });
    setFormOpen(true);
  };

  const openEdit = async (item: PurchaseOrder) => {
    setSelectedItem(item);
    setError('');
    try {
      const full = await purchaseOrderService.getById(item.id);
      const er = exchangeRates.find((r) => r.id === full.exchangeRateId);
      setFormData({
        idSupplier: full.idSupplier,
        code: full.code ?? '',
        date: full.date ? new Date(full.date).toISOString().split('T')[0] : '',
        amount: full.amount ?? 0,
        amountUsd: full.amountUsd ?? 0,
        exchangeRate: full.exchangeRate ?? er?.rate ?? 0,
        exchangeRateId: full.exchangeRateId,
        paymentMethod: full.paymentMethod ?? 1,
        status: full.status ?? PurchaseOrderStatus.Draft,
        details: (full.details || []).map((d) => ({
          idProduct: d.product?.id ?? d.idProduct,
          productName: d.product?.name ?? '',
          quantity: d.quantity ?? 1,
          unitPrice: d.unitPrice ?? 0,
          unitPriceUsd: d.unitPriceUsd ?? 0,
          subtotal: d.subtotal ?? 0,
          subtotalUsd: d.subtotalUsd ?? 0,
          observation: d.observation ?? '',
        })),
      });
      setFormOpen(true);
    } catch {
      setError(t('purchaseOrders.error.load'));
    }
  };

  const recalcHeaderFromDetails = (details: DetailForm[]) => {
    const amount = details.reduce((s, d) => s + (d.subtotal || 0), 0);
    const amountUsd = details.reduce((s, d) => s + (d.subtotalUsd || 0), 0);
    return { amount, amountUsd };
  };

  const addDetail = () => {
    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, { idProduct: 0, quantity: 1, unitPrice: 0, unitPriceUsd: 0, subtotal: 0, subtotalUsd: 0, observation: '' }],
    }));
  };

  const removeDetail = (index: number) => {
    const updated = formData.details.filter((_, i) => i !== index);
    const totals = recalcHeaderFromDetails(updated);
    setFormData({ ...formData, details: updated, ...totals });
  };

  const updateDetail = (index: number, field: string, value: unknown) => {
    const updated = [...formData.details];
    const detail = { ...updated[index] };

    if (field === 'idProduct') {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        detail.idProduct = product.id;
        detail.unitPrice = product.price ?? 0;
        detail.unitPriceUsd = product.priceUsd ?? 0;
        detail.subtotal = (detail.quantity || 1) * (product.price ?? 0);
        detail.subtotalUsd = (detail.quantity || 1) * (product.priceUsd ?? 0);
      }
    }

    if (field === 'quantity') {
      detail.quantity = Number(value);
      detail.subtotal = detail.quantity * detail.unitPrice;
      detail.subtotalUsd = detail.quantity * detail.unitPriceUsd;
    }

    if (field === 'unitPrice') {
      detail.unitPrice = Number(value);
      detail.subtotal = detail.quantity * detail.unitPrice;
      if (formData.exchangeRate > 0) {
        detail.subtotalUsd = detail.subtotal / formData.exchangeRate;
      }
    }

    if (field === 'unitPriceUsd') {
      detail.unitPriceUsd = Number(value);
      detail.subtotalUsd = detail.quantity * detail.unitPriceUsd;
    }

    updated[index] = detail;
    const totals = recalcHeaderFromDetails(updated);
    setFormData({ ...formData, details: updated, ...totals });
  };

  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    if (!selectedItem) return;
    setSubmitting(true);
    setError('');
    try {
      await purchaseOrderService.update(selectedItem.id, { status: newStatus });
      await loadItems();
      sileo.success({ description: t('purchaseOrders.updated') });
      setFormOpen(false);
      setSelectedItem(null);
    } catch {
      setError(t('purchaseOrders.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    setError('');
    if (!formData.idSupplier) {
      setError(t('purchaseOrders.error.save'));
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        idSupplier: Number(formData.idSupplier),
        exchangeRateId: formData.exchangeRateId ? Number(formData.exchangeRateId) : undefined,
        details: formData.details.map((d) => ({
          idProduct: d.idProduct,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          unitPriceUsd: d.unitPriceUsd,
          subtotal: d.subtotal,
          subtotalUsd: d.subtotalUsd,
          observation: d.observation || undefined,
        })),
      };
      if (selectedItem) {
        await purchaseOrderService.update(selectedItem.id, {
          ...data,
          idSupplier: undefined,
          details: data.details.length > 0 ? data.details : undefined,
        });
      } else {
        await purchaseOrderService.create(data);
      }
      await loadItems();
      sileo.success({ description: selectedItem ? t('purchaseOrders.updated') : t('purchaseOrders.created') });
      setFormOpen(false);
      setSelectedItem(null);
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
    } catch (error) {
      console.error(error);
      setError(t('purchaseOrders.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const currentTransitions = selectedItem ? PURCHASE_ORDER_TRANSITIONS[selectedItem.status as PurchaseOrderStatus] ?? [] : [];

  const exchangeRateValue = exchangeRates.find((r) => r.id === formData.exchangeRateId);

  return (
    <SlideForm
      open={formOpen}
      title={selectedItem ? t('purchaseOrders.edit') : t('purchaseOrders.new')}
      onClose={() => { setFormOpen(false); setSelectedItem(null); }}
      panel={
        <div className="space-y-4">
          {selectedItem && currentTransitions.length > 0 && (
            <div className="space-y-2">
              <Label>{t('purchaseOrders.field.status')}</Label>
              <div className="flex flex-wrap gap-2">
                {currentTransitions.map((st) => {
                  const key = STATUS_LABEL_KEY[st];
                  return (
                    <Button key={st} size="sm" variant="outline" onClick={() => handleStatusChange(st)} disabled={submitting}>
                      {key ? t(key) : st}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>{t('purchaseOrders.field.supplier')}</Label>
            <Select
              value={String(formData.idSupplier)}
              onValueChange={(v) => setFormData({ ...formData, idSupplier: Number(v) })}
              disabled={!!selectedItem}
            >
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
            <Label>{t('purchaseOrders.field.exchangeRate')}</Label>
            <Select
              value={String(formData.exchangeRateId ?? '')}
              onValueChange={(v) => {
                const er = exchangeRates.find((r) => r.id === Number(v));
                const rate = er?.rate ?? 0;
                const newDetails = formData.details.map((d) => ({
                  ...d,
                  subtotalUsd: d.unitPrice > 0 && rate > 0 ? d.subtotal / rate : d.subtotalUsd,
                }));
                const newAmountUsd = rate > 0 ? formData.amount / rate : formData.amountUsd;
                setFormData({
                  ...formData,
                  exchangeRateId: Number(v),
                  exchangeRate: rate,
                  details: newDetails,
                  amountUsd: newAmountUsd,
                });
              }}
            >
              <SelectTrigger><SelectValue placeholder={t('exchangeRates.selectRate')} /></SelectTrigger>
              <SelectContent>
                {exchangeRates.map((er) => (
                  <SelectItem key={er.id} value={String(er.id)}>
                    {er.date ? new Date(er.date).toLocaleDateString() : '—'} — {er.rate} Bs./USD
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('purchaseOrders.details')}</Label>
            <Button variant="outline" size="sm" onClick={addDetail}>
              <Plus className="mr-2 h-4 w-4" /> {t('purchaseOrders.addDetail')}
            </Button>
          </div>
          {formData.details.map((detail, index) => (
            <div key={index} className="space-y-2 rounded border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{tp('purchaseOrders.detailLabel', { index: String(index + 1) })}</span>
                <Button variant="ghost" size="icon" onClick={() => removeDetail(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>{t('purchaseOrders.field.product')}</Label>
                <Select value={String(detail.idProduct)} onValueChange={(v) => updateDetail(index, 'idProduct', Number(v))}>
                  <SelectTrigger><SelectValue placeholder={t('common.selectProduct')} /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.code} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-2">
                  <Label>{t('purchaseOrders.field.quantity')}</Label>
                  <Input type="number" min={1} value={detail.quantity}
                    onChange={(e) => updateDetail(index, 'quantity', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('purchaseOrders.field.unitPrice')}</Label>
                  <Input type="number" step="0.01" min={0} value={detail.unitPrice}
                    onChange={(e) => updateDetail(index, 'unitPrice', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('purchaseOrders.field.unitPriceUsd')}</Label>
                  <Input type="number" step="0.01" min={0} value={detail.unitPriceUsd}
                    onChange={(e) => updateDetail(index, 'unitPriceUsd', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('purchaseOrders.field.subtotal')}</Label>
                  <Input type="number" value={detail.subtotal.toFixed(2)} readOnly className="bg-muted" />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-semibold">{t('purchaseOrders.field.amount')}</span>
            <div className="text-right">
              <div className="text-lg font-bold">Bs. {(formData.amount ?? 0).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">USD {(formData.amountUsd ?? 0).toFixed(2)}</div>
            </div>
          </div>

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
        onEdit={canEdit ? (item) => openEdit(item) : undefined}
        onDelete={canDelete ? (item) => { setDeleteTarget(item); setDeleteOpen(true); } : undefined}
        emptyMessage={t('purchaseOrders.empty')}
      />

      {expandedRow && (() => {
        const row = items.find((i) => i.id === expandedRow);
        if (!row) return null;
        return (
          <div className="border rounded-lg p-4 mt-2 bg-muted/30">
            <h4 className="text-sm font-semibold mb-2">{t('purchaseOrders.details')}</h4>
            {(!row.details || row.details.length === 0) ? (
              <p className="text-sm text-muted-foreground">{t('purchaseOrders.noDetails')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left pb-1">{t('purchaseOrders.field.product')}</th>
                    <th className="text-right pb-1">{t('purchaseOrders.field.quantity')}</th>
                    <th className="text-right pb-1">{t('purchaseOrders.field.unitPrice')}</th>
                    <th className="text-right pb-1">{t('purchaseOrders.field.subtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {row.details.map((d) => (
                    <tr key={d.id || d.idProduct} className="border-b last:border-0">
                      <td className="py-1">{d.product?.name ?? `#${d.idProduct}`}</td>
                      <td className="text-right py-1">{d.quantity}</td>
                      <td className="text-right py-1">Bs. {d.unitPrice?.toFixed(2) ?? '-'}</td>
                      <td className="text-right py-1">Bs. {d.subtotal?.toFixed(2) ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}

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
