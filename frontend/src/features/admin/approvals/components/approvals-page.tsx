'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, Column } from '@/components/ui/data-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApprovals } from '@/features/admin/approvals/hooks/use-approvals';
import { AdminApproval } from '@/features/admin/approvals/models/approval.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const actionLabels: Record<string, string> = {
  CREATE_ORG: 'Create Org',
  UPDATE_ORG: 'Update Org',
  DELETE_ORG: 'Delete Org',
  CREATE_PLAN: 'Create Plan',
  UPDATE_PLAN: 'Update Plan',
  DELETE_PLAN: 'Delete Plan',
  CREATE_ADMIN_USER: 'Create Admin User',
  UPDATE_ADMIN_USER: 'Update Admin User',
  DEACTIVATE_ADMIN_USER: 'Deactivate Admin User',
  ASSIGN_USER_ORG: 'Assign User',
  REMOVE_USER_ORG: 'Remove User',
  CHANGE_USER_ROLE: 'Change Role',
  CREATE_INVITE: 'Create Invite',
  DELETE_INVITE: 'Delete Invite',
};

export default function AdminApprovalsPage() {
  const { items, isLoading, statusFilter, setStatusFilter, approve, reject, refresh } = useApprovals();
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState<AdminApproval | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (item: AdminApproval) => {
    setError('');
    try {
      await approve(item.id);
      sileo.success({ description: t('admin.approvals.approved') });
    } catch {
      setError(t('admin.approvals.error.review'));
    }
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    setError('');
    const target = rejectTarget;
    setRejectTarget(null);
    reject(target.id, rejectReason || undefined)
      .then(() => sileo.success({ description: t('admin.approvals.rejected') }))
      .catch(() => setError(t('admin.approvals.error.review')));
  };

  const columns: Column<AdminApproval>[] = [
    {
      field: 'action',
      render: (row) => actionLabels[row.action] ?? row.action,
      headerName: t('admin.approvals.field.action'),
    },
    {
      field: 'description',
      headerName: t('admin.approvals.field.description'),
    },
    {
      field: 'performedBy',
      render: (row) => `${row.performedBy.firstName} ${row.performedBy.lastName}`,
      headerName: t('admin.approvals.field.performedBy'),
    },
    {
      field: 'performedAt',
      render: (row) => formatDate(row.performedAt),
      headerName: t('admin.approvals.field.date'),
    },
    {
      field: 'status',
      render: (row) => {
        if (row.status === 'approved') return <span className="text-green-600 font-medium">{t('admin.approvals.status.approved')}</span>;
        if (row.status === 'rejected') return <span className="text-red-600 font-medium">{t('admin.approvals.status.rejected')}</span>;
        return <span className="text-amber-600 font-medium">{t('admin.approvals.status.pending')}</span>;
      },
      headerName: t('admin.approvals.field.status'),
    },
    {
      field: 'actions',
      render: (row) =>
        row.status === 'pending' ? (
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(row)}>
              <Check className="h-4 w-4 mr-1" /> {t('admin.approvals.approve')}
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setRejectTarget(row); setRejectReason(''); }}>
              <X className="h-4 w-4 mr-1" /> {t('admin.approvals.reject')}
            </Button>
          </div>
        ) : row.rejectionReason ? (
          <span className="text-xs text-muted-foreground" title={row.rejectionReason}>
            {row.rejectionReason.length > 40 ? row.rejectionReason.slice(0, 40) + '...' : row.rejectionReason}
          </span>
        ) : null,
      headerName: t('common.actions'),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
            >
              {s ? t(`admin.approvals.filter.${s}`) : t('admin.approvals.filter.all')}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={refresh}>
          {t('common.refresh')}
        </Button>
      </div>

      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

      <DataTable
        columns={columns}
        rows={items}
        loading={isLoading}
        emptyMessage={t('admin.approvals.empty')}
      />

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.approvals.rejectTitle')}</DialogTitle>
            <DialogDescription>{t('admin.approvals.rejectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <Label>{t('admin.approvals.rejectionReason')}</Label>
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('admin.approvals.rejectionReasonPlaceholder')} />
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              {t('admin.approvals.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
