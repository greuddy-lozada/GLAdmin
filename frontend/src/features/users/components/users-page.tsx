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
import { useUsers } from '@/features/users/hooks/use-users';
import { User, CreateUserRequest } from '@/features/users/models/user.model';
import { useI18n } from '@/i18n';
import { RoleGuard } from '@/components/ui/role-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel, canAssignRole } from '@/lib/auth/roles';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';

export default function UsersPage() {
  const { items: usersData, isLoading: loading, create, update, remove } = useUsers();
  const { t, tp } = useI18n();
  const { effectiveRoleSlug } = useAuth();
  const role = effectiveRoleSlug;
  const canEdit = hasMinLevel(role, 60);
  const canDelete = hasMinLevel(role, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest & { isActive?: boolean }>({
    firstName: '',
    lastName: '',
    userName: '',
    password: '',
    email: '',
    idRole: '',
  });
  const [roles, setRoles] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const assignableRoles = roles.filter((r) => canAssignRole(role, r.slug));

  const columns: Column<User>[] = [
    { field: 'firstName', headerName: t('users.field.firstName') },
    { field: 'lastName', headerName: t('users.field.lastName') },
    { field: 'userName', headerName: t('users.field.userName') },
    { field: 'email', headerName: t('users.field.email') },
    {
      field: 'idRole',
      headerName: t('users.field.role'),
      render: (row) => row.role?.name ?? String(row.idRole),
    },
    {
      field: 'isActive',
      headerName: t('users.field.isActive'),
      render: (row) => (row.isActive ? t('common.yes') : t('common.no')),
    },
  ];

  useEffect(() => {
    apiClient.get('/roles').then((r) => setRoles(r.data.data || [])).catch(() => console.warn('Failed to load roles'));
  }, []);

  const openCreate = () => {
    setSelectedUser(null);
    setError('');
    setFormData({ firstName: '', lastName: '', userName: '', password: '', email: '', idRole: '' });
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setError('');
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      password: '',
      email: user.email,
      idRole: user.idRole,
      isActive: user.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const isEdit = !!selectedUser;
    if (isEdit) {
      update.mutate(
        {
          id: selectedUser!.id,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email || undefined,
            idRole: formData.idRole,
            isActive: formData.isActive,
            ...(formData.password ? { password: formData.password } : {}),
          },
        },
        {
          onSuccess: () => sileo.success({ description: t('users.updated') }),
          onError: () => { setError(t('users.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(formData, {
        onSuccess: () => sileo.success({ description: t('users.created') }),
        onError: () => { setError(t('users.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('users.deleted') }),
      onError: () => { setError(t('users.error.delete')); setDeleteOpen(true); },
    });
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedUser ? t('users.edit') : t('users.new')}
      onClose={() => setFormOpen(false)}
      panel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('users.field.firstName')}</Label>
            <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('users.field.lastName')}</Label>
            <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('users.field.userName')}</Label>
            <Input value={formData.userName} onChange={(e) => setFormData({ ...formData, userName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>{t('users.field.email')}</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{selectedUser ? t('users.field.passwordEdit') : t('users.field.password')}</Label>
            <Input type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!selectedUser} />
          </div>
          <div className="space-y-2">
            <Label>{t('users.field.role')}</Label>
            <Select value={formData.idRole} onValueChange={(v) => setFormData({ ...formData, idRole: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedUser && (
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive ?? true}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
              <Label>{t('users.field.isActive')}</Label>
            </div>
          )}
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
            {t('users.new')}
          </Button>
        </RoleGuard>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={usersData}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? (user) => {
          setDeleteTarget(user);
          setDeleteOpen(true);
        } : undefined}
        emptyMessage={t('users.empty')}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('users.delete')}
        message={tp('users.deleteConfirm', { name: `${deleteTarget?.firstName} ${deleteTarget?.lastName}` })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={remove.isPending}
      />
      </div>
    </SlideForm>
  );
}
