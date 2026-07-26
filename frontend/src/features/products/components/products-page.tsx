'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
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
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useProducts } from '@/features/products/hooks/use-products';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/features/products/models/product.model';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';
import { exchangeRateService } from '@/features/exchange-rates/services/exchange-rate.service';

function computePvpUsd(baseCost: number, margin: number): number {
  return baseCost * (1 + margin / 100);
}

function computePvpVes(pvpUsd: number, bcvRate: number): number {
  return bcvRate > 0 ? pvpUsd * bcvRate : 0;
}

export default function ProductsPage() {
  const { items: productsData, isLoading: loading, create, update, remove } = useProducts();
  const { t, tp } = useI18n();
  const { effectiveRoleSlug } = useAuth();
  const role = effectiveRoleSlug;
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductRequest & { available?: boolean }>({
    code: '',
    name: '',
    price: 0,
    dollarPrice: 0,
    baseCost: 0,
    margin: 20,
  });
  const [pvpOverride, setPvpOverride] = useState(false);
  const [taxes, setTaxes] = useState<{ id: string; name: string; percentage: number }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [bcvRate, setBcvRate] = useState(0);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);

  const computedPvpUsd = computePvpUsd(formData.baseCost ?? 0, formData.margin ?? 20);
  const displayPvpUsd = pvpOverride ? (formData.dollarPrice ?? 0) : computedPvpUsd;
  const displayPvpVes = computePvpVes(displayPvpUsd, bcvRate);

  const columns: Column<Product>[] = [
    { field: 'name', headerName: t('products.field.name') },
    {
      field: 'dollarPrice',
      headerName: t('products.field.pvpUsd'),
      render: (row) => {
        if (row.baseCost != null) {
          return `$${computePvpUsd(row.baseCost, row.margin ?? 20).toFixed(2)}`;
        }
        return `$${(row.dollarPrice ?? 0).toFixed(2)}`;
      },
      isNumeric: true,
    },
    {
      field: 'price',
      headerName: t('products.field.pvpVes'),
      render: (row) => `Bs. ${(row.price ?? 0).toFixed(2)}`,
      isNumeric: true,
    },
    {
      field: 'stock',
      headerName: t('products.field.stock'),
      render: (row) => row.stock ?? 0,
    },
    {
      field: 'idTax',
      headerName: t('products.field.tax'),
      render: (row) => row.tax?.name ?? '',
    },
    {
      field: 'idBrand',
      headerName: t('products.field.brand'),
      render: (row) => row.brand?.name ?? '',
    },
    {
      field: 'idCategory',
      headerName: t('products.field.category'),
      render: (row) => row.category?.name ?? '',
    },
    {
      field: 'available',
      headerName: t('products.field.available'),
      render: (row) => (row.available ? t('common.yes') : t('common.no')),
    },
  ];

  useEffect(() => {
    apiClient.get('/taxes').then((r: { data: { data: { id: string; name: string; percentage: number }[] } }) => setTaxes(r.data.data || [])).catch(() => console.warn('Failed to load taxes'));
    apiClient.get('/brands').then((r: { data: { data: { id: string; name: string }[] } }) => setBrands(r.data.data || [])).catch(() => console.warn('Failed to load brands'));
    apiClient.get('/categories').then((r: { data: { data: { id: string; name: string }[] } }) => setCategories(r.data.data || [])).catch(() => console.warn('Failed to load categories'));
    exchangeRateService.getLatest().then((day) => { if (day?.rateBcvUsd) setBcvRate(day.rateBcvUsd); }).catch(() => console.warn('Failed to load BCV rate'));
  }, []);

  const openCreate = () => {
    setSelectedProduct(null);
    setError('');
    setPvpOverride(false);
    setFormData({ code: '', name: '', price: 0, dollarPrice: 0, baseCost: 0, margin: 20 });
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setError('');
    setPvpOverride(false);
    setFormData({
      code: product.code,
      name: product.name,
      price: product.price,
      dollarPrice: product.dollarPrice ?? 0,
      baseCost: product.baseCost ?? 0,
      margin: product.margin ?? 20,
      idTax: product.idTax ?? undefined,
      observation: product.observation ?? undefined,
      image: product.image ?? undefined,
      available: product.available,
    });
    setFormOpen(true);
  };

  const handleBaseCostChange = (value: number) => {
    const bc = value;
    const marginPct = formData.margin ?? 20;
    const pvpUsd = computePvpUsd(bc, marginPct);
    setFormData({
      ...formData,
      baseCost: bc,
      dollarPrice: pvpUsd,
      price: computePvpVes(pvpUsd, bcvRate),
    });
  };

  const handleMarginChange = (value: number) => {
    const marginPct = value;
    const bc = formData.baseCost ?? 0;
    const pvpUsd = computePvpUsd(bc, marginPct);
    setFormData({
      ...formData,
      margin: marginPct,
      dollarPrice: pvpUsd,
      price: computePvpVes(pvpUsd, bcvRate),
    });
  };

  const handleDollarPriceChange = (value: number) => {
    setFormData({
      ...formData,
      dollarPrice: value,
      price: computePvpVes(value, bcvRate),
    });
  };

  const togglePvpOverride = () => {
    if (pvpOverride) {
      const recomputed = computePvpUsd(formData.baseCost ?? 0, formData.margin ?? 20);
      setFormData({
        ...formData,
        dollarPrice: recomputed,
        price: computePvpVes(recomputed, bcvRate),
      });
    }
    setPvpOverride(!pvpOverride);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedProduct;
    if (isEdit) {
      update.mutate(
        {
          id: selectedProduct!.id,
          data: {
            code: formData.code,
            name: formData.name,
            price: displayPvpVes,
            dollarPrice: displayPvpUsd,
            baseCost: formData.baseCost,
            margin: formData.margin,
            idTax: formData.idTax,
            observation: formData.observation,
            image: formData.image,
            available: formData.available,
          } as UpdateProductRequest,
        },
        {
          onSuccess: () => sileo.success({ description: t('products.updated') }),
          onError: () => { setError(t('products.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(
        { ...formData, dollarPrice: displayPvpUsd, price: displayPvpVes } as CreateProductRequest,
        {
          onSuccess: () => sileo.success({ description: t('products.created') }),
          onError: () => { setError(t('products.error.save')); setFormOpen(true); },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('products.deleted') }),
      onError: () => { setError(t('products.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedProduct ? t('products.edit') : t('products.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('products.field.code')}</Label>
            <Input className="font-mono" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="border border-border/50 rounded-lg p-4 space-y-4 bg-muted/30">
            <h4 className="text-sm font-medium">{t('products.field.baseCost')}</h4>
            <div className="space-y-2">
              <Label>{t('products.field.baseCost')}</Label>
              <Input type="number" step="0.01" min="0"
                value={formData.baseCost ?? ''}
                onChange={(e) => handleBaseCostChange(e.target.value ? Number(e.target.value) : 0)} />
            </div>
            <div className="space-y-2">
              <Label>{t('products.field.margin')}</Label>
              <Input type="number" step="0.1" min="0"
                value={formData.margin}
                onChange={(e) => handleMarginChange(e.target.value ? Number(e.target.value) : 0)} />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <div className="flex-1 space-y-2">
                <Label>{t('products.field.pvpUsd')}</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.01" min="0"
                    value={displayPvpUsd.toFixed(2)}
                    disabled={!pvpOverride}
                    onChange={(e) => handleDollarPriceChange(e.target.value ? Number(e.target.value) : 0)}
                    className={pvpOverride ? 'border-amber-400' : ''} />
                  <button type="button" onClick={togglePvpOverride}
                    className={`p-2 rounded-md border border-border/50 transition-colors ${pvpOverride ? 'bg-amber-100 border-amber-400 text-amber-700' : 'bg-muted text-muted-foreground'}`}
                    title={t('products.field.pvpOverride')}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('products.field.pvpVes')}</Label>
              <Input type="number" value={displayPvpVes.toFixed(2)} disabled />
              {bcvRate > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t('products.field.bcvRate')}: {bcvRate.toFixed(2)} Bs./USD
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.tax')}</Label>
            <Select value={formData.idTax ?? ''}
              onValueChange={(v) => setFormData({ ...formData, idTax: v || undefined })}>
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {taxes.map((tax) => (
                  <SelectItem key={tax.id} value={String(tax.id)}>{tax.name} ({tax.percentage}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.brand')}</Label>
            {showNewBrandInput ? (
              <div className="flex items-center gap-2">
                <Input value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder={t('products.brandPlaceholder')}
                  autoFocus />
                <Button size="sm" disabled={!newBrandName.trim() || create.isPending || update.isPending}
                  onClick={async () => {
                    if (!newBrandName.trim()) return;
                    try {
                      const created = await apiClient.post('/brands', { name: newBrandName.trim() });
                      const brand = created.data.data;
                      setBrands((prev) => [...prev, { id: brand.id, name: brand.name }]);
                      setFormData({ ...formData, idBrand: brand.id });
                      setNewBrandName('');
                      setShowNewBrandInput(false);
                    } catch {
                      setError(t('products.error.save'));
                    }
                  }}>
                  {t('common.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewBrandInput(false); setNewBrandName(''); }}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <Select value={formData.idBrand ?? ''}
                onValueChange={(v) => {
                  if (v === '__new__') { setShowNewBrandInput(true); return; }
                  setFormData({ ...formData, idBrand: v || undefined });
                }}>
                <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={String(brand.id)}>{brand.name}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-primary font-medium">
                    <Plus className="h-3 w-3 inline mr-1" />{t('products.addBrand')}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.category')}</Label>
            <Select value={formData.idCategory ?? ''}
              onValueChange={(v) => setFormData({ ...formData, idCategory: v || undefined })}>
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.observation')}</Label>
            <Input value={formData.observation ?? ''}
              onChange={(e) => setFormData({ ...formData, observation: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.image')}</Label>
            <Input value={formData.image ?? ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
          </div>
          {selectedProduct && (
            <div className="flex items-center gap-2">
              <Switch checked={formData.available ?? true}
                onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
              <Label>{t('products.field.available')}</Label>
            </div>
          )}
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
            {t('products.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={productsData}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (product) => {
          setDeleteTarget(product);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('products.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('products.delete')}
        message={tp('products.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
      </div>
    </SlideForm>
  );
}
