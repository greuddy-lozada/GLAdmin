'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
import { productService } from '@/features/products/services/product.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';
import { exchangeRateService } from '@/features/exchange-rates/services/exchange-rate.service';

export default function ProductsPage() {
  const { products, loading, loadProducts } = useProducts();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductRequest & { available?: boolean }>({
    code: '',
    name: '',
    price: 0,
  });
  const [taxes, setTaxes] = useState<{ id: number; name: string; percentage: number }[]>([]);
  const [bcvRate, setBcvRate] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const columns: Column<Product>[] = [
    { field: 'id', headerName: t('products.field.id') },
    { field: 'code', headerName: t('products.field.code') },
    { field: 'name', headerName: t('products.field.name') },
    { field: 'price', headerName: t('products.field.price') },
    { field: 'dollarPrice', headerName: t('products.field.dollarPrice') },
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
      field: 'available',
      headerName: t('products.field.available'),
      render: (row) => (row.available ? t('common.yes') : t('common.no')),
    },
  ];

  useEffect(() => {
    apiClient.get('/taxes').then((r: { data: { data: { id: number; name: string; percentage: number }[] } }) => setTaxes(r.data.data || [])).catch(() => console.warn('Failed to load taxes'));
    exchangeRateService.getLatest().then((day) => { if (day?.rateBcvUsd) setBcvRate(day.rateBcvUsd); }).catch(() => console.warn('Failed to load BCV rate'));
  }, []);

  const openCreate = () => {
    setSelectedProduct(null);
    setError('');
    setFormData({ code: '', name: '', price: 0 });
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setError('');
    setFormData({
      code: product.code,
      name: product.name,
      price: product.price,
      dollarPrice: product.dollarPrice,
      idTax: product.idTax,
      observation: product.observation,
      image: product.image,
      available: product.available,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedProduct) {
        const data: UpdateProductRequest = {
          code: formData.code,
          name: formData.name,
          price: formData.price,
          dollarPrice: formData.dollarPrice,
          idTax: formData.idTax,
          observation: formData.observation,
          image: formData.image,
          available: formData.available,
        };
        await productService.update(selectedProduct.id, data);
        sileo.success({ description: t('products.updated') });
      } else {
        await productService.create(formData);
        sileo.success({ description: t('products.created') });
      }
      await loadProducts();
      setFormOpen(false);
    } catch {
      setError(t('products.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await productService.delete(deleteTarget.id);
      sileo.success({ description: t('products.deleted') });
      await loadProducts();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('products.error.delete'));
    } finally {
      setSubmitting(false);
    }
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
            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.price')}</Label>
            <Input type="number" value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.dollarPrice')}</Label>
            <Input type="number" value={formData.dollarPrice ?? ''}
              onChange={(e) => {
                const usd = e.target.value ? Number(e.target.value) : undefined;
                setFormData({
                  ...formData,
                  dollarPrice: usd,
                  price: usd && bcvRate > 0 ? usd * bcvRate : formData.price,
                });
              }} />
            {bcvRate > 0 && (
              <span className="text-xs text-muted-foreground">
                BCV: {bcvRate.toFixed(2)} | {formData.dollarPrice ? `${(formData.dollarPrice * bcvRate).toFixed(2)} VED` : ''}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('products.field.tax')}</Label>
            <Select value={formData.idTax ? String(formData.idTax) : ''}
              onValueChange={(v) => setFormData({ ...formData, idTax: v ? Number(v) : undefined })}>
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {taxes.map((tax) => (
                  <SelectItem key={tax.id} value={String(tax.id)}>{tax.name} ({tax.percentage}%)</SelectItem>
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
            {t('products.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={products}
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
        loading={submitting}
      />
    </SlideForm>
  );
}
