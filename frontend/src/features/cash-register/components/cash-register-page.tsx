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
import { useCashRegisters } from '@/features/cash-register/hooks/use-cash-register';
import { CashRegister, CreateCashRegisterRequest } from '@/features/cash-register/models/cash-register.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { RoleGuard } from '@/components/ui/role-guard';

export default function CashRegisterPage() {
  const { items: cashRegisters, isLoading, create, update, remove } = useCashRegisters();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CashRegister | null>(null);
  const [formData, setFormData] = useState<CreateCashRegisterRequest>({ name: '', code: '' });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CashRegister | null>(null);

  const columns: Column<CashRegister>[] = [
    { field: 'name', headerName: t('cashRegisters.field.name') },
    { field: 'code', headerName: t('cashRegisters.field.code') },
    {
      field: 'isActive',
      headerName: t('cashRegisters.field.isActive'),
      render: (row) => (row.isActive ? '✓' : '—'),
    },
  ];

  const openCreate = () => {
    setSelected(null);
    setError('');
    setFormData({ name: '', code: '' });
    setFormOpen(true);
  };

  const openEdit = (cr: CashRegister) => {
    setSelected(cr);
    setError('');
    setFormData({ name: cr.name, code: cr.code });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    if (selected) {
      update.mutate(
        { id: selected.id, data: formData },
        {
          onSuccess: () => sileo.success({ description: t('cashRegisters.updated') }),
          onError: () => { setError(t('cashRegisters.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('cashRegisters.created') }),
        onError: () => { setError(t('cashRegisters.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('cashRegisters.deleted') }),
      onError: () => { setError(t('cashRegisters.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selected ? t('cashRegisters.edit') : t('cashRegisters.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('cashRegisters.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('cashRegisters.field.code')}</Label>
            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
          </div>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <RoleGuard minLevel={80}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('cashRegisters.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={cashRegisters}
        loading={isLoading}
        onEdit={openEdit}
        onDelete={(cr) => { setDeleteTarget(cr); setDeleteOpen(true); }}
        emptyMessage={t('cashRegisters.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('cashRegisters.delete')}
        message={tp('cashRegisters.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
      </div>
    </SlideForm>
  );
}
