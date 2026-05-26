'use client';

import { useState, useEffect } from 'react';
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
import { useAdminOrgs } from '@/features/admin/organizations/hooks/use-admin-orgs';
import { AdminOrg, CreateAdminOrgRequest, UpdateAdminOrgRequest } from '@/features/admin/organizations/models/admin-org.model';
import { adminOrgsService } from '@/features/admin/organizations/services/admin-orgs.service';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

export default function AdminOrgsPage() {
  const { orgs, loading, loadOrgs } = useAdminOrgs();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<AdminOrg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrg | null>(null);
  const [plans, setPlans] = useState<{ id: number; name: string; label: string }[]>([]);
  const [formData, setFormData] = useState<CreateAdminOrgRequest & { isActive?: boolean }>({
    name: '',
    slug: '',
    planId: undefined,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/plans').then((r) => setPlans(r.data.data || [])).catch(() => {});
  }, []);

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const columns: Column<AdminOrg>[] = [
    { field: 'id', headerName: t('admin.organizations.field.id') },
    { field: 'name', headerName: t('admin.organizations.field.name') },
    { field: 'slug', headerName: t('admin.organizations.field.slug') },
    { field: 'plan', render: (row) => row.plan?.name ?? '—', headerName: t('admin.organizations.field.plan') },
    { field: 'userCount', render: (row) => String(row._count?.userMemberships ?? 0), headerName: t('admin.organizations.field.userCount') },
    {
      field: 'isActive',
      render: (row) => (row.isActive ? t('common.yes') : t('common.no')),
      headerName: t('admin.organizations.field.isActive'),
    },
  ];

  const openCreate = () => {
    setSelectedOrg(null);
    setError('');
    setFormData({ name: '', slug: '', planId: undefined, isActive: true });
    setFormOpen(true);
  };

  const openEdit = (org: AdminOrg) => {
    setSelectedOrg(org);
    setError('');
    setFormData({
      name: org.name,
      slug: org.slug,
      planId: org.plan?.id ?? undefined,
      isActive: org.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        slug: formData.slug || slugify(formData.name),
        planId: formData.planId || undefined,
      };
      if (selectedOrg) {
        await adminOrgsService.update(selectedOrg.id, data as UpdateAdminOrgRequest);
        sileo.success({ description: t('admin.organizations.updated') });
      } else {
        await adminOrgsService.create(data as CreateAdminOrgRequest);
        sileo.success({ description: t('admin.organizations.created') });
      }
      await loadOrgs();
      setFormOpen(false);
    } catch {
      setError(t('admin.organizations.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await adminOrgsService.delete(deleteTarget.id);
      sileo.success({ description: t('admin.organizations.deleted') });
      await loadOrgs();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('admin.organizations.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedOrg ? t('admin.organizations.edit') : t('admin.organizations.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.organizations.field.name')}</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.organizations.field.slug')}</Label>
            <Input value={formData.slug ?? ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={slugify(formData.name)} />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.organizations.field.plan')}</Label>
            <Select
              value={String(formData.planId ?? '')}
              onValueChange={(v) => setFormData({ ...formData, planId: v ? Number(v) : undefined })}
            >
              <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.isActive ?? true} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
            <Label>{t('admin.organizations.field.isActive')}</Label>
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
          {t('admin.organizations.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={orgs}
        loading={loading}
        onEdit={openEdit}
        onDelete={(org) => {
          setDeleteTarget(org);
          setDeleteOpen(true);
        }}
        emptyMessage={t('admin.organizations.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('admin.organizations.delete')}
        message={tp('admin.organizations.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </SlideForm>
  );
}
