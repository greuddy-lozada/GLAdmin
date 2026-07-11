'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { Category, CreateCategoryRequest } from '@/features/categories/models/category.model';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

export default function CategoriesPage() {
  const { items: categories, isLoading: loading, create, update, remove } = useCategories();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({ name: '', description: '' });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [allCategories, setAllCategories] = useState<{ id: number; name: string }[]>([]);

  const columns: Column<Category>[] = [
    { field: 'name', headerName: t('categories.field.name') },
    { field: 'description', headerName: t('categories.field.description') },
    {
      field: 'idParent',
      headerName: t('categories.field.parent'),
      render: (row) => row.parent?.name ?? '',
    },
  ];

  const openCreate = () => {
    setSelectedCategory(null);
    setError('');
    setFormData({ name: '', description: '' });
    apiClient.get('/categories').then((r: { data: { data: { id: number; name: string }[] } }) => setAllCategories(r.data.data || [])).catch(() => {});
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setSelectedCategory(category);
    setError('');
    setFormData({ name: category.name, description: category.description ?? '', idParent: category.idParent });
    apiClient.get('/categories').then((r: { data: { data: { id: number; name: string }[] } }) => setAllCategories(r.data.data || [])).catch(() => {});
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedCategory;
    if (isEdit) {
      update.mutate(
        { id: selectedCategory!.id, data: formData },
        {
          onSuccess: () => sileo.success({ description: t('categories.updated') }),
          onError: () => { setError(t('categories.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('categories.created') }),
        onError: () => { setError(t('categories.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('categories.deleted') }),
      onError: () => { setError(t('categories.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedCategory ? t('categories.edit') : t('categories.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('categories.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('categories.field.description')}</Label>
            <Input value={formData.description ?? ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('categories.field.parent')}</Label>
            <Select value={formData.idParent ? String(formData.idParent) : ''}
              onValueChange={(v) => setFormData({ ...formData, idParent: v ? Number(v) : undefined })}>
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {allCategories.filter((c) => c.id !== selectedCategory?.id).map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={60}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={categories}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (cat) => {
          setDeleteTarget(cat);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('categories.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('categories.delete')}
        message={tp('categories.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
      </div>
    </SlideForm>
  );
}
