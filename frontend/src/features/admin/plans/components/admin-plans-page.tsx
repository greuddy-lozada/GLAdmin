'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
import { useAdminPlans } from '@/features/admin/plans/hooks/use-admin-plans';
import { AdminPlan, CreateAdminPlanRequest } from '@/features/admin/plans/models/admin-plan.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { extractApiError } from '@/lib/api/extract-api-error';

export default function AdminPlansPage() {
  const { items: plansData, isLoading: loading, create, update, remove } = useAdminPlans();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPlan | null>(null);
  const [formData, setFormData] = useState<CreateAdminPlanRequest & { isActive?: boolean }>({
    name: '',
    label: '',
    amount: 0,
    currency: 'usd',
    interval: 'month',
    features: '',
    maxUsers: 5,
    isActive: true,
  });
  const [error, setError] = useState('');

  const columns: Column<AdminPlan>[] = [
    { field: 'name', headerName: t('admin.plans.field.name') },
    { field: 'label', headerName: t('admin.plans.field.label') },
    { field: 'amount', headerName: t('admin.plans.field.amount') },
    { field: 'currency', headerName: t('admin.plans.field.currency') },
    { field: 'interval', headerName: t('admin.plans.field.interval') },
    { field: 'maxUsers', headerName: t('admin.plans.field.maxUsers') },
    {
      field: 'isActive',
      render: (row) => (row.isActive ? t('common.yes') : t('common.no')),
      headerName: t('admin.plans.field.isActive'),
    },
  ];

  const openCreate = () => {
    setSelectedPlan(null);
    setError('');
    setFormData({ name: '', label: '', amount: 0, currency: 'usd', interval: 'month', features: '', maxUsers: 5, isActive: true });
    setFormOpen(true);
  };

  const openEdit = (plan: AdminPlan) => {
    setSelectedPlan(plan);
    setError('');
    setFormData({
      name: plan.name,
      label: plan.label,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      maxUsers: plan.maxUsers,
      isActive: plan.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    if (selectedPlan) {
      update.mutate(
        { id: selectedPlan.id, data: formData },
        {
          onSuccess: () => sileo.success({ description: t('admin.plans.updated') }),
          onError: (err) => { setError(extractApiError(err) ?? t('admin.plans.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData as CreateAdminPlanRequest, {
        onSuccess: () => sileo.success({ description: t('admin.plans.created') }),
        onError: (err) => { setError(extractApiError(err) ?? t('admin.plans.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('admin.plans.deleted') }),
      onError: (err) => { setError(extractApiError(err) ?? t('admin.plans.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedPlan ? t('admin.plans.edit') : t('admin.plans.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.plans.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.plans.field.label')}</Label>
            <Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.plans.field.amount')}</Label>
            <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.plans.field.currency')}</Label>
            <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">{t('admin.plans.currency.usd')}</SelectItem>
                <SelectItem value="ves">{t('admin.plans.currency.ves')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('admin.plans.field.interval')}</Label>
            <Select value={formData.interval} onValueChange={(v) => setFormData({ ...formData, interval: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t('admin.plans.interval.month')}</SelectItem>
                <SelectItem value="year">{t('admin.plans.interval.year')}</SelectItem>
                <SelectItem value="lifetime">{t('admin.plans.interval.lifetime')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('admin.plans.field.features')}</Label>
            <textarea className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50" value={formData.features ?? ''} onChange={(e) => setFormData({ ...formData, features: e.target.value })} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.plans.field.maxUsers')}</Label>
            <Input type="number" value={formData.maxUsers} onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.isActive ?? true} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
            <Label>{t('admin.plans.field.isActive')}</Label>
          </div>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.plans.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={plansData}
        loading={loading}
        onEdit={openEdit}
        onDelete={(plan) => {
          setDeleteTarget(plan);
          setDeleteOpen(true);
        }}
        emptyMessage={t('admin.plans.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('admin.plans.delete')}
        message={tp('admin.plans.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
    </SlideForm>
  );
}
