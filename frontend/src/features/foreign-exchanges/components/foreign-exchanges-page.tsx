'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useForeignExchanges } from '@/features/foreign-exchanges/hooks/use-foreign-exchanges';
import { ForeignExchange, CreateForeignExchangeRequest, UpdateForeignExchangeRequest } from '@/features/foreign-exchanges/models/foreign-exchange.model';
import { foreignExchangeService } from '@/features/foreign-exchanges/services/foreign-exchange.service';
import { useI18n } from '@/i18n';
import apiClient from '@/lib/api/api-client';

export default function ForeignExchangesPage() {
  const { items, loading, loadItems } = useForeignExchanges();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ForeignExchange | null>(null);
  const [formData, setFormData] = useState<CreateForeignExchangeRequest>({
    value: 0,
    idCurrency: undefined,
  });
  const [currencies, setCurrencies] = useState<{ id: number; code: string; name: string; symbol: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ForeignExchange | null>(null);

  const columns: Column<ForeignExchange>[] = [
    { field: 'id', headerName: t('foreignExchanges.field.id') },
    {
      field: 'value',
      headerName: t('foreignExchanges.field.value'),
      render: (row) => (row.value != null ? Number(row.value).toFixed(2) : '-'),
    },
    {
      field: 'currency',
      headerName: t('foreignExchanges.field.currency'),
      render: (row) => row.currency?.name ?? '-',
    },
    {
      field: 'createdAt',
      headerName: t('foreignExchanges.field.createdAt'),
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  useEffect(() => {
    apiClient.get('/currencies').then((r) => setCurrencies(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setSelectedItem(null);
    setError('');
    setFormData({ value: 0, idCurrency: undefined });
    setFormOpen(true);
  };

  const openEdit = (item: ForeignExchange) => {
    setSelectedItem(item);
    setError('');
    setFormData({
      value: item.value,
      idCurrency: item.idCurrency,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        value: Number(formData.value),
      };
      if (selectedItem) {
        await foreignExchangeService.update(selectedItem.id, data as UpdateForeignExchangeRequest);
      } else {
        await foreignExchangeService.create(data);
      }
      await loadItems();
      setFormOpen(false);
    } catch {
      setError(t('foreignExchanges.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await foreignExchangeService.delete(deleteTarget.id);
      await loadItems();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('foreignExchanges.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('foreignExchanges.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('foreignExchanges.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={(item) => { setDeleteTarget(item); setDeleteOpen(true); }}
        emptyMessage={t('foreignExchanges.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedItem ? t('foreignExchanges.edit') : t('foreignExchanges.new')}
        onClose={() => setFormOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('foreignExchanges.field.value')} type="number" value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} fullWidth required />
          <TextField label={t('foreignExchanges.field.currency')} select value={formData.idCurrency ?? ''}
            onChange={(e) => setFormData({ ...formData, idCurrency: Number(e.target.value) })} fullWidth>
            {currencies.map((c) => (
              <MenuItem key={c.id} value={c.id}>{`${c.name} (${c.code})`}</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('foreignExchanges.delete')}
        message={t('foreignExchanges.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
}
