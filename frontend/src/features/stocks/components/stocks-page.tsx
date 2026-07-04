'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useStocks } from '@/features/stocks/hooks/use-stocks';
import { Stock, CreateStockRequest } from '@/features/stocks/models/stock.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import apiClient from '@/lib/api/api-client';

export default function StocksPage() {
  const { items: stocksData, isLoading: loading, create, update, remove } = useStocks();
  const { t } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [formData, setFormData] = useState<CreateStockRequest & { available?: boolean }>({
    idProduct: 0,
    existence: 1,
  });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Stock | null>(null);

  const columns: Column<Stock>[] = [
    {
      field: 'idProduct',
      headerName: t('stocks.field.product'),
      render: (row) => row.product ? `${row.product.code} - ${row.product.name}` : '',
    },
    {
      field: 'idSupplier',
      headerName: t('stocks.field.supplier'),
      render: (row) => row.supplier?.companyName ?? '',
    },
    {
      field: 'idBatch',
      headerName: t('stocks.field.batch'),
      render: (row) => row.batch?.code ?? '',
    },
    { field: 'existence', headerName: t('stocks.field.existence') },
    {
      field: 'available',
      headerName: t('stocks.field.available'),
      render: (row) => (row.available ? t('common.yes') : t('common.no')),
    },
  ];

  const openCreate = () => {
    setSelectedStock(null);
    setError('');
    setFormData({ idProduct: 0, existence: 1 });
    setFormOpen(true);
  };

  const openEdit = (stock: Stock) => {
    setSelectedStock(stock);
    setError('');
    setFormData({
      idProduct: stock.idProduct,
      idSupplier: stock.idSupplier,
      idBatch: stock.idBatch,
      existence: stock.existence,
      available: stock.available,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedStock;
    if (isEdit) {
      update.mutate(
        {
          id: selectedStock!.id,
          data: {
            idProduct: formData.idProduct,
            idSupplier: formData.idSupplier,
            idBatch: formData.idBatch,
            existence: formData.existence,
            available: formData.available,
          },
        },
        {
          onSuccess: () => sileo.success({ description: t('stocks.updated') }),
          onError: () => { setError(t('stocks.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('stocks.created') }),
        onError: () => { setError(t('stocks.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('stocks.deleted') }),
      onError: () => { setError(t('stocks.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedStock ? t('stocks.edit') : t('stocks.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('stocks.field.product')}</Label>
            <SearchableSelect
              value={formData.idProduct || undefined}
              onChange={(v) => setFormData({ ...formData, idProduct: v ?? 0 })}
              placeholder={t('common.selectProduct')}
              emptyText="Sin resultados"
              selectedLabel={selectedStock?.product ? `${selectedStock.product.code} - ${selectedStock.product.name}` : undefined}
              searchFn={(term) => apiClient.get('/products', { params: { search: term, limit: 10 } }).then(r => r.data.data)}
              renderItem={(p: { id: number; code: string; name: string }) => `${p.code} - ${p.name}`}
              getKey={(p: { id: number }) => p.id}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('stocks.field.supplier')}</Label>
            <SearchableSelect
              value={formData.idSupplier}
              onChange={(v) => setFormData({ ...formData, idSupplier: v })}
              placeholder={t('common.none')}
              emptyText="Sin resultados"
              allowClear
              selectedLabel={selectedStock?.supplier?.companyName}
              searchFn={(term) => apiClient.get('/suppliers', { params: { search: term, limit: 10 } }).then(r => r.data.data)}
              renderItem={(s: { id: number; companyName: string }) => s.companyName}
              getKey={(s: { id: number }) => s.id}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('stocks.field.batch')}</Label>
            <SearchableSelect
              value={formData.idBatch}
              onChange={(v) => setFormData({ ...formData, idBatch: v })}
              placeholder={t('common.none')}
              emptyText="Sin resultados"
              allowClear
              selectedLabel={selectedStock?.batch?.code}
              searchFn={(term) => apiClient.get('/batches', { params: { search: term, limit: 10 } }).then(r => r.data.data)}
              renderItem={(b: { id: number; code: string }) => b.code}
              getKey={(b: { id: number }) => b.id}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('stocks.field.existence')}</Label>
            <Input type="number" value={formData.existence}
              onChange={(e) => setFormData({ ...formData, existence: Number(e.target.value) })} required />
          </div>
          {selectedStock && (
            <div className="flex items-center gap-2">
              <Switch checked={formData.available ?? true}
                onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
              <Label>{t('stocks.field.available')}</Label>
            </div>
          )}
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={60}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('stocks.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={stocksData}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (stock) => {
          setDeleteTarget(stock);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('stocks.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('stocks.delete')}
        message={t('stocks.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
    </SlideForm>
  );
}
