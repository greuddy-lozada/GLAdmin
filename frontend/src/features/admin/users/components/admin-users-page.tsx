'use client';

import { useState, useEffect } from 'react';
import { Plus, Shield, Users } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAdminUsers } from '@/features/admin/users/hooks/use-admin-users';
import { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from '@/features/admin/users/models/admin-user.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { Role } from '@/features/roles/models/role.model';
import apiClient from '@/lib/api/api-client';
import { extractApiError } from '@/lib/api/extract-api-error';

export default function AdminUsersPage() {
  const [filterActive, setFilterActive] = useState('true');
  const { items: usersData, isLoading: loading, create, update } = useAdminUsers(filterActive);
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [createData, setCreateData] = useState<CreateAdminUserRequest>({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    idRole: '',
    password: '',
    isActive: true,
    organizationId: undefined,
    orgRoleId: undefined,
  });
  const [editData, setEditData] = useState<UpdateAdminUserRequest>({
    isActive: true,
    roleId: undefined,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/roles').then((r) => setRoles(r.data.data || [])).catch(() => {});
    apiClient.get('/admin/orgs?isActive=all').then((r) => setOrgs(r.data.data || [])).catch(() => {});
  }, []);

  const columns: Column<AdminUser>[] = [
    { field: 'name', render: (row) => `${row.firstName} ${row.lastName}`.trim(), headerName: t('admin.users.field.name') },
    { field: 'email', headerName: t('admin.users.field.email') },
    {
      field: 'role', render: (row) => {
        const isSystem = row.role?.type === 'system';
        return (
          <span className="flex items-center gap-1.5">
            {isSystem ? <Shield className="h-3.5 w-3.5 text-primary" /> : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
            <span>{row.role?.slug ?? '—'}</span>
            {isSystem && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{t('admin.users.badge.system')}</Badge>}
          </span>
        );
      },
      headerName: t('admin.users.field.role'),
    },
    {
      field: 'isActive',
      render: (row) => (row.isActive ? t('common.yes') : t('common.no')),
      headerName: t('admin.users.field.isActive'),
    },
    { field: 'orgCount', render: (row) => {
      const orgs = row.organizations?.map((o) => o.organization.name).join(', ') ?? '';
      return orgs || '0';
    }, headerName: t('admin.users.field.orgCount') },
  ];

  const openCreate = () => {
    setSelectedUser(null);
    setError('');
    setCreateData({ firstName: '', lastName: '', userName: '', email: '', idRole: '', password: '', isActive: true, organizationId: undefined, orgRoleId: undefined });
    setFormOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setError('');
    setEditData({ isActive: user.isActive, roleId: user.idRole });
    setFormOpen(true);
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    if (selectedUser) {
      update.mutate(
        { id: selectedUser.id, data: editData },
        {
          onSuccess: () => sileo.success({ description: t('admin.users.updated') }),
          onError: (err) => { setError(extractApiError(err) ?? t('admin.users.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(createData, {
        onSuccess: () => sileo.success({ description: t('admin.users.created') }),
        onError: (err) => { setError(extractApiError(err) ?? t('admin.users.error.save')); setFormOpen(true); },
      });
    }
  };

  return (
    <SlideForm
      open={formOpen}
      title={selectedUser ? t('admin.users.edit') : t('admin.users.new')}
      onClose={() => setFormOpen(false)}
      panel={
        selectedUser ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.users.field.role')}</Label>
              <Select
                value={String(editData.roleId ?? '')}
                onValueChange={(v) => setEditData({ ...editData, roleId: v || undefined })}
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
              <Switch checked={editData.isActive ?? true} onCheckedChange={(c) => setEditData({ ...editData, isActive: c })} />
              <Label>{t('admin.users.field.isActive')}</Label>
            </div>
            {selectedUser.organizations && selectedUser.organizations.length > 0 && (
              <div className="space-y-1">
                <Label>{t('admin.users.field.orgsList')}</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.organizations.map((o) => (
                    <span key={o.organization.id} className="text-xs bg-muted px-2 py-1 rounded">
                      {o.organization.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleSave} disabled={update.isPending} className="w-full">
              {update.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.users.field.firstName')}</Label>
              <Input value={createData.firstName} onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.field.lastName')}</Label>
              <Input value={createData.lastName} onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.field.userName')}</Label>
              <Input value={createData.userName} onChange={(e) => setCreateData({ ...createData, userName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.field.email')}</Label>
              <Input type="email" value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.field.password')}</Label>
              <Input type="password" value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.field.role')}</Label>
              <Select value={createData.idRole} onValueChange={(v) => setCreateData({ ...createData, idRole: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.users.field.organization')}</Label>
              <Select
                value={createData.organizationId ?? ''}
                onValueChange={(v) => setCreateData({ ...createData, organizationId: v || undefined, orgRoleId: v ? createData.orgRoleId : undefined })}
              >
                <SelectTrigger><SelectValue placeholder={t('common.none')} /></SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createData.organizationId && (
              <div className="space-y-2">
                <Label>{t('admin.users.field.orgRole')}</Label>
                <Select
                  value={createData.orgRoleId ?? ''}
                  onValueChange={(v) => setCreateData({ ...createData, orgRoleId: v || undefined })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.filter((r) => r.type !== 'system').map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={createData.isActive ?? true} onCheckedChange={(c) => setCreateData({ ...createData, isActive: c })} />
              <Label>{t('admin.users.field.isActive')}</Label>
            </div>
            <Button onClick={handleSave} disabled={create.isPending} className="w-full">
              {create.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        )
      }
    >
      <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t('admin.organizations.filter.active')}</SelectItem>
            <SelectItem value="false">{t('admin.organizations.filter.inactive')}</SelectItem>
            <SelectItem value="all">{t('admin.organizations.filter.all')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.users.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={usersData}
        loading={loading}
        onEdit={openEdit}
        emptyMessage={t('admin.users.empty')}
      />
      </div>
    </SlideForm>
  );
}
