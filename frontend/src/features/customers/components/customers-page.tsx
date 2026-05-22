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
import { useCustomers } from '@/features/customers/hooks/use-customers';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/features/customers/models/customer.model';
import { customerService } from '@/features/customers/services/customer.service';
import { useI18n } from '@/i18n';

export default function CustomersPage() {
  const { customers, loading, loadCustomers } = useCustomers();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerRequest & { available?: boolean }>({
    idCardNumber: '',
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const columns: Column<Customer>[] = [
    { field: 'id', headerName: t('customers.field.id') },
    { field: 'idCardNumber', headerName: t('customers.field.idCardNumber') },
    { field: 'firstName', headerName: t('customers.field.firstName') },
    { field: 'lastName', headerName: t('customers.field.lastName') },
    { field: 'phoneNumber', headerName: t('customers.field.phoneNumber') },
    { field: 'email', headerName: t('customers.field.email') },
    {
      field: 'available',
      headerName: t('customers.field.available'),
      render: (row) => (row.available ? t('common.yes') : t('common.no')),
    },
  ];

  const openCreate = () => {
    setSelectedCustomer(null);
    setError('');
    setFormData({ idCardNumber: '', firstName: '', lastName: '', address: '', phoneNumber: '', email: '' });
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setError('');
    setFormData({
      idCardNumber: customer.idCardNumber,
      firstName: customer.firstName,
      lastName: customer.lastName,
      address: customer.address || '',
      phoneNumber: customer.phoneNumber || '',
      email: customer.email || '',
      available: customer.available,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedCustomer) {
        const data: UpdateCustomerRequest = {
          idCardNumber: formData.idCardNumber,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          email: formData.email || undefined,
          available: formData.available,
        };
        await customerService.update(selectedCustomer.id, data);
      } else {
        await customerService.create(formData);
      }
      await loadCustomers();
      setFormOpen(false);
    } catch {
      setError(t('customers.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await customerService.delete(deleteTarget.id);
      await loadCustomers();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('customers.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('customers.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('customers.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={customers}
        loading={loading}
        onEdit={openEdit}
        onDelete={(customer) => {
          setDeleteTarget(customer);
          setDeleteOpen(true);
        }}
        emptyMessage={t('customers.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedCustomer ? t('customers.edit') : t('customers.new')}
        onClose={() => setFormOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('customers.field.idCardNumber')} value={formData.idCardNumber}
            onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })} fullWidth required />
          <TextField label={t('customers.field.firstName')} value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} fullWidth required />
          <TextField label={t('customers.field.lastName')} value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} fullWidth required />
          <TextField label={t('customers.field.address')} value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth />
          <TextField label={t('customers.field.phoneNumber')} value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} fullWidth />
          <TextField label={t('customers.field.email')} type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
          {selectedCustomer && (
            <FormControlLabel control={
              <Switch checked={formData.available ?? true}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })} />
            } label={t('customers.field.available')} />
          )}
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('customers.delete')}
        message={tp('customers.deleteConfirm', { name: `${deleteTarget?.firstName} ${deleteTarget?.lastName}` })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
}
