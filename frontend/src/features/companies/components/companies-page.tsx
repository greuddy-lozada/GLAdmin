'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCompanies } from '@/features/companies/hooks/use-companies';
import { Company, CreateCompanyRequest } from '@/features/companies/models/company.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';

export default function CompaniesPage() {
  const { items: companiesData, isLoading: loading, create, update, remove } = useCompanies();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 80);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    taxId: '',
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    isWithholdingAgent: false,
    withholdingPercentage: 75,
  });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const columns: Column<Company>[] = [
    { field: 'name', headerName: t('companies.field.name') },
    { field: 'phoneNumber', headerName: t('companies.field.phoneNumber') },
    { field: 'email', headerName: t('companies.field.email') },
  ];

  const openCreate = () => {
    setSelectedCompany(null);
    setError('');
    setFormData({ taxId: '', name: '', address: '', phoneNumber: '', email: '', isWithholdingAgent: false, withholdingPercentage: 75 });
    setFormOpen(true);
  };

  const openEdit = (company: Company) => {
    setSelectedCompany(company);
    setError('');
    setFormData({
      taxId: company.taxId,
      name: company.name,
      address: company.address,
      phoneNumber: company.phoneNumber,
      email: company.email,
      website: company.website ?? '',
      isWithholdingAgent: company.isWithholdingAgent ?? false,
      withholdingPercentage: company.withholdingPercentage ?? 75,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedCompany;
    if (isEdit) {
      update.mutate(
        {
          id: selectedCompany!.id,
          data: {
            taxId: formData.taxId,
            name: formData.name,
            address: formData.address,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            website: formData.website || null,
            isWithholdingAgent: formData.isWithholdingAgent,
            withholdingPercentage: formData.isWithholdingAgent ? formData.withholdingPercentage : undefined,
          },
        },
        {
          onSuccess: () => sileo.success({ description: t('companies.updated') }),
          onError: () => { setError(t('companies.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('companies.created') }),
        onError: () => { setError(t('companies.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('companies.deleted') }),
      onError: () => { setError(t('companies.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedCompany ? t('companies.edit') : t('companies.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('companies.field.taxId')}</Label>
            <Input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('companies.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('companies.field.address')}</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('companies.field.phoneNumber')}</Label>
            <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('companies.field.email')}</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('companies.field.website')}</Label>
            <Input value={formData.website ?? ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="co-is-withholding-agent" checked={formData.isWithholdingAgent ?? false} onCheckedChange={(c) => setFormData({ ...formData, isWithholdingAgent: c })} />
            <Label htmlFor="co-is-withholding-agent">{t('companies.field.isWithholdingAgent')}</Label>
          </div>
          {formData.isWithholdingAgent && (
            <div className="space-y-2">
              <Label>{t('companies.field.withholdingPercentage')}</Label>
              <Select value={String(formData.withholdingPercentage ?? 75)} onValueChange={(v) => setFormData({ ...formData, withholdingPercentage: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={80}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('companies.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={companiesData}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (company) => {
          setDeleteTarget(company);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('companies.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('companies.delete')}
        message={tp('companies.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
    </SlideForm>
  );
}
