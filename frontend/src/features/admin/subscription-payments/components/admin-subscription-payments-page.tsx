'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { useI18n } from '@/i18n';
import { useAdminSubscriptionPayments } from '@/features/billing/hooks/use-subscription-payment';
import type { SubscriptionPayment } from '@/features/billing/models/subscription-payment.model';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return <Badge variant="outline" className={colors[status] ?? ''}>{status}</Badge>;
}

export default function AdminSubscriptionPaymentsPage() {
  const { t } = useI18n();
  const { payments, loading, error, load, review } = useAdminSubscriptionPayments();

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<SubscriptionPayment>[] = [
    { field: 'id', headerName: 'ID' },
    {
      field: 'organizationId',
      headerName: t('subscription.admin.field.organization'),
      render: (row) => row.organization?.name ?? `#${row.organizationId}`,
    },
    {
      field: 'planId',
      headerName: t('subscription.admin.field.plan'),
      render: (row) => row.plan?.label ?? `#${row.planId}`,
    },
    { field: 'method', headerName: t('subscription.admin.field.method') },
    {
      field: 'amountUsd',
      headerName: t('subscription.admin.field.amount'),
      render: (row) => `$${row.amountUsd.toFixed(2)}`,
    },
    {
      field: 'status',
      headerName: t('subscription.admin.field.status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      field: 'createdAt',
      headerName: t('subscription.admin.field.createdAt'),
      render: (row) => formatDate(row.createdAt),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      render: (row) =>
        row.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-green-600 h-7 text-xs" onClick={() => review(row.id, 'approved')}>
              {t('subscription.admin.approve')}
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 h-7 text-xs" onClick={() => review(row.id, 'rejected')}>
              {t('subscription.admin.reject')}
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => load()}>{t('common.refresh')}</Button>
          <Button size="sm" variant="outline" onClick={() => load('pending')}>{t('subscription.admin.filterPending')}</Button>
          <Button size="sm" variant="outline" onClick={() => load()}>{t('subscription.admin.filterAll')}</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={payments}
        loading={loading}
        emptyMessage={t('subscription.admin.empty')}
      />
    </div>
  );
}
