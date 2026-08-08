'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { useAccountsPayable } from '@/features/accounts-payable/hooks/use-accounts-payable';
import {
  AccountsPayable,
  ApStatus,
  ApStatusFilter,
} from '@/features/accounts-payable/models/accounts-payable.model';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { extractApiError } from '@/lib/api/extract-api-error';

function formatMoney(amount: number) {
  return `Bs. ${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-VE');
}

export default function AccountsPayablePage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<ApStatusFilter>('open');
  const { items, isLoading, registerPayment } = useAccountsPayable(status);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selected, setSelected] = useState<AccountsPayable | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const openPayment = (row: AccountsPayable) => {
    setSelected(row);
    setAmount(row.balance > 0 ? String(row.balance) : '');
    setNote('');
    setError('');
    setPaymentOpen(true);
  };

  const handlePayment = () => {
    if (!selected) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t('accountsPayable.error.invalidAmount'));
      return;
    }
    if (parsed > selected.balance + 0.01) {
      setError(t('accountsPayable.error.exceedsBalance'));
      return;
    }
    setError('');
    registerPayment.mutate(
      { id: selected.id, data: { amount: parsed, note: note || undefined } },
      {
        onSuccess: () => {
          setPaymentOpen(false);
          sileo.success({ description: t('accountsPayable.paymentRegistered') });
        },
        onError: (err) => {
          setError(extractApiError(err) ?? t('accountsPayable.error.payment'));
        },
      },
    );
  };

  const columns: Column<AccountsPayable>[] = [
    {
      field: 'supplierName',
      headerName: t('accountsPayable.field.supplier'),
      mobile: 'title',
    },
    {
      field: 'balance',
      headerName: t('accountsPayable.field.balance'),
      isNumeric: true,
      mobile: 'primary',
      render: (row) => formatMoney(row.balance),
    },
    {
      field: 'dueDate',
      headerName: t('accountsPayable.field.dueDate'),
      mobile: 'primary',
      render: (row) => formatDate(row.dueDate),
    },
    {
      field: 'status',
      headerName: t('accountsPayable.field.status'),
      mobile: 'primary',
      render: (row) =>
        row.status === ApStatus.Paid
          ? t('accountsPayable.status.paid')
          : t('accountsPayable.status.open'),
    },
    {
      field: 'purchaseOrderCode',
      headerName: t('accountsPayable.field.purchaseOrder'),
      mobile: 'secondary',
      render: (row) => row.purchaseOrderCode ?? '—',
    },
    {
      field: 'amount',
      headerName: t('accountsPayable.field.amount'),
      isNumeric: true,
      mobile: 'secondary',
      render: (row) => formatMoney(row.amount),
    },
    {
      field: 'credit',
      headerName: t('accountsPayable.field.credit'),
      isNumeric: true,
      mobile: 'secondary',
      render: (row) => formatMoney(row.credit),
    },
    {
      field: 'id',
      headerName: t('common.actions'),
      sortable: false,
      mobile: 'action',
      render: (row) =>
        row.balance > 0.01 ? (
          <Button size="sm" variant="outline" onClick={() => openPayment(row)}>
            {t('accountsPayable.abono')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ApStatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{t('accountsPayable.filter.open')}</SelectItem>
            <SelectItem value="overdue">{t('accountsPayable.filter.overdue')}</SelectItem>
            <SelectItem value="paid">{t('accountsPayable.filter.paid')}</SelectItem>
            <SelectItem value="all">{t('accountsPayable.filter.all')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={isLoading}
        emptyMessage={t('accountsPayable.empty')}
      />

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('accountsPayable.abonoTitle')}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selected.supplierName} · {formatMoney(selected.balance)}
              </p>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="ap-abono-amount">{t('accountsPayable.field.abonoAmount')}</Label>
                <Input
                  id="ap-abono-amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-abono-note">{t('accountsPayable.field.note')}</Label>
                <Input
                  id="ap-abono-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('accountsPayable.notePlaceholder')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handlePayment} disabled={registerPayment.isPending}>
                  {registerPayment.isPending
                    ? t('common.saving')
                    : t('accountsPayable.abono')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
