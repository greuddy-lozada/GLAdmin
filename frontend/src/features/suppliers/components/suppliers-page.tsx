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
import { useSuppliers } from '@/features/suppliers/hooks/use-suppliers';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@/features/suppliers/models/supplier.model';
import { supplierService } from '@/features/suppliers/services/supplier.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';

export default function SuppliersPage() {
  const { suppliers, loading, loadSuppliers } = useSuppliers();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 40);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<CreateSupplierRequest & { available?: boolean }>({
    documentNumber: '',
    companyName: '',
    businessName: '',
    fiscalAddress: '',
    taxId: '',
    taxWithholdingAgent: false,
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
    { field: 'businessName', headerName: t('suppliers.field.businessName'), render: (row) => row.businessName ?? '—' },
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
    setFormData({ documentNumber: '', companyName: '', businessName: '', fiscalAddress: '', taxId: '', taxWithholdingAgent: false, firstName: '', lastName: '', address: '', phoneNumber: '', email: '' });
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setError('');
    setFormData({
      documentNumber: supplier.documentNumber,
      companyName: supplier.companyName,
      businessName: supplier.businessName || '',
      fiscalAddress: supplier.fiscalAddress || '',
      taxId: supplier.taxId || '',
      taxWithholdingAgent: supplier.taxWithholdingAgent,
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
          businessName: formData.businessName || undefined,
          fiscalAddress: formData.fiscalAddress || undefined,
          taxId: formData.taxId || undefined,
          taxWithholdingAgent: formData.taxWithholdingAgent,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          address: formData.address || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          email: formData.email || undefined,
          available: formData.available,
        };
        await supplierService.update(selectedSupplier.id, data);
      } else {
        await supplierService.create({
          ...formData,
          businessName: formData.businessName || undefined,
          fiscalAddress: formData.fiscalAddress || undefined,
          taxId: formData.taxId || undefined,
        });
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
    <SlideForm
      open={formOpen}
      title={selectedSupplier ? t('suppliers.edit') : t('suppliers.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('suppliers.field.documentNumber')}</Label>
            <Input value={formData.documentNumber} onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.companyName')}</Label>
            <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.businessName')}</Label>
            <Input value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.fiscalAddress')}</Label>
            <Input value={formData.fiscalAddress} onChange={(e) => setFormData({ ...formData, fiscalAddress: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.taxId')}</Label>
            <Input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.taxWithholdingAgent ?? false} onCheckedChange={(c) => setFormData({ ...formData, taxWithholdingAgent: c })} />
            <Label>{t('suppliers.field.taxWithholdingAgent')}</Label>
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.firstName')}</Label>
            <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.lastName')}</Label>
            <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.address')}</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.phoneNumber')}</Label>
            <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('suppliers.field.email')}</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          {selectedSupplier && (
            <div className="flex items-center gap-2">
              <Switch checked={formData.available ?? true} onCheckedChange={(c) => setFormData({ ...formData, available: c })} />
              <Label>{t('suppliers.field.available')}</Label>
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
            {t('suppliers.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={suppliers}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (supplier) => {
          setDeleteTarget(supplier);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('suppliers.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('suppliers.delete')}
        message={tp('suppliers.deleteConfirm', { name: `${deleteTarget?.companyName}` })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
