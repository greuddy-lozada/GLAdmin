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
import { useBatches } from '@/features/batches/hooks/use-batches';
import { Batch, CreateBatchRequest } from '@/features/batches/models/batch.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';

export default function BatchesPage() {
  const { items: batchesData, isLoading: loading, create, update, remove } = useBatches();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState<CreateBatchRequest>({
    code: '',
  });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const columns: Column<Batch>[] = [
    { field: 'code', headerName: t('batches.field.code') },
    { field: 'description', headerName: t('batches.field.description') },
  ];

  const openCreate = () => {
    setSelectedBatch(null);
    setError('');
    setFormData({ code: '' });
    setFormOpen(true);
  };

  const openEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setError('');
    setFormData({
      code: batch.code,
      description: batch.description ?? '',
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedBatch;
    if (isEdit) {
      update.mutate(
        { id: selectedBatch!.id, data: { code: formData.code, description: formData.description || null } },
        {
          onSuccess: () => sileo.success({ description: t('batches.updated') }),
          onError: () => { setError(t('batches.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('batches.created') }),
        onError: () => { setError(t('batches.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('batches.deleted') }),
      onError: () => { setError(t('batches.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedBatch ? t('batches.edit') : t('batches.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('batches.field.code')}</Label>
            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('batches.field.description')}</Label>
            <Input value={formData.description ?? ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
            {t('batches.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={batchesData}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (batch) => {
          setDeleteTarget(batch);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('batches.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('batches.delete')}
        message={tp('batches.deleteConfirm', { name: deleteTarget?.code ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
    </SlideForm>
  );
}
