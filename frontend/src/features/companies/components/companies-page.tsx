'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCompanies } from '@/features/companies/hooks/use-companies';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '@/features/companies/models/company.model';
import { companyService } from '@/features/companies/services/company.service';
import { useI18n } from '@/i18n';

export default function CompaniesPage() {
  const { companies, loading, loadCompanies } = useCompanies();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    documentNumber: '',
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const columns: Column<Company>[] = [
    { field: 'id', headerName: t('companies.field.id') },
    { field: 'documentNumber', headerName: t('companies.field.documentNumber') },
    { field: 'name', headerName: t('companies.field.name') },
    { field: 'phoneNumber', headerName: t('companies.field.phoneNumber') },
    { field: 'email', headerName: t('companies.field.email') },
  ];

  const openCreate = () => {
    setSelectedCompany(null);
    setError('');
    setFormData({ documentNumber: '', name: '', address: '', phoneNumber: '', email: '' });
    setFormOpen(true);
  };

  const openEdit = (company: Company) => {
    setSelectedCompany(company);
    setError('');
    setFormData({
      documentNumber: company.documentNumber,
      name: company.name,
      address: company.address,
      phoneNumber: company.phoneNumber,
      email: company.email,
      website: company.website ?? '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedCompany) {
        const data: UpdateCompanyRequest = {
          documentNumber: formData.documentNumber,
          name: formData.name,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          website: formData.website || null,
        };
        await companyService.update(selectedCompany.id, data);
      } else {
        await companyService.create(formData);
      }
      await loadCompanies();
      setFormOpen(false);
    } catch {
      setError(t('companies.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await companyService.delete(deleteTarget.id);
      await loadCompanies();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('companies.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedCompany ? t('companies.edit') : t('companies.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('companies.field.documentNumber')}</Label>
            <Input value={formData.documentNumber} onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} required />
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
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('companies.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={companies}
        loading={loading}
        onEdit={openEdit}
        onDelete={(company) => {
          setDeleteTarget(company);
          setDeleteOpen(true);
        }}
        emptyMessage={t('companies.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('companies.delete')}
        message={tp('companies.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
