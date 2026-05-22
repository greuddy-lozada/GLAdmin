'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Alert,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePurchaseOrders } from '@/features/purchase-orders/hooks/use-purchase-orders';
import { PurchaseOrder, CreatePurchaseOrderRequest } from '@/features/purchase-orders/models/purchase-order.model';
import { purchaseOrderService } from '@/features/purchase-orders/services/purchase-order.service';
import { useI18n } from '@/i18n';
import apiClient from '@/lib/api/api-client';

export default function PurchaseOrdersPage() {
  const { items, loading, loadItems } = usePurchaseOrders();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<CreatePurchaseOrderRequest>({
    idSupplier: 0,
    code: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 1,
    status: 1,
    details: [],
  });
  const [suppliers, setSuppliers] = useState<{ id: number; companyName: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; code: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

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
      render: (row) => (row.amount != null ? `RD$ ${Number(row.amount).toFixed(2)}` : '-'),
    },
    {
      field: 'date',
      headerName: t('purchaseOrders.field.date'),
      render: (row) => (row.date ? new Date(row.date).toLocaleDateString() : '-'),
    },
  ];

  useEffect(() => {
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => {});
    apiClient.get('/products').then((r) => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setSelectedItem(null);
    setError('');
    setFormData({
      idSupplier: 0,
      code: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 1,
      status: 1,
      details: [],
    });
    setFormOpen(true);
  };

  const addDetail = () => {
    setFormData({
      ...formData,
      details: [...(formData.details || []), { idProduct: 0, quantity: 1, subtotal: 0, observation: '' }],
    });
  };

  const removeDetail = (index: number) => {
    setFormData({
      ...formData,
      details: (formData.details || []).filter((_, i) => i !== index),
    });
  };

  const updateDetail = (index: number, field: string, value: unknown) => {
    const updated = [...(formData.details || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, details: updated });
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        amount: Number(formData.amount),
        idSupplier: Number(formData.idSupplier),
      };
      if (selectedItem) {
        await purchaseOrderService.update(selectedItem.id, {
          idSupplier: data.idSupplier,
          code: data.code,
          date: data.date,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          status: data.status,
        });
      } else {
        await purchaseOrderService.create(data);
      }
      await loadItems();
      setFormOpen(false);
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
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('purchaseOrders.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('purchaseOrders.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('purchaseOrders.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable columns={columns} rows={items} loading={loading} emptyMessage={t('purchaseOrders.empty')}
        onDelete={(item) => { setDeleteTarget(item); setDeleteOpen(true); }} />

      <SlideForm open={formOpen} title={selectedItem ? t('purchaseOrders.edit') : t('purchaseOrders.new')} onClose={() => setFormOpen(false)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('purchaseOrders.field.supplier')} select value={formData.idSupplier}
            onChange={(e) => setFormData({ ...formData, idSupplier: Number(e.target.value) })} fullWidth required>
            {suppliers.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.companyName}</MenuItem>
            ))}
          </TextField>
          <TextField label={t('purchaseOrders.field.code')} value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })} fullWidth />
          <TextField label={t('purchaseOrders.field.date')} type="date" value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label={t('purchaseOrders.field.amount')} type="number" value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} fullWidth />

          {!selectedItem && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                {t('purchaseOrders.details')}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addDetail}>
                {t('purchaseOrders.addDetail')}
              </Button>
              {(formData.details || []).map((detail, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <TextField label={t('purchaseOrders.field.product')} select value={detail.idProduct}
                      onChange={(e) => updateDetail(index, 'idProduct', Number(e.target.value))} fullWidth required>
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{`${p.code} - ${p.name}`}</MenuItem>
                      ))}
                    </TextField>
                    <TextField label={t('purchaseOrders.field.quantity')} type="number" value={detail.quantity}
                      onChange={(e) => updateDetail(index, 'quantity', Number(e.target.value))} fullWidth />
                    <TextField label={t('purchaseOrders.field.subtotal')} type="number" value={detail.subtotal}
                      onChange={(e) => updateDetail(index, 'subtotal', Number(e.target.value))} fullWidth />
                    <TextField label={t('purchaseOrders.field.observation')} value={detail.observation}
                      onChange={(e) => updateDetail(index, 'observation', e.target.value)} fullWidth />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton color="error" onClick={() => removeDetail(index)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </>
          )}

          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog open={deleteOpen} title={t('purchaseOrders.delete')}
        message={tp('purchaseOrders.deleteConfirm', { code: String(deleteTarget?.code ?? deleteTarget?.id ?? '') })}
        confirmLabel={t('common.delete')} onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }} loading={submitting} />
    </Box>
  );
}
