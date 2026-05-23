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
import { useStocks } from '@/features/stocks/hooks/use-stocks';
import { Stock, CreateStockRequest, UpdateStockRequest } from '@/features/stocks/models/stock.model';
import { stockService } from '@/features/stocks/services/stock.service';
import { useI18n } from '@/i18n';
import apiClient from '@/lib/api/api-client';

export default function StocksPage() {
  const { stocks, loading, loadStocks } = useStocks();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [formData, setFormData] = useState<CreateStockRequest & { available?: boolean }>({
    idProduct: 0,
    existence: 1,
  });
  const [products, setProducts] = useState<{ id: number; code: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; companyName: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number; code: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Stock | null>(null);

  const columns: Column<Stock>[] = [
    { field: 'id', headerName: t('stocks.field.id') },
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

  useEffect(() => {
    apiClient.get('/products').then((r) => setProducts(r.data.data || [])).catch(() => {});
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => {});
    apiClient.get('/batches').then((r) => setBatches(r.data.data || [])).catch(() => {});
  }, []);

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

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedStock) {
        const data: UpdateStockRequest = {
          idProduct: formData.idProduct,
          idSupplier: formData.idSupplier,
          idBatch: formData.idBatch,
          existence: formData.existence,
          available: formData.available,
        };
        await stockService.update(selectedStock.id, data);
      } else {
        await stockService.create(formData);
      }
      await loadStocks();
      setFormOpen(false);
    } catch {
      setError(t('stocks.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await stockService.delete(deleteTarget.id);
      await loadStocks();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('stocks.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('stocks.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('stocks.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={stocks}
        loading={loading}
        onEdit={openEdit}
        onDelete={(stock) => {
          setDeleteTarget(stock);
          setDeleteOpen(true);
        }}
        emptyMessage={t('stocks.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedStock ? t('stocks.edit') : t('stocks.new')}
        onClose={() => setFormOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('stocks.field.product')}</Label>
            <Select value={String(formData.idProduct)} onValueChange={(v) => setFormData({ ...formData, idProduct: Number(v) })}>
              <SelectTrigger><SelectValue placeholder={t('common.selectProduct')} /></SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>{product.code} - {product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('stocks.field.supplier')}</Label>
            <Select value={formData.idSupplier ? String(formData.idSupplier) : ''}
              onValueChange={(v) => setFormData({ ...formData, idSupplier: v ? Number(v) : undefined })}>
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={String(supplier.id)}>{supplier.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('stocks.field.batch')}</Label>
            <Select value={formData.idBatch ? String(formData.idBatch) : ''}
              onValueChange={(v) => setFormData({ ...formData, idBatch: v ? Number(v) : undefined })}>
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={String(batch.id)}>{batch.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('stocks.delete')}
        message={t('stocks.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </div>
  );
}
