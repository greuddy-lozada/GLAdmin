'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePurchaseOrders } from '@/features/purchase-orders/hooks/use-purchase-orders';
import { PurchaseOrder, CreatePurchaseOrderRequest, PurchaseOrderStatus } from '@/features/purchase-orders/models/purchase-order.model';
import { purchaseOrderService } from '@/features/purchase-orders/services/purchase-order.service';
import { PurchaseOrderList } from './purchase-order-list';
import { PurchaseOrderForm } from './purchase-order-form';
import { useI18n } from '@/i18n';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';
import { extractApiError } from '@/lib/api/extract-api-error';

export interface DetailForm {
  idProduct: string;
  quantity: number;
  unitPrice: number;
  unitPriceUsd: number;
  subtotal: number;
  subtotalUsd: number;
  observation: string;
}

export interface PurchaseOrderFormData {
  idSupplier: string;
  code: string;
  date: string;
  amount: number;
  amountUsd: number;
  baseAmount: number;
  baseAmountUsd: number;
  ivaAmount: number;
  ivaAmountUsd: number;
  exchangeRate: number;
  exchangeRateId?: string;
  exchangeRateDayId?: string;
  manualRate: boolean;
  paymentMethod: number;
  status: string;
  applyWithholding: boolean;
  withholdingPercentage: number;
  withholdingProof: string;
  details: DetailForm[];
}

function emptyFormData(overrides?: Partial<PurchaseOrderFormData>): PurchaseOrderFormData {
  return {
    idSupplier: '', code: '', date: new Date().toISOString().split('T')[0],
    amount: 0, amountUsd: 0, baseAmount: 0, baseAmountUsd: 0,
    ivaAmount: 0, ivaAmountUsd: 0, exchangeRate: 0,
    exchangeRateId: undefined, exchangeRateDayId: undefined, manualRate: false,
    paymentMethod: 1, status: PurchaseOrderStatus.DRAFT,
    applyWithholding: false, withholdingPercentage: 75, withholdingProof: '',
    details: [],
    ...overrides,
  };
}

export default function PurchaseOrdersPage() {
  const { items: purchaseOrdersData, isLoading: loading, create, update, remove } = usePurchaseOrders();
  const queryClient = useQueryClient();
  const { t, tp } = useI18n();
  const { effectiveRoleSlug } = useAuth();
  const role = effectiveRoleSlug;
  const canEdit = hasMinLevel(role, 60);

  const [selectedItem, setSelectedItem] = useState<PurchaseOrder | null>(() => {
    const empty: PurchaseOrder = {
      id: '', idSupplier: '', code: '', date: '', amount: 0, amountUsd: 0, createdAt: '', updatedAt: '', version: 0, status: PurchaseOrderStatus.DRAFT,
    };
    return empty;
  });
  const [formData, setFormData] = useState<PurchaseOrderFormData>(emptyFormData());
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inlineReceiveQty, setInlineReceiveQty] = useState<Record<string, number>>({});
  const [receiveSubmittingInline, setReceiveSubmittingInline] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Receive dialog
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const [suppliers, setSuppliers] = useState<{ id: string; companyName: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; price: number; priceUsd?: number; taxPercentage?: number }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; isWithholdingAgent?: boolean; withholdingPercentage?: number }[]>([]);
  const [exchangeRateDays, setExchangeRateDays] = useState<{ id: string; date: string; rateBcvUsd?: number; rateParalelo?: number }[]>([]);

  useEffect(() => {
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => {});
    apiClient.get('/products').then((r) => setProducts(r.data.data || [])).catch(() => {});
    apiClient.get('/companies').then((r) => setCompanies(r.data.data || [])).catch(() => {});
    apiClient.get('/exchange-rates').then((r) => setExchangeRateDays(r.data.data || [])).catch(() => {});
  }, []);

  const [mobilePane, setMobilePane] = useState<'list' | 'detail'>('list');

  const handleCreateNew = () => {
    const empty: PurchaseOrder = {
      id: '', idSupplier: '', code: '', date: '', amount: 0, amountUsd: 0, createdAt: '', updatedAt: '', version: 0, status: PurchaseOrderStatus.DRAFT,
    };
    setSelectedItem(empty);
    setFormData(emptyFormData({ applyWithholding: companies[0]?.isWithholdingAgent ?? false, withholdingPercentage: companies[0]?.withholdingPercentage ?? 75 }));
    setError('');
    setInlineReceiveQty({});
    setMobilePane('detail');
  };

  const handleSelect = async (order: PurchaseOrder) => {
    setError('');
    if (order.id === selectedItem?.id) {
      setMobilePane('detail');
      return;
    }
    try {
      const full = await purchaseOrderService.getById(order.id);
      const er = exchangeRateDays.find((r) => r.id === (full.exchangeRateDayId ?? full.exchangeRateId));
      const wr = full.withholdingRecords?.[0];
      setFormData(emptyFormData({
        idSupplier: full.idSupplier,
        code: full.code ?? '',
        date: full.date ? new Date(full.date).toISOString().split('T')[0] : '',
        amount: full.amount ?? 0, amountUsd: full.amountUsd ?? 0,
        baseAmount: full.baseAmount ?? 0, baseAmountUsd: full.baseAmountUsd ?? 0,
        ivaAmount: full.ivaAmount ?? 0, ivaAmountUsd: full.ivaAmountUsd ?? 0,
        exchangeRate: full.exchangeRate ?? (er ? (er.rateBcvUsd ?? er.rateParalelo ?? 0) : 0),
        exchangeRateId: full.exchangeRateId, exchangeRateDayId: full.exchangeRateDayId,
        manualRate: !full.exchangeRateDayId && !full.exchangeRateId && (full.exchangeRate ?? 0) > 0,
        paymentMethod: full.paymentMethod ?? 1,
        status: full.status ?? PurchaseOrderStatus.DRAFT,
        applyWithholding: !!wr, withholdingPercentage: wr?.percentage ?? 75,
        withholdingProof: wr?.withholdingProof ?? '',
        details: (full.details || []).map((d) => ({
          idProduct: d.product?.id ?? d.idProduct, productName: d.product?.name ?? '',
          quantity: d.quantity ?? 1, unitPrice: d.unitPrice ?? 0, unitPriceUsd: d.unitPriceUsd ?? 0,
          subtotal: d.subtotal ?? 0, subtotalUsd: d.subtotalUsd ?? 0, observation: d.observation ?? '',
        })),
      }));
      setSelectedItem(full);
      setInlineReceiveQty({});
      setMobilePane('detail');
    } catch (err) {
      setError(extractApiError(err) ?? t('purchaseOrders.error.load'));
    }
  };

  const handleSave = (data: CreatePurchaseOrderRequest) => {
    setError('');
    if (!data.idSupplier) { setError(t('purchaseOrders.error.save')); return; }
    if (selectedItem?.id) {
      update.mutate({ id: selectedItem.id, data: { ...data, idSupplier: undefined } }, {
        onSuccess: () => { sileo.success({ description: t('purchaseOrders.updated') }); refetchSelected(selectedItem.id); },
        onError: (err) => setError(extractApiError(err) ?? t('purchaseOrders.error.save')),
      });
    } else {
      create.mutate(data, {
        onSuccess: () => { sileo.success({ description: t('purchaseOrders.created') }); setSelectedItem(null); setMobilePane('list'); },
        onError: (err) => setError(extractApiError(err) ?? t('purchaseOrders.error.save')),
      });
    }
  };

  const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
    if (!selectedItem?.id) return;
    setError('');
    update.mutate({ id: selectedItem.id, data: { status: newStatus } }, {
      onSuccess: () => { sileo.success({ description: t('purchaseOrders.updated') }); refetchSelected(selectedItem.id); },
      onError: (err) => setError(extractApiError(err) ?? t('purchaseOrders.error.save')),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.append('file', file);
      const res = await apiClient.post('/uploads/proof', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData({ ...formData, withholdingProof: res.data.data.filename });
    } catch (err) { setError(extractApiError(err) ?? t('common.uploadError')); }
    finally { setUploading(false); }
  };

  const refetchSelected = async (id: string) => {
    try {
      const full = await purchaseOrderService.getById(id);
      setSelectedItem(full);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    } catch (err) { sileo.error({ description: extractApiError(err) ?? t('common.error') }); }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteOpen(false); setDeleteTarget(null);
    remove.mutate(id, {
      onSuccess: () => { sileo.success({ description: t('purchaseOrders.deleted') }); if (selectedItem?.id === id) setSelectedItem(null); },
      onError: (err) => setError(extractApiError(err) ?? t('purchaseOrders.error.delete')),
    });
  };

  const openReceive = async (po: PurchaseOrder) => {
    const full = await purchaseOrderService.getById(po.id);
    setReceiveTarget(full);
    const qtyMap: Record<string, number> = {};
    for (const d of full.details ?? []) qtyMap[d.id] = Math.max(0, (d.quantity ?? 0) - (d.receivedQuantity ?? 0));
    setReceiveQuantities(qtyMap);
    setReceiveOpen(true);
  };

  const handleReceive = async () => {
    if (!receiveTarget) return;
    setReceiveSubmitting(true);
    try {
      const details = Object.entries(receiveQuantities).filter(([, q]) => q > 0).map(([id, quantity]) => ({ id, quantity }));
      await purchaseOrderService.receive(receiveTarget.id, details);
      sileo.success({ description: t('purchaseOrders.receiveSuccess') });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setReceiveOpen(false); setReceiveTarget(null);
      if (selectedItem?.id === receiveTarget.id) refetchSelected(receiveTarget.id);
    } catch (err) { setError(extractApiError(err) ?? t('purchaseOrders.error.save')); }
    finally { setReceiveSubmitting(false); }
  };

  const handleInlineReceive = async (detailId: string) => {
    const qty = inlineReceiveQty[detailId];
    if (!qty || qty <= 0 || !selectedItem?.id) return;
    setReceiveSubmittingInline(true);
    try {
      await purchaseOrderService.receive(selectedItem.id, [{ id: detailId, quantity: qty }]);
      sileo.success({ description: t('purchaseOrders.receiveSuccess') });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setInlineReceiveQty((prev) => ({ ...prev, [detailId]: 0 }));
      refetchSelected(selectedItem.id);
    } catch (err) { setError(extractApiError(err) ?? t('purchaseOrders.error.save')); }
    finally { setReceiveSubmittingInline(false); }
  };

  return (
    <div className="flex h-[calc(100dvh-6rem)] md:h-[calc(100vh-6rem)]">
      <div className={`w-full md:w-[440px] shrink-0 ${mobilePane === 'detail' ? 'hidden md:block' : 'block'}`}>
        <PurchaseOrderList
          orders={purchaseOrdersData}
          loading={loading}
          selectedId={selectedItem?.id ?? null}
          onSelect={handleSelect}
          onCreate={handleCreateNew}
          onReceive={openReceive}
          canReceive={canEdit}
        />
      </div>
      <div className={`flex-1 min-w-0 ${mobilePane === 'list' ? 'hidden md:block' : 'block'}`}>
        <PurchaseOrderForm
          selectedItem={selectedItem}
          formData={formData}
          setFormData={setFormData}
          error={error}
          suppliers={suppliers}
          products={products}
          exchangeRateDays={exchangeRateDays}
          companies={companies}
          canEdit={canEdit}
          uploading={uploading}
          isPending={create.isPending || update.isPending}
          inlineReceiveQty={inlineReceiveQty}
          setInlineReceiveQty={setInlineReceiveQty}
          receiveSubmittingInline={receiveSubmittingInline}
          expandedProducts={expandedProducts}
          setExpandedProducts={setExpandedProducts}
          onSave={handleSave}
          onStatusChange={handleStatusChange}
          onFileUpload={handleFileUpload}
          onInlineReceive={handleInlineReceive}
          onBack={() => setMobilePane('list')}
        />
      </div>

      <Dialog open={receiveOpen} onOpenChange={(o) => { if (!o) { setReceiveOpen(false); setReceiveTarget(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('purchaseOrders.receiveTitle')}</DialogTitle>
            <DialogDescription>{t('purchaseOrders.receiveDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {receiveTarget?.details?.filter((d) => (d.quantity ?? 0) > (d.receivedQuantity ?? 0)).map((d) => (
              <div key={d.id} className="flex items-center gap-3 border border-border/50 rounded p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.product?.name ?? `#${d.idProduct}`}</p>
                  <p className="text-xs text-muted-foreground">{t('purchaseOrders.ordered')}: {d.quantity} | {t('purchaseOrders.receivedLabel')}: {d.receivedQuantity ?? 0}</p>
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
            <Button variant="outline" onClick={() => { setReceiveOpen(false); setReceiveTarget(null); }}>{t('common.cancel')}</Button>
            <Button onClick={handleReceive} disabled={receiveSubmitting}>{receiveSubmitting ? t('common.saving') : t('purchaseOrders.receiveConfirm')}</Button>
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
  );
}
