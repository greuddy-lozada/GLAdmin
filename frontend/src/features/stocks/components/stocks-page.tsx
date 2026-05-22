'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('stocks.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('stocks.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('stocks.field.product')} select value={formData.idProduct}
            onChange={(e) => setFormData({ ...formData, idProduct: Number(e.target.value) })} fullWidth required>
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>{product.code} - {product.name}</MenuItem>
            ))}
          </TextField>
          <TextField label={t('stocks.field.supplier')} select value={formData.idSupplier ?? ''}
            onChange={(e) => setFormData({ ...formData, idSupplier: e.target.value ? Number(e.target.value) : undefined })}
            fullWidth>
            <MenuItem value="">{t('common.empty') ?? 'Ninguno'}</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>{supplier.companyName}</MenuItem>
            ))}
          </TextField>
          <TextField label={t('stocks.field.batch')} select value={formData.idBatch ?? ''}
            onChange={(e) => setFormData({ ...formData, idBatch: e.target.value ? Number(e.target.value) : undefined })}
            fullWidth>
            <MenuItem value="">{t('common.empty') ?? 'Ninguno'}</MenuItem>
            {batches.map((batch) => (
              <MenuItem key={batch.id} value={batch.id}>{batch.code}</MenuItem>
            ))}
          </TextField>
          <TextField label={t('stocks.field.existence')} type="number" value={formData.existence}
            onChange={(e) => setFormData({ ...formData, existence: Number(e.target.value) })} fullWidth required />
          {selectedStock && (
            <FormControlLabel control={
              <Switch checked={formData.available ?? true}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })} />
            } label={t('stocks.field.available')} />
          )}
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
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
    </Box>
  );
}
