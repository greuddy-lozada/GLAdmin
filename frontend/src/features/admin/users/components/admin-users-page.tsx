'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { useAdminUsers } from '@/features/admin/users/hooks/use-admin-users';
import { AdminUser, UpdateAdminUserRequest } from '@/features/admin/users/models/admin-user.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { Role } from '@/features/roles/models/role.model';
import apiClient from '@/lib/api/api-client';

export default function AdminUsersPage() {
  const { items: usersData, isLoading: loading, update } = useAdminUsers();
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<UpdateAdminUserRequest>({
    isActive: true,
    roleId: undefined,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/roles').then((r) => setRoles(r.data.data || [])).catch(() => console.warn('Failed to load roles'));
  }, []);

  const columns: Column<AdminUser>[] = [
    { field: 'id', headerName: t('admin.users.field.id') },
    { field: 'name', render: (row) => `${row.firstName} ${row.lastName}`.trim(), headerName: t('admin.users.field.name') },
    { field: 'email', headerName: t('admin.users.field.email') },
    { field: 'role', render: (row) => row.role?.slug ?? '—', headerName: t('admin.users.field.role') },
    {
      field: 'isActive',
      render: (row) => (row.isActive ? t('common.yes') : t('common.no')),
      headerName: t('admin.users.field.isActive'),
    },
    { field: 'orgCount', render: (row) => String(row.organizations?.length ?? 0), headerName: t('admin.users.field.orgCount') },
  ];

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setError('');
    setFormData({
      isActive: user.isActive,
      roleId: user.idRole,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    if (selectedUser) {
      update.mutate(
        { id: selectedUser.id, data: formData },
        {
          onSuccess: () => sileo.success({ description: t('admin.users.updated') }),
          onError: () => { setError(t('admin.users.error.save')); setFormOpen(true); },
        },
      );
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={t('admin.users.edit')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.users.field.role')}</Label>
            <Select
              value={String(formData.roleId ?? '')}
              onValueChange={(v) => setFormData({ ...formData, roleId: v ? Number(v) : undefined })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.isActive ?? true} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
            <Label>{t('admin.users.field.isActive')}</Label>
          </div>
          <Button onClick={handleSave} disabled={update.isPending} className="w-full">
            {update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      }
    >
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={usersData}
        loading={loading}
        onEdit={openEdit}
        emptyMessage={t('admin.users.empty')}
      />
    </SlideForm>
  );
}
