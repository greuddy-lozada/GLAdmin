'use client';

import { useState, useEffect } from 'react';
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
import { useWithholdings } from '@/features/withholdings/hooks/use-withholdings';
import { Withholding, CreateWithholdingRequest } from '@/features/withholdings/models/withholding.model';
import { withholdingService } from '@/features/withholdings/services/withholding.service';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';
import apiClient from '@/lib/api/api-client';
import { sileo } from 'sileo';

export default function WithholdingsPage() {
  const { items, loading, loadItems } = useWithholdings();
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Withholding | null>(null);
  const [formData, setFormData] = useState<CreateWithholdingRequest>({
    idSupplier: 0,
    type: 'IVA',
    percentage: 75,
    baseAmount: 0,
  });
  const [suppliers, setSuppliers] = useState<{ id: number; companyName: string }[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: number; code: string | null; amount: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const columns: Column<Withholding>[] = [
    { field: 'id', headerName: t('withholdings.field.id') },
    {
      field: 'idSupplier',
      headerName: t('withholdings.field.supplier'),
      render: (row) => row.supplier?.companyName ?? '',
    },
    { field: 'type', headerName: t('withholdings.field.type') },
    { field: 'percentage', headerName: t('withholdings.field.percentage'), render: (row) => `${row.percentage}%` },
    { field: 'baseAmount', headerName: t('withholdings.field.baseAmount') },
    { field: 'withheldAmount', headerName: t('withholdings.field.withheldAmount') },
    { field: 'period', headerName: t('withholdings.field.period'), render: (row) => row.period ?? '—' },
  ];

  useEffect(() => {
    apiClient.get('/suppliers').then((r) => setSuppliers(r.data.data || [])).catch(() => console.warn('Failed to load suppliers'));
    apiClient.get('/purchase-orders').then((r) => setPurchaseOrders(r.data.data || [])).catch(() => console.warn('Failed to load purchase orders'));
  }, []);

  const openCreate = () => {
    setError('');
    setFormData({ idSupplier: 0, idPurchaseOrder: undefined, type: 'IVA', percentage: 75, baseAmount: 0 });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        withheldAmount: formData.withheldAmount ?? (formData.type === 'IVA'
          ? formData.baseAmount * (formData.percentage / 100) * 0.16
          : formData.baseAmount * (formData.percentage / 100)),
      };
      await withholdingService.create(payload);
      sileo.success({ description: t('withholdings.created') });
      await loadItems();
      setFormOpen(false);
    } catch {
      setError(t('withholdings.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await withholdingService.delete(deleteTarget.id);
      sileo.success({ description: t('withholdings.deleted') });
      await loadItems();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('withholdings.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={t('withholdings.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('withholdings.field.supplier')}</Label>
            <Select value={String(formData.idSupplier)}
              onValueChange={(v) => setFormData({ ...formData, idSupplier: Number(v) })}>
              <SelectTrigger><SelectValue placeholder={t('common.selectSupplier')} /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('withholdings.field.purchaseOrder')}</Label>
            <Select value={String(formData.idPurchaseOrder ?? '')}
              onValueChange={(v) => {
                const po = purchaseOrders.find((p) => p.id === Number(v));
                setFormData({
                  ...formData,
                  idPurchaseOrder: Number(v),
                  baseAmount: po?.amount ?? formData.baseAmount,
                });
              }}>
              <SelectTrigger><SelectValue placeholder={t('withholdings.field.purchaseOrder') + ' (opcional)'} /></SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={String(po.id)}>
                    {po.code ?? `#${po.id}`} — Bs. {Number(po.amount).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('withholdings.field.type')}</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IVA">IVA</SelectItem>
                <SelectItem value="ISLR">ISLR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('withholdings.field.percentage')}</Label>
            <Select value={String(formData.percentage)} onValueChange={(v) => setFormData({ ...formData, percentage: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('withholdings.field.baseAmount')}</Label>
            <Input type="number" step="0.01" value={formData.baseAmount}
              onChange={(e) => setFormData({ ...formData, baseAmount: Number(e.target.value) })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('withholdings.field.baseAmountUsd')}</Label>
            <Input type="number" step="0.01" value={formData.baseAmountUsd ?? ''}
              onChange={(e) => setFormData({ ...formData, baseAmountUsd: Number(e.target.value) })} />
          </div>
          <div className="space-y-2">
            <Label>{t('withholdings.field.period')}</Label>
            <Input type="month" value={formData.period ?? ''}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })} />
          </div>
          <div className="rounded border bg-muted/30 p-3 text-sm">
            <span className="font-medium">{t('withholdings.field.withheldAmountLabel')}:</span>{' '}
            Bs. {(formData.type === 'IVA'
              ? formData.baseAmount * (formData.percentage / 100) * 0.16
              : formData.baseAmount * (formData.percentage / 100)
            ).toFixed(2)}
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
            {t('withholdings.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        onDelete={canDelete ? (row) => { setDeleteTarget(row); setDeleteOpen(true); } : undefined}
        emptyMessage={t('withholdings.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('withholdings.delete')}
        message={tp('withholdings.deleteConfirm', { id: String(deleteTarget?.id ?? '') })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
