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
import { useBrands } from '@/features/brands/hooks/use-brands';
import { Brand, CreateBrandRequest } from '@/features/brands/models/brand.model';
import { brandService } from '@/features/brands/services/brand.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';

export default function BrandsPage() {
  const { brands, loading, loadBrands } = useBrands();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<CreateBrandRequest>({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const columns: Column<Brand>[] = [
    { field: 'id', headerName: t('brands.field.id') },
    { field: 'name', headerName: t('brands.field.name') },
    { field: 'description', headerName: t('brands.field.description') },
  ];

  const openCreate = () => {
    setSelectedBrand(null);
    setError('');
    setFormData({ name: '', description: '' });
    setFormOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setSelectedBrand(brand);
    setError('');
    setFormData({ name: brand.name, description: brand.description ?? '' });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedBrand) {
        await brandService.update(selectedBrand.id, formData);
        sileo.success({ description: t('brands.updated') });
      } else {
        await brandService.create(formData);
        sileo.success({ description: t('brands.created') });
      }
      await loadBrands();
      setFormOpen(false);
    } catch {
      setError(t('brands.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await brandService.delete(deleteTarget.id);
      sileo.success({ description: t('brands.deleted') });
      await loadBrands();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('brands.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedBrand ? t('brands.edit') : t('brands.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('brands.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('brands.field.description')}</Label>
            <Input value={formData.description ?? ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
            {t('brands.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={brands}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (brand) => {
          setDeleteTarget(brand);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('brands.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('brands.delete')}
        message={tp('brands.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
