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
import { Batch, CreateBatchRequest, UpdateBatchRequest } from '@/features/batches/models/batch.model';
import { batchService } from '@/features/batches/services/batch.service';
import { useI18n } from '@/i18n';

export default function BatchesPage() {
  const { batches, loading, loadBatches } = useBatches();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState<CreateBatchRequest>({
    code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const columns: Column<Batch>[] = [
    { field: 'id', headerName: t('batches.field.id') },
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

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedBatch) {
        const data: UpdateBatchRequest = {
          code: formData.code,
          description: formData.description || null,
        };
        await batchService.update(selectedBatch.id, data);
      } else {
        await batchService.create(formData);
      }
      await loadBatches();
      setFormOpen(false);
    } catch {
      setError(t('batches.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await batchService.delete(deleteTarget.id);
      await loadBatches();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('batches.error.delete'));
    } finally {
      setSubmitting(false);
    }
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
          <Button onClick={handleSave} disabled={submitting} className="w-full">
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('batches.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={batches}
        loading={loading}
        onEdit={openEdit}
        onDelete={(batch) => {
          setDeleteTarget(batch);
          setDeleteOpen(true);
        }}
        emptyMessage={t('batches.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('batches.delete')}
        message={tp('batches.deleteConfirm', { name: deleteTarget?.code ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
