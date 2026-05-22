'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataTable, Column } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUsers } from '@/features/users/hooks/use-users';
import { User, CreateUserRequest, UpdateUserRequest } from '@/features/users/models/user.model';
import { userService } from '@/features/users/services/user.service';
import { useI18n } from '@/i18n';
import apiClient from '@/lib/api/api-client';

export default function UsersPage() {
  const { users, loading, loadUsers } = useUsers();
  const { t, tp } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest & { available?: boolean }>({
    firstName: '',
    lastName: '',
    userName: '',
    password: '',
    email: '',
    idRole: 3,
  });
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const columns: Column<User>[] = [
    { field: 'id', headerName: t('users.field.id') },
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
      field: 'available',
      headerName: t('users.field.available'),
      render: (row) => (row.available ? t('common.yes') : t('common.no')),
    },
  ];

  useEffect(() => {
    apiClient.get('/roles').then((r) => setRoles(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setSelectedUser(null);
    setError('');
    setFormData({ firstName: '', lastName: '', userName: '', password: '', email: '', idRole: 3 });
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
      email: user.email || '',
      idRole: user.idRole,
      available: user.available,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (selectedUser) {
        const data: UpdateUserRequest = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          idRole: formData.idRole,
          available: formData.available,
        };
        if (formData.password) data.password = formData.password;
        await userService.update(selectedUser.id, data);
      } else {
        await userService.create(formData);
      }
      await loadUsers();
      setFormOpen(false);
    } catch {
      setError(t('users.error.save'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await userService.delete(deleteTarget.id);
      await loadUsers();
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch {
      setError(t('users.error.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('users.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t('users.new')}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        onEdit={openEdit}
        onDelete={(user) => {
          setDeleteTarget(user);
          setDeleteOpen(true);
        }}
        emptyMessage={t('users.empty')}
      />

      <SlideForm
        open={formOpen}
        title={selectedUser ? t('users.edit') : t('users.new')}
        onClose={() => setFormOpen(false)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={t('users.field.firstName')} value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} fullWidth required />
          <TextField label={t('users.field.lastName')} value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} fullWidth required />
          <TextField label={t('users.field.userName')} value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })} fullWidth required />
          <TextField label={t('users.field.email')} type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
          <TextField label={selectedUser ? t('users.field.passwordEdit') : t('users.field.password')}
            type="password" value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} fullWidth
            required={!selectedUser} />
          <TextField label={t('users.field.role')} select value={formData.idRole}
            onChange={(e) => setFormData({ ...formData, idRole: Number(e.target.value) })} fullWidth required>
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
            ))}
          </TextField>
          {selectedUser && (
            <FormControlLabel control={
              <Switch checked={formData.available ?? true}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })} />
            } label={t('users.field.available')} />
          )}
          <Button variant="contained" onClick={handleSave} disabled={submitting} sx={{ mt: 2 }}>
            {submitting ? t('common.saving') : t('common.save')}
          </Button>
        </Box>
      </SlideForm>

      <ConfirmDialog
        open={deleteOpen}
        title={t('users.delete')}
        message={tp('users.deleteConfirm', { name: `${deleteTarget?.firstName} ${deleteTarget?.lastName}` })}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => { setDeleteOpen(false); setDeleteTarget(null); }}
        loading={submitting}
      />
    </Box>
  );
}
