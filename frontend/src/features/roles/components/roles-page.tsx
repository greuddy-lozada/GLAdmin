'use client';

import { Box, Typography } from '@mui/material';
import { DataTable, Column } from '@/components/ui/data-table';
import { useRoles } from '@/features/roles/hooks/use-roles';
import { Role } from '@/features/roles/models/role.model';
import { useI18n } from '@/i18n';

export default function RolesPage() {
  const { items, loading } = useRoles();
  const { t } = useI18n();

  const columns: Column<Role>[] = [
    { field: 'id', headerName: t('roles.field.id') },
    { field: 'name', headerName: t('roles.field.name') },
    { field: 'slug', headerName: t('roles.field.slug') },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        {t('roles.title')}
      </Typography>
      <DataTable columns={columns} rows={items} loading={loading} emptyMessage={t('roles.empty')} />
    </Box>
  );
}
