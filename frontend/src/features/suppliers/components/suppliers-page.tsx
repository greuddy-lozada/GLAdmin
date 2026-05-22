'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useSuppliers } from '@/features/suppliers/hooks/use-suppliers';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@/features/suppliers/models/supplier.model';
import { supplierService } from '@/features/suppliers/services/supplier.service';
import { useI18n } from '@/i18n';

export default function SuppliersPage() {
  const { suppliers, loading, loadSuppliers } = useSuppliers();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<CreateSupplierRequest & { available?: boolean }>({
    documentNumber: '',
    companyName: '',
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  const columns: Column<Supplier>[] = [
    { field: 'id', headerName: t('suppliers.field.id') },
    { field: 'documentNumber', headerName: t('suppliers.field.documentNumber') },
    { field: 'companyName', headerName: t('suppliers.field.companyName') },
    { field: 'phoneNumber', headerName: t('suppliers.field.phoneNumber') },
    { field: 'email', headerName: t('suppliers.field.email') },
    {
      field: 'available',
      headerName: t('suppliers.field.available'),
      render: (row) => (row.available ? t('common.yes') : t('common.no')),
    },
  ];

  const openCreate = () => {
    setSelectedSupplier(null);
    setError('');
    setFormData({ documentNumber: '', companyName: '', firstName: '', lastName: '', address: '', phoneNumber: '', email: '' });
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setError('');
    setFormData({
      documentNumber: supplier.documentNumber,
      companyName: supplier.companyName,
      firstName: supplier.firstName || '',
      lastName: supplier.lastName || '',
      address: supplier.address || '',
      phoneNumber: supplier.phoneNumber || '',
      email: supplier.email || '',
      available: supplier.available,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedSupplier) {
        const data: UpdateSupplierRequest = {
          documentNumber: formData.documentNumber,
          companyName: formData.companyName,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          address: formData.address || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          email: formData.email || undefined,
          available: formData.available,
        };
        await supplierService.update(selectedSupplier.id, data);
      } else {
        await supplierService.create(formData);
      }
      await loadSuppliers();
      setFormOpen(false);
    } catch {
      setError(t('suppliers.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await supplierService.delete(deleteTarget.id);
      await loadSuppliers();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('suppliers.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('suppliers.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('suppliers.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={suppliers}
        loading={loading}
        onEdit={openEdit}
        onDelete={(supplier) => {
          setDeleteTarget(supplier);
          setDeleteOpen(true);
        }}
        emptyMessage={t('suppliers.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedSupplier ? t('suppliers.edit') : t('suppliers.new')}
        onClose={() => setFormOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('suppliers.field.documentNumber')} value={formData.documentNumber}
            onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} fullWidth required />
          <TextField label={t('suppliers.field.companyName')} value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} fullWidth required />
          <TextField label={t('suppliers.field.firstName')} value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} fullWidth />
          <TextField label={t('suppliers.field.lastName')} value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} fullWidth />
          <TextField label={t('suppliers.field.address')} value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth />
          <TextField label={t('suppliers.field.phoneNumber')} value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} fullWidth />
          <TextField label={t('suppliers.field.email')} type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
          {selectedSupplier && (
            <FormControlLabel control={
              <Switch checked={formData.available ?? true}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })} />
            } label={t('suppliers.field.available')} />
          )}
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('suppliers.delete')}
        message={tp('suppliers.deleteConfirm', { name: `${deleteTarget?.companyName}` })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
}
