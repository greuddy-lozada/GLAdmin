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
import { taxService } from '@/features/taxes/services/tax.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';

export default function TaxesPage() {
  const { taxes, loading, loadTaxes } = useTaxes();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
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
            <Input type="number" value={formData.percentage}
              onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('taxes.field.formula')}</Label>
            <Input value={formData.formula ?? ''} onChange={(e) => setFormData({ ...formData, formula: e.target.value })} />
          </div>
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
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
        onDelete={canDelete ? (tax) => {
          setDeleteTarget(tax);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('taxes.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('taxes.delete')}
        message={tp('taxes.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
