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
import { useAdminInvites } from '@/features/admin/invites/hooks/use-admin-invites';
import { AdminInvite, CreateAdminInviteRequest } from '@/features/admin/invites/models/admin-invite.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

export default function AdminInvitesPage() {
  const { items: invitesData, isLoading: loading, create, remove } = useAdminInvites();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminInvite | null>(null);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState<CreateAdminInviteRequest>({
    email: '',
    organizationId: '',
    roleId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/orgs').then((r) => setOrganizations(r.data.data || [])).catch(() => console.warn('Failed to load organizations'));
    apiClient.get('/roles').then((r) => setRoles(r.data.data || [])).catch(() => console.warn('Failed to load roles'));
  }, []);

  const columns: Column<AdminInvite>[] = [
    { field: 'email', headerName: t('admin.invites.field.email') },
    { field: 'organization', render: (row) => row.organization?.name ?? '—', headerName: t('admin.invites.field.organization') },
    { field: 'role', render: (row) => row.role?.slug ?? '—', headerName: t('admin.invites.field.role') },
    {
      field: 'expiresAt',
      render: (row) => formatDate(row.expiresAt),
      headerName: t('admin.invites.field.expiresAt'),
    },
    {
      field: 'used',
      render: (row) => (row.used ? t('common.yes') : t('common.no')),
      headerName: t('admin.invites.field.used'),
    },
  ];

  const openCreate = () => {
    setError('');
    setFormData({ email: '', organizationId: '', roleId: '' });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    create.mutate(formData, {
      onSuccess: () => sileo.success({ description: t('admin.invites.created') }),
      onError: () => { setError(t('admin.invites.error.save')); setFormOpen(true); },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('admin.invites.deleted') }),
      onError: () => { setError(t('admin.invites.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={t('admin.invites.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.invites.field.email')}</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.invites.field.organization')}</Label>
            <Select
              value={formData.organizationId}
              onValueChange={(v) => setFormData({ ...formData, organizationId: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('admin.invites.field.role')}</Label>
            <Select
              value={formData.roleId}
              onValueChange={(v) => setFormData({ ...formData, roleId: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={create.isPending} className="w-full">
            {create.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between mb-6">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.invites.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={invitesData}
        loading={loading}
        onDelete={(invite) => {
          setDeleteTarget(invite);
          setDeleteOpen(true);
        }}
        emptyMessage={t('admin.invites.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('admin.invites.delete')}
        message={tp('admin.invites.deleteConfirm', { email: deleteTarget?.email ?? '' })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
    </SlideForm>
  );
}
