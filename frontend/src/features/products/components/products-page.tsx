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
import { useProducts } from '@/features/products/hooks/use-products';
import { Product, CreateProductRequest, UpdateProductRequest } from '@/features/products/models/product.model';
import { productService } from '@/features/products/services/product.service';
import { useI18n } from '@/i18n';
import apiClient from '@/lib/api/api-client';

export default function ProductsPage() {
  const { products, loading, loadProducts } = useProducts();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductRequest & { available?: boolean }>({
    code: '',
    name: '',
    price: 0,
  });
  const [taxes, setTaxes] = useState<{ id: number; name: string; percentage: number }[]>([]);
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
    apiClient.get('/taxes').then((r) => setTaxes(r.data.data || [])).catch(() => {});
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
      } else {
        await productService.create(formData);
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('products.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('products.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={products}
        loading={loading}
        onEdit={openEdit}
        onDelete={(product) => {
          setDeleteTarget(product);
          setDeleteOpen(true);
        }}
        emptyMessage={t('products.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedProduct ? t('products.edit') : t('products.new')}
        onClose={() => setFormOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('products.field.code')} value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })} fullWidth required />
          <TextField label={t('products.field.name')} value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required />
          <TextField label={t('products.field.price')} type="number" value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} fullWidth required />
          <TextField label={t('products.field.dollarPrice')} type="number" value={formData.dollarPrice ?? ''}
            onChange={(e) => setFormData({ ...formData, dollarPrice: e.target.value ? Number(e.target.value) : undefined })}
            fullWidth />
          <TextField label={t('products.field.tax')} select value={formData.idTax ?? ''}
            onChange={(e) => setFormData({ ...formData, idTax: e.target.value ? Number(e.target.value) : undefined })}
            fullWidth>
            <MenuItem value="">{t('common.empty') ?? 'Ninguno'}</MenuItem>
            {taxes.map((tax) => (
              <MenuItem key={tax.id} value={tax.id}>{tax.name} ({tax.percentage}%)</MenuItem>
            ))}
          </TextField>
          <TextField label={t('products.field.observation')} value={formData.observation ?? ''}
            onChange={(e) => setFormData({ ...formData, observation: e.target.value })} fullWidth multiline rows={3} />
          <TextField label={t('products.field.image')} value={formData.image ?? ''}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })} fullWidth />
          {selectedProduct && (
            <FormControlLabel control={
              <Switch checked={formData.available ?? true}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })} />
            } label={t('products.field.available')} />
          )}
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('products.delete')}
        message={tp('products.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
}
