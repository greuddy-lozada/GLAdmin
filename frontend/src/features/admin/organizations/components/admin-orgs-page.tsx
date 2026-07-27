'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, X } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAdminOrgs } from '@/features/admin/organizations/hooks/use-admin-orgs';
import { AdminOrg, CreateAdminOrgRequest } from '@/features/admin/organizations/models/admin-org.model';
import { adminOrgsService } from '@/features/admin/organizations/services/admin-orgs.service';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import apiClient from '@/lib/api/api-client';
import { extractApiError } from '@/lib/api/extract-api-error';

export default function AdminOrgsPage() {
  const [filterActive, setFilterActive] = useState('true');
  const { items: orgsData, isLoading: loading, create, update, remove } = useAdminOrgs(filterActive);
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<AdminOrg | null>(null);
  const [membersOrg, setMembersOrg] = useState<AdminOrg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrg | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string; label: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [formData, setFormData] = useState<CreateAdminOrgRequest & { isActive?: boolean }>({
    name: '',
    slug: '',
    planId: undefined,
    isActive: true,
  });
  const [assignData, setAssignData] = useState({ userId: '', roleId: '' });
  const [error, setError] = useState('');
  const selectedUser = users.find((u) => String(u.id) === assignData.userId);
  const selectedRole = roles.find((r) => String(r.id) === assignData.roleId);

  useEffect(() => {
    apiClient.get('/admin/plans').then((r) => setPlans(r.data.data || [])).catch(() => {});
    apiClient.get('/roles').then((r) => setRoles(r.data.data || [])).catch(() => {});
    apiClient.get('/admin/users').then((r) => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const columns: Column<AdminOrg>[] = [
    { field: 'name', headerName: t('admin.organizations.field.name') },
    { field: 'slug', headerName: t('admin.organizations.field.slug') },
    { field: 'plan', render: (row) => row.plan?.name ?? '—', headerName: t('admin.organizations.field.plan') },
    { field: 'userCount', render: (row) => String(row._count?.userMemberships ?? 0), headerName: t('admin.organizations.field.userCount') },
    {
      field: 'isActive',
      render: (row) => (row.isActive ? t('common.yes') : t('common.no')),
      headerName: t('admin.organizations.field.isActive'),
    },
    {
      field: 'members',
      headerName: '',
      render: (row) => (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openMembers(row); }}>
          <Users className="mr-1 h-4 w-4" />
          {t('admin.organizations.members.title')}
        </Button>
      ),
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

  const openMembers = async (org: AdminOrg) => {
    setError('');
    try {
      const detail = await adminOrgsService.getById(org.id);
      setMembersOrg(detail);
      setMembersOpen(true);
    } catch (err) {
      setError(extractApiError(err) ?? t('admin.organizations.members.error.load'));
    }
  };

  const handleSave = () => {
    setError('');
    setFormOpen(false);
    const data: CreateAdminOrgRequest = {
      name: formData.name,
      slug: formData.slug || slugify(formData.name),
      planId: formData.planId || undefined,
      isActive: formData.isActive,
    };
    if (selectedOrg) {
      update.mutate(
        { id: selectedOrg.id, data },
        {
          onSuccess: () => sileo.success({ description: t('admin.organizations.updated') }),
          onError: (err) => { setError(extractApiError(err) ?? t('admin.organizations.error.save')); setFormOpen(true); },
        },
      );
    } else {
      create.mutate(data, {
        onSuccess: () => sileo.success({ description: t('admin.organizations.created') }),
        onError: (err) => { setError(extractApiError(err) ?? t('admin.organizations.error.save')); setFormOpen(true); },
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteOpen(false);
    setDeleteTarget(null);
    remove.mutate(targetId, {
      onSuccess: () => sileo.success({ description: t('admin.organizations.deleted') }),
      onError: (err) => { setError(extractApiError(err) ?? t('admin.organizations.error.delete')); setDeleteOpen(true); },
    });
  };

  const handleAssign = async () => {
    if (!membersOrg || !assignData.userId || !assignData.roleId) return;
    setAssignOpen(false);
    try {
      await adminOrgsService.assignUser(membersOrg.id, assignData.userId, assignData.roleId);
      sileo.success({ description: t('admin.organizations.members.assigned') });
      const detail = await adminOrgsService.getById(membersOrg.id);
      setMembersOrg(detail);
      setAssignData({ userId: '', roleId: '' });
    } catch (err) {
      setError(extractApiError(err) ?? t('admin.organizations.members.error.assign'));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!membersOrg) return;
    try {
      await adminOrgsService.removeUser(membersOrg.id, userId);
      sileo.success({ description: t('admin.organizations.members.removed') });
      const detail = await adminOrgsService.getById(membersOrg.id);
      setMembersOrg(detail);
    } catch (err) {
      setError(extractApiError(err) ?? t('admin.organizations.members.error.remove'));
    }
  };

  const handleChangeRole = async (userId: string, roleId: string) => {
    if (!membersOrg) return;
    try {
      await adminOrgsService.changeUserRole(membersOrg.id, userId, roleId);
      sileo.success({ description: t('admin.organizations.members.roleChanged') });
      const detail = await adminOrgsService.getById(membersOrg.id);
      setMembersOrg(detail);
    } catch (err) {
      setError(extractApiError(err) ?? t('admin.organizations.members.error.changeRole'));
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
              onValueChange={(v) => setFormData({ ...formData, planId: v || undefined })}
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
          <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full">
            {create.isPending || update.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
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
          {t('admin.organizations.new')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={orgsData}
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
        loading={remove.isPending}
      />

      <Dialog open={membersOpen} onOpenChange={(o) => { if (!o) { setMembersOpen(false); setMembersOrg(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{membersOrg ? `${t('admin.organizations.members.title')} — ${membersOrg.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {membersOrg?.userMemberships && membersOrg.userMemberships.length > 0
              ? membersOrg.userMemberships.map((m) => (
                  <div key={`${m.userId}-${m.organizationId}`} className="flex items-center justify-between gap-2 border rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.user.firstName} {m.user.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                    </div>
                    <Select value={m.role.id} onValueChange={(v) => handleChangeRole(m.user.id, v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => handleRemoveMember(m.user.id)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              : (
                <p className="text-sm text-muted-foreground text-center py-4">{t('admin.organizations.members.empty')}</p>
              )
            }
          </div>
          <Button onClick={() => setAssignOpen(true)} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {t('admin.organizations.members.assign')}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('admin.organizations.members.assign')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.organizations.members.field.user')}</Label>
              <SearchableSelect
                value={assignData.userId}
                onChange={(v) => setAssignData({ ...assignData, userId: v ?? '' })}
                placeholder={t('admin.organizations.members.placeholder.user')}
                emptyText={t('admin.organizations.members.noUsers')}
                searchFn={async (term) =>
                  users.filter(
                    (u) =>
                      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(term.toLowerCase()),
                  )
                }
                renderItem={(u) => `${u.firstName} ${u.lastName}`}
                getKey={(u) => String(u.id)}
                selectedLabel={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.organizations.members.field.role')}</Label>
              <SearchableSelect
                value={assignData.roleId}
                onChange={(v) => setAssignData({ ...assignData, roleId: v ?? '' })}
                placeholder={t('admin.organizations.members.placeholder.role')}
                emptyText={t('admin.organizations.members.noRoles')}
                searchFn={async (term) =>
                  roles.filter((r) => r.name.toLowerCase().includes(term.toLowerCase()))
                }
                renderItem={(r) => r.name}
                getKey={(r) => String(r.id)}
                selectedLabel={selectedRole?.name}
              />
            </div>
            <Button onClick={handleAssign} className="w-full">
              {t('admin.organizations.members.assign')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </SlideForm>
  );
}
