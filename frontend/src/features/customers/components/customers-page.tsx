'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <SlideForm
      open={formOpen}
      title={selectedCustomer ? t('customers.edit') : t('customers.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('customers.field.idCardNumber')}</Label>
            <Input value={formData.idCardNumber} onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('customers.field.firstName')}</Label>
            <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('customers.field.lastName')}</Label>
            <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('customers.field.address')}</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('customers.field.phoneNumber')}</Label>
            <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('customers.field.email')}</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          {selectedCustomer && (
            <div className="flex items-center gap-2">
              <Switch checked={formData.available ?? true} onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
              <Label>{t('customers.field.available')}</Label>
            </div>
          )}
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('customers.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

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

      <ConfirmDialog
        open={deleteOpen}
        title={t('customers.delete')}
        message={tp('customers.deleteConfirm', { name: `${deleteTarget?.firstName} ${deleteTarget?.lastName}` })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
