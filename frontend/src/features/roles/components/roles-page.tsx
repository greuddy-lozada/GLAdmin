'use client';

import { useRoles } from '@/features/roles/hooks/use-roles';
import { DataTable, Column } from '@/components/ui/data-table';
import { useI18n } from '@/i18n';
import { Role } from '@/features/roles/models/role.model';

export default function RolesPage() {
  const { items: roles, loading } = useRoles();
  const { t } = useI18n();

  const columns: Column<Role>[] = [
    { field: 'name', headerName: t('roles.field.name') },
    { field: 'slug', headerName: t('roles.field.slug') },
    { field: 'description', headerName: t('roles.field.description') },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        rows={roles}
        loading={loading}
        emptyMessage={t('roles.empty')}
      />
    </div>
  );
}
