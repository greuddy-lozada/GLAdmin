'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Upload, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  baseAmount: number;
  baseAmountUsd: number;
  ivaAmount: number;
  ivaAmountUsd: number;
  exchangeRate: number;
  exchangeRateId?: number;
  exchangeRateDayId?: number;
  manualRate: boolean;
  paymentMethod: number;
  status: number;
  applyWithholding: boolean;
  withholdingPercentage: number;
  withholdingProof: string;
  details: DetailForm[];
}

export default function PurchaseOrdersPage() {
  const { items: purchaseOrdersData, isLoading: loading, create, update, remove } = usePurchaseOrders();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
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
    baseAmount: 0,
    baseAmountUsd: 0,
    ivaAmount: 0,
    ivaAmountUsd: 0,
    exchangeRate: 0,
    exchangeRateId: undefined,
    exchangeRateDayId: undefined,
    manualRate: false,
    paymentMethod: 1,
    status: 1,
    applyWithholding: false,
    withholdingPercentage: 75,
    withholdingProof: '',
    details: [],
  });
  const [suppliers, setSuppliers] = useState<{ id: number; companyName: string; taxWithholdingAgent?: boolean }[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string; isWithholdingAgent?: boolean; withholdingPercentage?: number }[]>([]);
  const [products, setProducts] = useState<{ id: number; code: string; name: string; price: number; priceUsd: number; taxPercentage?: number }[]>([]);
  const [exchangeRateDays, setExchangeRateDays] = useState<{ id: number; date: string; rateBcvUsd: number | null; rateParalelo: number | null }[]>([]);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const orgCompany = companies[0];
  const isWithholdingAgent = orgCompany?.isWithholdingAgent ?? false;

  const withholdingAmount = formData.applyWithholding
    ? formData.ivaAmount * (formData.withholdingPercentage / 100)
    : 0;
  const withholdingAmountUsd = formData.applyWithholding
    ? formData.ivaAmountUsd * (formData.withholdingPercentage / 100)
    : 0;
  const totalToPay = formData.amount - withholdingAmount;
  const totalToPayUsd = formData.amountUsd - withholdingAmountUsd;

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
      isNumeric: true,
    },
    {
      field: 'amountUsd',
      headerName: t('purchaseOrders.field.amountUsd'),
      render: (row) => (row.amountUsd != null ? `USD ${Number(row.amountUsd).toFixed(2)}` : '-'),
      isNumeric: true,
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
      field: 'withholdingAmount',
      headerName: t('purchaseOrders.field.withholdingAmount'),
      render: (row) => {
        const wr = row.withholdingRecords?.[0];
        return wr ? `Bs. -${Number(wr.withheldAmount).toFixed(2)}` : '—';
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
    ...(canEdit ? [{
      field: 'receive',
      headerName: '',
      render: (row: PurchaseOrder) => {
        if (row.status !== PurchaseOrderStatus.Approved) return null;
        return (
          <Button variant="outline" size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              openReceive(row);
            }}>
            <Package className="h-3 w-3 mr-1" />
            {t('purchaseOrders.receive')}
          </Button>
        );
      },
    }] : []),
  ];

  useEffect(() => {
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => console.warn('Failed to load suppliers'));
    apiClient.get('/products').then((r) => setProducts(r.data.data || [])).catch(() => console.warn('Failed to load products'));
    apiClient.get('/companies').then((r) => setCompanies(r.data.data || [])).catch(() => console.warn('Failed to load companies'));
    apiClient.get('/exchange-rates').then((r) => setExchangeRateDays(r.data.data || [])).catch(() => console.warn('Failed to load exchange rates'));
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
      baseAmount: 0,
      baseAmountUsd: 0,
      ivaAmount: 0,
      ivaAmountUsd: 0,
      exchangeRate: 0,
      exchangeRateId: undefined,
      exchangeRateDayId: undefined,
      manualRate: false,
      paymentMethod: 1,
      status: PurchaseOrderStatus.Draft,
      applyWithholding: isWithholdingAgent,
      withholdingPercentage: orgCompany?.withholdingPercentage ?? 75,
      withholdingProof: '',
      details: [],
    });
    setFormOpen(true);
  };

  const openEdit = async (item: PurchaseOrder) => {
    setSelectedItem(item);
    setError('');
    try {
      const full = await purchaseOrderService.getById(item.id);
      const er = exchangeRateDays.find((r) => r.id === (full.exchangeRateDayId ?? full.exchangeRateId));
      const wr = full.withholdingRecords?.[0];
      setFormData({
        idSupplier: full.idSupplier,
        code: full.code ?? '',
        date: full.date ? new Date(full.date).toISOString().split('T')[0] : '',
        amount: full.amount ?? 0,
        amountUsd: full.amountUsd ?? 0,
        baseAmount: full.baseAmount ?? 0,
        baseAmountUsd: full.baseAmountUsd ?? 0,
        ivaAmount: full.ivaAmount ?? 0,
        ivaAmountUsd: full.ivaAmountUsd ?? 0,
        exchangeRate: full.exchangeRate ?? (er ? (er.rateBcvUsd ?? er.rateParalelo ?? 0) : 0),
        exchangeRateId: full.exchangeRateId,
        exchangeRateDayId: full.exchangeRateDayId,
        manualRate: !full.exchangeRateDayId && !full.exchangeRateId && (full.exchangeRate ?? 0) > 0,
        paymentMethod: full.paymentMethod ?? 1,
        status: full.status ?? PurchaseOrderStatus.Draft,
        applyWithholding: !!wr,
        withholdingPercentage: wr?.percentage ?? 75,
        withholdingProof: wr?.withholdingProof ?? '',
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
    const baseAmount = details.reduce((s, d) => s + (d.subtotal || 0), 0);
    const baseAmountUsd = details.reduce((s, d) => s + (d.subtotalUsd || 0), 0);
    const ivaAmount = details.reduce((s, d) => {
      const p = products.find((pr) => pr.id === d.idProduct);
      return s + (d.subtotal || 0) * ((p?.taxPercentage ?? 0) / 100);
    }, 0);
    const ivaAmountUsd = details.reduce((s, d) => {
      const p = products.find((pr) => pr.id === d.idProduct);
      return s + (d.subtotalUsd || 0) * ((p?.taxPercentage ?? 0) / 100);
    }, 0);
    return { baseAmount, baseAmountUsd, ivaAmount, ivaAmountUsd, amount: baseAmount + ivaAmount, amountUsd: baseAmountUsd + ivaAmountUsd };
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
        detail.unitPriceUsd = detail.unitPrice / formData.exchangeRate;
        detail.subtotalUsd = detail.subtotal / formData.exchangeRate;
      }
    }

    if (field === 'unitPriceUsd') {
      detail.unitPriceUsd = Number(value);
      detail.subtotalUsd = detail.quantity * detail.unitPriceUsd;
      if (formData.exchangeRate > 0) {
        detail.unitPrice = detail.unitPriceUsd * formData.exchangeRate;
        detail.subtotal = detail.quantity * detail.unitPrice;
      }
    }

    updated[index] = detail;
    const totals = recalcHeaderFromDetails(updated);
    setFormData({ ...formData, details: updated, ...totals });
  };

  const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
    if (!selectedItem) return;
    setError('');
    setFormOpen(false);
    setSelectedItem(null);
    update.mutate(
      { id: selectedItem.id, data: { status: newStatus } },
      {
        onSuccess: () => sileo.success({ description: t('purchaseOrders.updated') }),
        onError: () => { setError(t('purchaseOrders.error.save')); setFormOpen(true); },
      },
    );
  };

  const handleSave = () => {
    setError('');
    if (!formData.idSupplier) {
      setError(t('purchaseOrders.error.save'));
      return;
    }
    if (formData.applyWithholding && !formData.withholdingProof) {
      setError(t('purchaseOrders.withholdingRequired'));
      return;
    }
    setFormOpen(false);
    const data: CreatePurchaseOrderRequest = {
      idSupplier: Number(formData.idSupplier),
      code: formData.code || undefined,
      date: formData.date || undefined,
      amount: formData.amount,
      amountUsd: formData.amountUsd,
      baseAmount: formData.baseAmount,
      baseAmountUsd: formData.baseAmountUsd,
      ivaAmount: formData.ivaAmount,
      ivaAmountUsd: formData.ivaAmountUsd,
      exchangeRate: formData.exchangeRate || undefined,
      exchangeRateDayId: formData.exchangeRateDayId ? Number(formData.exchangeRateDayId) : undefined,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      applyWithholding: formData.applyWithholding || undefined,
      withholdingPercentage: formData.applyWithholding ? formData.withholdingPercentage : undefined,
      withholdingProof: formData.applyWithholding ? formData.withholdingProof : undefined,
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
      update.mutate(
        {
          id: selectedItem.id,
          data: {
            ...data,
            idSupplier: undefined,
            details: data.details && data.details.length > 0 ? data.details : [],
          },
        },
        {
          onSuccess: () => {
            sileo.success({ description: t('purchaseOrders.updated') });
            setSelectedItem(null);
          },
          onError: () => { setError(t('purchaseOrders.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(data, {
        onSuccess: () => {
          sileo.success({ description: t('purchaseOrders.created') });
          setSelectedItem(null);
        },
        onError: () => { setError(t('purchaseOrders.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('purchaseOrders.deleted') }),
      onError: () => { setError(t('purchaseOrders.error.delete')); setDeleteOpen(true); },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/uploads/proof', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData({ ...formData, withholdingProof: res.data.data.filename });
    } catch {
      setError('Error al subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const currentTransitions = selectedItem ? PURCHASE_ORDER_TRANSITIONS[selectedItem.status as PurchaseOrderStatus] ?? [] : [];

  const openReceive = async (po: PurchaseOrder) => {
    const full = await purchaseOrderService.getById(po.id);
    setReceiveTarget(full);
    const qtyMap: Record<number, number> = {};
    for (const d of full.details ?? []) {
      qtyMap[d.id] = Math.max(0, (d.quantity ?? 0) - (d.receivedQuantity ?? 0));
    }
    setReceiveQuantities(qtyMap);
    setReceiveOpen(true);
  };

  const handleReceive = async () => {
    if (!receiveTarget) return;
    setReceiveSubmitting(true);
    setError('');
    try {
      const details = Object.entries(receiveQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([id, quantity]) => ({ id: Number(id), quantity }));
      await purchaseOrderService.receive(receiveTarget.id, details);
      sileo.success({ description: t('purchaseOrders.receiveSuccess') });
      setReceiveOpen(false);
      setReceiveTarget(null);
    } catch {
      setError(t('purchaseOrders.error.save'));
    } finally {
      setReceiveSubmitting(false);
    }
  };

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
                    <Button key={st} size="sm" variant="outline" onClick={() => handleStatusChange(st)} disabled={update.isPending}>
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
            <div className="flex items-center gap-3">
              <Label>{t('purchaseOrders.field.exchangeRate')}</Label>
              <div className="flex items-center gap-2">
                <Switch checked={formData.manualRate} onCheckedChange={(c) => setFormData({ ...formData, manualRate: c })} />
                <Label className="text-sm font-normal">{t('purchaseOrders.manualRate')}</Label>
              </div>
            </div>
            {formData.manualRate ? (
              <Input
                type="number"
                step="any"
                value={formData.exchangeRate || ''}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  const newDetails = formData.details.map((d) => ({
                    ...d,
                    subtotalUsd: d.unitPrice > 0 && rate > 0 ? d.subtotal / rate : d.subtotalUsd,
                  }));
                  const newAmountUsd = rate > 0 ? formData.amount / rate : formData.amountUsd;
                  setFormData({ ...formData, exchangeRate: rate, exchangeRateId: undefined, details: newDetails, amountUsd: newAmountUsd });
                }}
              />
            ) : (
              <Select
                value={String(formData.exchangeRateDayId ?? formData.exchangeRateId ?? '')}
                onValueChange={(v) => {
                  const day = exchangeRateDays.find((r) => r.id === Number(v));
                  const rate = day ? (day.rateBcvUsd ?? day.rateParalelo ?? 0) : 0;
                  const newDetails = formData.details.map((d) => ({
                    ...d,
                    subtotalUsd: d.unitPrice > 0 && rate > 0 ? d.subtotal / rate : d.subtotalUsd,
                  }));
                  const newAmountUsd = rate > 0 ? formData.amount / rate : formData.amountUsd;
                  setFormData({
                    ...formData,
                    exchangeRateDayId: Number(v),
                    exchangeRateId: undefined,
                    exchangeRate: rate,
                    details: newDetails,
                    amountUsd: newAmountUsd,
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder={t('exchangeRates.selectRate')} /></SelectTrigger>
                <SelectContent>
                  {exchangeRateDays.map((d) => {
                    const displayRate = d.rateBcvUsd ?? d.rateParalelo;
                    return (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.date ? new Date(d.date).toLocaleDateString() : '—'} — {displayRate ? `${displayRate} Bs./USD` : '—'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {isWithholdingAgent && (
            <div className="space-y-3 rounded border p-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <Switch checked={formData.applyWithholding} onCheckedChange={(c) => setFormData({ ...formData, applyWithholding: c })} />
                <Label>{t('purchaseOrders.applyWithholding')}</Label>
              </div>
              {formData.applyWithholding && (
                <>
                  <div className="space-y-2">
                    <Label>{t('purchaseOrders.withholdingPercentage')}</Label>
                    <Select value={String(formData.withholdingPercentage)} onValueChange={(v) => setFormData({ ...formData, withholdingPercentage: Number(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="75">{t('purchaseOrders.withholding75')}</SelectItem>
                        <SelectItem value="100">{t('purchaseOrders.withholding100')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('purchaseOrders.withholdingProof')}</Label>
                    {formData.withholdingProof ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground truncate flex-1">{formData.withholdingProof}</span>
                        <Button variant="ghost" size="icon" onClick={() => setFormData({ ...formData, withholdingProof: '' })} aria-label={t('common.delete')}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={uploading} className="relative">
                          {uploading ? t('common.saving') : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              {t('purchaseOrders.withholdingProof')}
                            </>
                          )}
                          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

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
                <Button variant="ghost" size="icon" onClick={() => removeDetail(index)} aria-label={t('common.delete')}>
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

          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('purchaseOrders.baseAmount')}</span>
              <span className="tabular-nums">Bs. {formData.baseAmount.toFixed(2)} / USD {formData.baseAmountUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t('purchaseOrders.ivaAmount')}</span>
              <span className="tabular-nums">Bs. {formData.ivaAmount.toFixed(2)} / USD {formData.ivaAmountUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t('purchaseOrders.field.amount')}</span>
              <span className="tabular-nums">Bs. {formData.amount.toFixed(2)} / USD {formData.amountUsd.toFixed(2)}</span>
            </div>
            {formData.applyWithholding && (
              <>
                <div className="flex justify-between text-destructive">
                  <span>{t('purchaseOrders.withholdingAmount')} ({formData.withholdingPercentage}%)</span>
                  <span className="tabular-nums">-Bs. {withholdingAmount.toFixed(2)} / -USD {withholdingAmountUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-1">
                  <span>{t('purchaseOrders.totalToPay')}</span>
                  <span className="tabular-nums text-primary">Bs. {totalToPay.toFixed(2)} / USD {totalToPayUsd.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
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
        rows={purchaseOrdersData}
        loading={loading}
        onEdit={canEdit ? (item) => openEdit(item) : undefined}
        onDelete={canDelete ? (item) => { setDeleteTarget(item); setDeleteOpen(true); } : undefined}
        emptyMessage={t('purchaseOrders.empty')}
      />

      {expandedRow && (() => {
        const row = purchaseOrdersData.find((i) => i.id === expandedRow);
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

      <Dialog open={receiveOpen} onOpenChange={(o) => { if (!o) { setReceiveOpen(false); setReceiveTarget(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('purchaseOrders.receiveTitle')}</DialogTitle>
            <DialogDescription>
              {t('purchaseOrders.receiveDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {receiveTarget?.details?.filter((d) => (d.quantity ?? 0) > (d.receivedQuantity ?? 0)).map((d) => (
              <div key={d.id} className="flex items-center gap-3 border rounded p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.product?.name ?? `#${d.idProduct}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('purchaseOrders.ordered')}: {d.quantity} | {t('purchaseOrders.receivedLabel')}: {d.receivedQuantity ?? 0}
                  </p>
                </div>
                <div className="w-24">
                  <Input type="number" min={0} max={(d.quantity ?? 0) - (d.receivedQuantity ?? 0)}
                    value={receiveQuantities[d.id] ?? 0}
                    onChange={(e) => setReceiveQuantities({ ...receiveQuantities, [d.id]: Math.min(Number(e.target.value), (d.quantity ?? 0) - (d.receivedQuantity ?? 0)) })} />
                </div>
              </div>
            ))}
            {receiveTarget?.details?.every((d) => (d.quantity ?? 0) <= (d.receivedQuantity ?? 0)) && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('purchaseOrders.allReceived')}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReceiveOpen(false); setReceiveTarget(null); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleReceive} disabled={receiveSubmitting}>
              {receiveSubmitting ? t('common.saving') : t('purchaseOrders.receiveConfirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title={t('purchaseOrders.delete')}
        message={tp('purchaseOrders.deleteConfirm', { code: deleteTarget?.code ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
      </div>
    </SlideForm>
  );
}
