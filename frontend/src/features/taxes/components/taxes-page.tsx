'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTaxes } from '@/features/taxes/hooks/use-taxes';
import { Tax, CreateTaxRequest, UpdateTaxRequest } from '@/features/taxes/models/tax.model';
import { taxService } from '@/features/taxes/services/tax.service';
import { useI18n } from '@/i18n';

export default function TaxesPage() {
  const { taxes, loading, loadTaxes } = useTaxes();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState<CreateTaxRequest>({
    name: '',
    percentage: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tax | null>(null);

  const columns: Column<Tax>[] = [
    { field: 'id', headerName: t('taxes.field.id') },
    { field: 'name', headerName: t('taxes.field.name') },
    {
      field: 'percentage',
      headerName: t('taxes.field.percentage'),
      render: (row) => `${row.percentage}%`,
    },
    { field: 'formula', headerName: t('taxes.field.formula') },
  ];

  const openCreate = () => {
    setSelectedTax(null);
    setError('');
    setFormData({ name: '', percentage: 0 });
    setFormOpen(true);
  };

  const openEdit = (tax: Tax) => {
    setSelectedTax(tax);
    setError('');
    setFormData({
      name: tax.name,
      percentage: tax.percentage,
      formula: tax.formula ?? '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedTax) {
        const data: UpdateTaxRequest = {
          name: formData.name,
          percentage: formData.percentage,
          formula: formData.formula || null,
        };
        await taxService.update(selectedTax.id, data);
      } else {
        await taxService.create(formData);
      }
      await loadTaxes();
      setFormOpen(false);
    } catch {
      setError(t('taxes.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await taxService.delete(deleteTarget.id);
      await loadTaxes();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('taxes.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('taxes.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('taxes.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={taxes}
        loading={loading}
        onEdit={openEdit}
        onDelete={(tax) => {
          setDeleteTarget(tax);
          setDeleteOpen(true);
        }}
        emptyMessage={t('taxes.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedTax ? t('taxes.edit') : t('taxes.new')}
        onClose={() => setFormOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('taxes.field.name')} value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth required />
          <TextField label={t('taxes.field.percentage')} type="number" value={formData.percentage}
            onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })} fullWidth required />
          <TextField label={t('taxes.field.formula')} value={formData.formula ?? ''}
            onChange={(e) => setFormData({ ...formData, formula: e.target.value })} fullWidth />
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('taxes.delete')}
        message={tp('taxes.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
}
