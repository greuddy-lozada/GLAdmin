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
import { useTaxes } from '@/features/taxes/hooks/use-taxes';
import { Tax, CreateTaxRequest, UpdateTaxRequest } from '@/features/taxes/models/tax.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';

export default function TaxesPage() {
  const { items: taxes, isLoading: loading, create, update, remove } = useTaxes();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState<CreateTaxRequest>({ name: '', percentage: 0 });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tax | null>(null);

  const columns: Column<Tax>[] = [
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
    setFormData({ name: tax.name, percentage: tax.percentage, formula: tax.formula ?? '' });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedTax;
    if (isEdit) {
      const data: UpdateTaxRequest = { name: formData.name, percentage: formData.percentage, formula: formData.formula || null };
      update.mutate(
        { id: selectedTax!.id, data },
        {
          onSuccess: () => sileo.success({ description: t('taxes.updated') }),
          onError: () => { setError(t('taxes.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('taxes.created') }),
        onError: () => { setError(t('taxes.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('taxes.deleted') }),
      onError: () => { setError(t('taxes.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedTax ? t('taxes.edit') : t('taxes.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('taxes.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('taxes.field.percentage')}</Label>
            <Input type="number" value={String(formData.percentage)} onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>{t('taxes.field.formula')}</Label>
            <Input value={formData.formula ?? ''} onChange={(e) => setFormData({ ...formData, formula: e.target.value || null })} />
          </div>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={60}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('taxes.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={taxes}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (tax) => { setDeleteTarget(tax); setDeleteOpen(true); } : undefined}
        emptyMessage={t('taxes.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('taxes.delete')}
        message={tp('taxes.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
    </SlideForm>
  );
}
