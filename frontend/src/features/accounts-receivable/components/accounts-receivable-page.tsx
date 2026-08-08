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
import { useAccountsReceivable } from '@/features/accounts-receivable/hooks/use-accounts-receivable';
import {
  AccountsReceivable,
  ArStatus,
  ArStatusFilter,
} from '@/features/accounts-receivable/models/accounts-receivable.model';
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

export default function AccountsReceivablePage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<ArStatusFilter>('open');
  const { items, isLoading, registerPayment } = useAccountsReceivable(status);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selected, setSelected] = useState<AccountsReceivable | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const openPayment = (row: AccountsReceivable) => {
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
      setError(t('accountsReceivable.error.invalidAmount'));
      return;
    }
    if (parsed > selected.balance + 0.01) {
      setError(t('accountsReceivable.error.exceedsBalance'));
      return;
    }
    setError('');
    registerPayment.mutate(
      { id: selected.id, data: { amount: parsed, note: note || undefined } },
      {
        onSuccess: () => {
          setPaymentOpen(false);
          sileo.success({ description: t('accountsReceivable.paymentRegistered') });
        },
        onError: (err) => {
          setError(extractApiError(err) ?? t('accountsReceivable.error.payment'));
        },
      },
    );
  };

  const columns: Column<AccountsReceivable>[] = [
    {
      field: 'customerName',
      headerName: t('accountsReceivable.field.customer'),
      mobile: 'title',
    },
    {
      field: 'balance',
      headerName: t('accountsReceivable.field.balance'),
      isNumeric: true,
      mobile: 'primary',
      render: (row) => formatMoney(row.balance),
    },
    {
      field: 'dueDate',
      headerName: t('accountsReceivable.field.dueDate'),
      mobile: 'primary',
      render: (row) => formatDate(row.dueDate),
    },
    {
      field: 'status',
      headerName: t('accountsReceivable.field.status'),
      mobile: 'primary',
      render: (row) =>
        row.status === ArStatus.Paid
          ? t('accountsReceivable.status.paid')
          : t('accountsReceivable.status.open'),
    },
    {
      field: 'saleCode',
      headerName: t('accountsReceivable.field.sale'),
      mobile: 'secondary',
      render: (row) => row.saleCode ?? '—',
    },
    {
      field: 'amount',
      headerName: t('accountsReceivable.field.amount'),
      isNumeric: true,
      mobile: 'secondary',
      render: (row) => formatMoney(row.amount),
    },
    {
      field: 'credit',
      headerName: t('accountsReceivable.field.credit'),
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
            {t('accountsReceivable.abono')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as ArStatusFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{t('accountsReceivable.filter.open')}</SelectItem>
            <SelectItem value="overdue">{t('accountsReceivable.filter.overdue')}</SelectItem>
            <SelectItem value="paid">{t('accountsReceivable.filter.paid')}</SelectItem>
            <SelectItem value="all">{t('accountsReceivable.filter.all')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={items}
        loading={isLoading}
        emptyMessage={t('accountsReceivable.empty')}
      />

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('accountsReceivable.abonoTitle')}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selected.customerName} · {formatMoney(selected.balance)}
              </p>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="ar-abono-amount">{t('accountsReceivable.field.abonoAmount')}</Label>
                <Input
                  id="ar-abono-amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ar-abono-note">{t('accountsReceivable.field.note')}</Label>
                <Input
                  id="ar-abono-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('accountsReceivable.notePlaceholder')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPaymentOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handlePayment} disabled={registerPayment.isPending}>
                  {registerPayment.isPending
                    ? t('common.saving')
                    : t('accountsReceivable.abono')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
