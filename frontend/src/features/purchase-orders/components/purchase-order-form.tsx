'use client';

import { type ChangeEvent } from 'react';
import { Plus, Trash2, Upload, X, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useI18n } from '@/i18n';
import { PurchaseOrderStatus, PURCHASE_ORDER_TRANSITIONS, type PurchaseOrder, type CreatePurchaseOrderRequest } from '../models/purchase-order.model';
import type { DetailForm, PurchaseOrderFormData } from './purchase-orders-page';

interface PurchaseOrderFormProps {
  selectedItem: PurchaseOrder | null;
  formData: PurchaseOrderFormData;
  setFormData: (data: PurchaseOrderFormData) => void;
  error: string;
  suppliers: { id: string; companyName: string }[];
  products: { id: string; name: string; price: number; priceUsd?: number; taxPercentage?: number }[];
  exchangeRateDays: { id: string; date: string; rateBcvUsd?: number; rateParalelo?: number }[];
  companies: { id: string; isWithholdingAgent?: boolean; withholdingPercentage?: number }[];
  canEdit: boolean;
  uploading: boolean;
  isPending: boolean;
  inlineReceiveQty: Record<string, number>;
  setInlineReceiveQty: (qty: Record<string, number>) => void;
  receiveSubmittingInline: boolean;
  expandedProducts: Record<string, boolean>;
  setExpandedProducts: (v: Record<string, boolean>) => void;
  onSave: (data: CreatePurchaseOrderRequest) => void;
  onStatusChange: (status: PurchaseOrderStatus) => void;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onInlineReceive: (detailId: string) => void;
}

const STATUS_LABEL_KEY: Record<string, string> = {
  [PurchaseOrderStatus.DRAFT]: 'purchaseOrders.status.draft',
  [PurchaseOrderStatus.ISSUED]: 'purchaseOrders.status.issued',
  [PurchaseOrderStatus.RECEIVED]: 'purchaseOrders.status.received',
  [PurchaseOrderStatus.ANNULLED]: 'purchaseOrders.status.annulled',
};

export function PurchaseOrderForm({
  selectedItem, formData, setFormData, error, suppliers, products, exchangeRateDays,
  companies, canEdit, uploading, isPending, inlineReceiveQty, setInlineReceiveQty,
  receiveSubmittingInline, expandedProducts, setExpandedProducts,
  onSave, onStatusChange, onFileUpload, onInlineReceive,
}: PurchaseOrderFormProps) {
  const { t, tp } = useI18n();

  if (!selectedItem) return null;

  const isEditing = !!(selectedItem && selectedItem.id);
  const isReadonly = isEditing && selectedItem.status !== PurchaseOrderStatus.DRAFT;
  const disabled = isReadonly;
  const currentTransitions = PURCHASE_ORDER_TRANSITIONS[(selectedItem.status as PurchaseOrderStatus) ?? PurchaseOrderStatus.DRAFT] ?? [];
  const orgCompany = companies[0];
  const isWithholdingAgent = orgCompany?.isWithholdingAgent ?? false;

  const addDetail = () => {
    setFormData({
      ...formData,
      details: [...formData.details, { idProduct: '', quantity: 1, unitPrice: 0, unitPriceUsd: 0, subtotal: 0, subtotalUsd: 0, observation: '' }],
    });
  };

  const removeDetail = (index: number) => {
    const details = formData.details.filter((_, i) => i !== index);
    const totals = recalc(details);
    setFormData({ ...formData, details, ...totals });
  };

  const updateDetail = (index: number, field: string, value: unknown) => {
    const details = [...formData.details];
    const d = { ...details[index] };
    if (field === 'idProduct') {
      d.idProduct = value as string;
      const product = products.find((p) => p.id === value);
      if (product) {
        d.unitPrice = product.price ?? 0;
        d.unitPriceUsd = product.priceUsd ?? 0;
        d.subtotal = (d.quantity || 1) * (product.price ?? 0);
        d.subtotalUsd = (d.quantity || 1) * (product.priceUsd ?? 0);
      }
    }
    if (field === 'quantity') { d.quantity = Number(value); d.subtotal = d.quantity * d.unitPrice; d.subtotalUsd = d.quantity * d.unitPriceUsd; }
    if (field === 'unitPrice') { d.unitPrice = Number(value); d.subtotal = d.quantity * d.unitPrice; if (formData.exchangeRate > 0) { d.unitPriceUsd = d.unitPrice / formData.exchangeRate; d.subtotalUsd = d.subtotal / formData.exchangeRate; } }
    if (field === 'unitPriceUsd') { d.unitPriceUsd = Number(value); d.subtotalUsd = d.quantity * d.unitPriceUsd; if (formData.exchangeRate > 0) { d.unitPrice = d.unitPriceUsd * formData.exchangeRate; d.subtotal = d.quantity * d.unitPrice; } }
    if (field === 'observation') d.observation = value as string;
    details[index] = d;
    const totals = recalc(details);
    setFormData({ ...formData, details, ...totals });
  };

  const recalc = (details: DetailForm[]) => {
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

  const { baseAmount, baseAmountUsd, ivaAmount, ivaAmountUsd, amount, amountUsd } = recalc(formData.details);
  const withholdingAmount = formData.applyWithholding ? ivaAmount * (formData.withholdingPercentage / 100) : 0;
  const totalToPay = amount - withholdingAmount;
  const hasWithholding = formData.applyWithholding && isWithholdingAgent;

  const handleSave = () => {
    onSave({ ...formData, manualRate: undefined,
      status: formData.status || PurchaseOrderStatus.DRAFT,
      amount, amountUsd, baseAmount, baseAmountUsd, ivaAmount, ivaAmountUsd,
      details: formData.details.filter(d => d.idProduct).map(d => ({
        idProduct: d.idProduct, quantity: d.quantity || 1,
        unitPrice: d.unitPrice || 0, unitPriceUsd: d.unitPriceUsd || 0,
        subtotal: d.subtotal || 0, subtotalUsd: d.subtotalUsd || 0,
        observation: d.observation || undefined,
      })),
    } as unknown as CreatePurchaseOrderRequest);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-semibold">
            {isEditing ? tp('purchaseOrders.editCode', { code: selectedItem.code || `#${selectedItem.id.slice(0, 8)}` }) : t('purchaseOrders.new')}
          </h3>
        </div>
        {isEditing && !isReadonly && currentTransitions.length > 0 && (
          <div className="flex gap-1.5">
            {currentTransitions.map((st) => (
              <Button key={st} size="sm" variant="outline" onClick={() => onStatusChange(st)} disabled={isPending}>
                {t(STATUS_LABEL_KEY[st] ?? '')}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">{error}</div>
        )}

        <div className="space-y-1.5">
          <Label>{t('purchaseOrders.field.supplier')}</Label>
          <SearchableSelect
            value={formData.idSupplier}
            onChange={(v) => setFormData({ ...formData, idSupplier: v ?? '' })}
            placeholder={t('purchaseOrders.field.supplier')}
            emptyText={t('common.noResults')}
            searchFn={async (term) => {
              const q = term.toLowerCase();
              return suppliers.filter((s) => s.companyName.toLowerCase().includes(q));
            }}
            renderItem={(s) => s.companyName}
            getKey={(s) => s.id}
            allowClear={false}
            selectedLabel={suppliers.find((s) => s.id === formData.idSupplier)?.companyName}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t('purchaseOrders.field.code')}</Label>
            <Input
              value={formData.code}
              disabled
              placeholder={`OC-${new Date().getFullYear()}-XXX`}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('purchaseOrders.field.date')}</Label>
            <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={disabled} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('purchaseOrders.field.exchangeRate')}</Label>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">{t('purchaseOrders.manualRate')}</Label>
              <Switch checked={formData.manualRate} onCheckedChange={(v) => setFormData({ ...formData, manualRate: v })} disabled={disabled} />
            </div>
          </div>
          {formData.manualRate ? (
            <Input type="number" step="0.01" value={formData.exchangeRate || ''}
              onChange={(e) => setFormData({ ...formData, exchangeRate: Number(e.target.value) })} disabled={disabled} />
          ) : (
            <Select value={formData.exchangeRateDayId ?? ''} onValueChange={(v) => {
              const er = exchangeRateDays.find((r) => r.id === v);
              setFormData({ ...formData, exchangeRateDayId: v, exchangeRate: (er?.rateBcvUsd ?? er?.rateParalelo ?? 0) });
            }} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder={t('exchangeRates.selectRate')} /></SelectTrigger>
              <SelectContent>
                {exchangeRateDays.map((er) => (
                  <SelectItem key={er.id} value={er.id}>
                    {new Date(er.date).toLocaleDateString()} — Bs. {(er.rateBcvUsd ?? er.rateParalelo ?? 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isWithholdingAgent && (
          <div className="border border-border/50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('purchaseOrders.applyWithholding')}</Label>
              <Switch checked={formData.applyWithholding} onCheckedChange={(v) => setFormData({ ...formData, applyWithholding: v })} disabled={disabled} />
            </div>
            {formData.applyWithholding && (
              <>
                <div className="space-y-1.5">
                  <Label>{t('purchaseOrders.withholdingPercentage')}</Label>
                  <Select value={String(formData.withholdingPercentage)} onValueChange={(v) => setFormData({ ...formData, withholdingPercentage: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="75">{t('purchaseOrders.withholding75')}</SelectItem>
                      <SelectItem value="100">{t('purchaseOrders.withholding100')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('purchaseOrders.withholdingProof')}</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <label className="cursor-pointer">
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {uploading ? t('common.uploading') : t('common.upload')}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={onFileUpload} />
                      </label>
                    </Button>
                    {formData.withholdingProof && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {formData.withholdingProof}
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFormData({ ...formData, withholdingProof: '' })}>
                          <X className="h-3 w-3" />
                        </Button>
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">{t('purchaseOrders.details')}</Label>
            {!isReadonly && (
              <Button variant="outline" size="sm" onClick={addDetail}>
                <Plus className="h-3.5 w-3.5 mr-1" />{t('purchaseOrders.addDetail')}
              </Button>
            )}
          </div>
          {formData.details.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('purchaseOrders.noDetails')}</p>
          ) : (
            <div className="space-y-2">
              {formData.details.map((d, i) => (
                <div key={i} className="border border-border/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{tp('purchaseOrders.detailLabel', { index: String(i + 1) })}</span>
                    {!isReadonly && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDetail(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    {disabled ? (
                      <Input className="h-8 text-xs" value={products.find((p) => p.id === d.idProduct)?.name ?? d.idProduct} disabled />
                    ) : (
                      <SearchableSelect
                        value={d.idProduct}
                        onChange={(v) => updateDetail(i, 'idProduct', v ?? '')}
                        placeholder={t('purchaseOrders.field.product')}
                        emptyText={t('common.noResults')}
                        searchFn={async (term) => {
                          const q = term.toLowerCase();
                          return products.filter((p) => p.name.toLowerCase().includes(q));
                        }}
                        renderItem={(p) => p.name}
                        getKey={(p) => p.id}
                        allowClear={false}
                        selectedLabel={products.find((p) => p.id === d.idProduct)?.name}
                      />
                    )}
                  </div>
                    <Input type="number" min={1} className="h-8 text-xs" placeholder={t('purchaseOrders.field.quantity')} value={d.quantity || ''} onChange={(e) => updateDetail(i, 'quantity', e.target.value)} disabled={disabled} />
                    <Input type="number" step="0.01" className="h-8 text-xs" placeholder={t('purchaseOrders.field.unitPrice')} value={d.unitPrice || ''} onChange={(e) => updateDetail(i, 'unitPrice', e.target.value)} disabled={disabled} />
                    <Input type="number" step="0.01" className="h-8 text-xs" placeholder={t('purchaseOrders.field.unitPriceUsd')} value={d.unitPriceUsd || ''} onChange={(e) => updateDetail(i, 'unitPriceUsd', e.target.value)} disabled={disabled} />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{t('purchaseOrders.field.subtotal')}:</span>
                    <span className="font-medium tabular-nums">Bs. {d.subtotal.toFixed(2)}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-medium tabular-nums">$ {d.subtotalUsd.toFixed(2)}</span>
                  </div>
                  <Input className="h-8 text-xs" placeholder={t('purchaseOrders.field.observation')} value={d.observation} onChange={(e) => updateDetail(i, 'observation', e.target.value)} disabled={disabled} />
                </div>
              ))}
            </div>
          )}
        </div>

        {formData.details.length > 0 && (
          <div className="border border-border/50 rounded-lg p-3 space-y-1.5 bg-muted/20">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('purchaseOrders.baseAmount')}</span><span className="tabular-nums">Bs. {baseAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('purchaseOrders.ivaAmount')}</span><span className="tabular-nums">Bs. {ivaAmount.toFixed(2)}</span>
            </div>
            {hasWithholding && (
              <div className="flex justify-between text-xs text-destructive">
                <span>{t('purchaseOrders.withholdingAmount')}</span><span className="tabular-nums">-Bs. {withholdingAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-1.5 mt-1">
              <span>{hasWithholding ? t('purchaseOrders.totalToPay') : t('purchaseOrders.field.amount')}</span>
              <span className="tabular-nums">Bs. {(hasWithholding ? totalToPay : amount).toFixed(2)}</span>
            </div>
          </div>
        )}

        {!isReadonly && (
          <Button className="w-full" disabled={isPending || !formData.idSupplier} onClick={handleSave}>
            {isPending ? t('common.saving') : isEditing ? t('common.save') : t('purchaseOrders.new')}
          </Button>
        )}

        {isEditing && selectedItem.details && selectedItem.details.length > 0 && (
          <div className="border-t border-border/50 pt-4 mt-2">
            <button type="button" className="flex items-center gap-1 text-sm font-medium mb-2 hover:text-primary"
              onClick={() => setExpandedProducts({ ...expandedProducts, [selectedItem.id]: !expandedProducts[selectedItem.id] })}>
              {expandedProducts[selectedItem.id] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {t('purchaseOrders.receivedStatus')}
            </button>
            {expandedProducts[selectedItem.id] && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground text-xs">
                    <th className="text-left pb-1">{t('purchaseOrders.field.product')}</th>
                    <th className="text-right pb-1">{t('purchaseOrders.field.quantity')}</th>
                    <th className="text-right pb-1">{t('purchaseOrders.field.received')}</th>
                    {canEdit && selectedItem.status !== 'ANNULLED' && selectedItem.status !== 'DRAFT' && (
                      <th className="text-right pb-1 w-28">{t('purchaseOrders.receive')}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.details.map((d) => {
                    const pending = Math.max(0, (d.quantity ?? 0) - (d.receivedQuantity ?? 0));
                    return (
                      <tr key={d.id} className="border-b border-border/50 last:border-0">
                        <td className="py-1 text-xs">{d.product?.name ?? `#${d.idProduct}`}</td>
                        <td className="text-right py-1 text-xs">{d.quantity}</td>
                        <td className="text-right py-1 text-xs">
                          <span className={pending > 0 ? 'text-yellow-600 font-medium' : 'text-green-600'}>{d.receivedQuantity ?? 0}</span>
                        </td>
                        {canEdit && selectedItem.status !== 'ANNULLED' && selectedItem.status !== 'DRAFT' && (
                          <td className="py-1 pl-1">
                            {pending > 0 ? (
                              <div className="flex items-center gap-1">
                                <Input type="number" min={1} max={pending} className="h-7 w-14 text-xs"
                                  value={inlineReceiveQty[d.id] ?? ''}
                                  onChange={(e) => setInlineReceiveQty({ ...inlineReceiveQty, [d.id]: Math.min(Number(e.target.value) || 0, pending) })} />
                                <Button variant="outline" size="sm" className="h-7 text-xs"
                                  disabled={!(inlineReceiveQty[d.id] ?? 0) || receiveSubmittingInline}
                                  onClick={() => onInlineReceive(d.id)}>
                                  <Package className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : <span className="text-xs text-green-600">✓</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
