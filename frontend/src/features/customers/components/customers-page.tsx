'use client';

import { useState } from 'react';
import { Plus, BadgeCheck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCustomers } from '@/features/customers/hooks/use-customers';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/features/customers/models/customer.model';
import { customerService } from '@/features/customers/services/customer.service';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import apiClient from '@/lib/api/api-client';

export default function CustomersPage() {
  const { customers, loading, loadCustomers } = useCustomers();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 40);
  const canDelete = hasMinLevel(role, 100);
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
    isWithholdingAgent: false,
    withholdingPercentage: 75,
    withholdingProof: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    {
      field: 'isWithholdingAgent',
      headerName: t('customers.field.isWithholdingAgent'),
      render: (row) => row.isWithholdingAgent
        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><BadgeCheck className="h-3.5 w-3.5" />{t('common.yes')}</span>
        : t('common.no'),
    },
  ];

  const openCreate = () => {
    setSelectedCustomer(null);
    setError('');
    setFormData({ idCardNumber: '', firstName: '', lastName: '', address: '', phoneNumber: '', email: '', isWithholdingAgent: false, withholdingPercentage: 75, withholdingProof: '' });
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
      isWithholdingAgent: customer.isWithholdingAgent,
      withholdingPercentage: customer.withholdingPercentage ?? 75,
      withholdingProof: customer.withholdingProof ?? '',
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
          isWithholdingAgent: formData.isWithholdingAgent,
          withholdingPercentage: formData.isWithholdingAgent ? formData.withholdingPercentage : undefined,
          withholdingProof: formData.withholdingProof || undefined,
        };
        await customerService.update(selectedCustomer.id, data);
        sileo.success({ description: t('customers.updated') });
      } else {
        await customerService.create({
          ...formData,
          withholdingProof: formData.withholdingProof || undefined,
        });
        sileo.success({ description: t('customers.created') });
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
      sileo.success({ description: t('customers.deleted') });
      await loadCustomers();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('customers.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/uploads/proof', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData({ ...formData, withholdingProof: res.data.data.filename });
    } catch {
      setError('Error al subir el comprobante');
    } finally {
      setUploading(false);
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
          <div className="flex items-center gap-2">
            <Switch id="is-withholding-agent" checked={formData.isWithholdingAgent ?? false} onCheckedChange={(c) => setFormData({ ...formData, isWithholdingAgent: c })} />
            <Label htmlFor="is-withholding-agent">{t('customers.field.isWithholdingAgent')}</Label>
          </div>
          {formData.isWithholdingAgent && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{t('customers.field.withholdingPercentage')}</Label>
                <Select value={String(formData.withholdingPercentage ?? 75)} onValueChange={(v) => setFormData({ ...formData, withholdingPercentage: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('customers.field.withholdingProof')}</Label>
                {formData.withholdingProof ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground truncate flex-1">{formData.withholdingProof}</span>
                    <Button variant="ghost" size="icon" onClick={() => setFormData({ ...formData, withholdingProof: '' })}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={uploading} className="relative">
                      {uploading ? t('common.saving') : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {t('customers.field.withholdingProof')}
                        </>
                      )}
                      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={40}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('customers.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={customers}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (customer) => {
          setDeleteTarget(customer);
          setDeleteOpen(true);
        } : undefined}
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
