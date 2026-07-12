'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import { PaymentMethod, type SalePayment } from '../models/pos.model';
import { usePosStore } from '@/stores/pos-store';
import { Banknote, Smartphone, ArrowRightLeft, CreditCard, Plus, X } from 'lucide-react';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  totalUsd: number;
  totalTax: number;
  totalTaxUsd: number;
  exchangeRate: number;
  withholdingAmount?: number;
  withholdingAmountUsd?: number;
  netToCollect?: number;
  netToCollectUsd?: number;
  onPayment: (payments: SalePayment[]) => void;
}

const METHODS = [
  { value: PaymentMethod.Cash, labelKey: 'pos.payment.cash', Icon: Banknote },
  { value: PaymentMethod.PagoMovil, labelKey: 'pos.payment.pagoMovil', Icon: Smartphone },
  { value: PaymentMethod.Transfer, labelKey: 'pos.payment.transfer', Icon: ArrowRightLeft },
  { value: PaymentMethod.Card, labelKey: 'pos.payment.card', Icon: CreditCard },
] as const;

const CURRENCIES = [
  { value: 'VES' as const, label: 'Bs.' },
  { value: 'USD' as const, label: 'USD' },
];

function methodIcon(method: PaymentMethod) {
  const m = METHODS.find((c) => c.value === method);
  if (!m) return null;
  const Icon = m.Icon;
  return <Icon className="h-4 w-4" />;
}

export function PaymentModal({
  open, onOpenChange, total, totalUsd, totalTax, totalTaxUsd,
  exchangeRate, withholdingAmount, netToCollect, netToCollectUsd, onPayment,
}: PaymentModalProps) {
  const { t } = useI18n();
  const lines = usePosStore((s) => s.paymentLines);
  const addLine = usePosStore((s) => s.addPaymentLine);
  const removeLine = usePosStore((s) => s.removePaymentLine);
  const clearLines = usePosStore((s) => s.clearPaymentLines);
  const setLines = usePosStore((s) => s.setPaymentLines);
  const hasWithholding = (withholdingAmount ?? 0) > 0;
  const fullTotal = total + totalTax;
  const collectTotal = hasWithholding ? (netToCollect ?? fullTotal) : fullTotal;
  const collectTotalUsd = hasWithholding ? (netToCollectUsd ?? 0) : totalUsd + totalTaxUsd;

  const [showForm, setShowForm] = useState(false);
  const [editMethod, setEditMethod] = useState(PaymentMethod.Cash);
  const [editCurrency, setEditCurrency] = useState<'VES' | 'USD'>('VES');
  const [editAmount, setEditAmount] = useState('');
  const [error, setError] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  const paidVes = lines.reduce((sum, l) => {
    if (l.currency === 'VES') return sum + l.amount;
    return sum + l.amount * exchangeRate;
  }, 0);
  const remaining = collectTotal - paidVes;
  const isExact = Math.abs(remaining) < 0.01;
  const isOver = remaining < 0;

  const handleAddLine = () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    addLine({ method: editMethod, amount, currency: editCurrency });
    setEditAmount('');
    setEditMethod(PaymentMethod.Cash);
    setEditCurrency('VES');
    setShowForm(false);
    setError('');
  };

  const handleRemoveLine = (index: number) => {
    removeLine(index);
    setError('');
  };

  const handleQuickAllCashVes = () => {
    if (collectTotal > 0) setLines([{ method: PaymentMethod.Cash, amount: collectTotal, currency: 'VES' }]);
  };

  const handleQuickAllCashUsd = () => {
    if (collectTotalUsd > 0) setLines([{ method: PaymentMethod.Cash, amount: collectTotalUsd, currency: 'USD' }]);
  };

  const handleQuickSplit = () => {
    const halfVes = collectTotal / 2;
    if (halfVes > 0) {
      setLines([
        { method: PaymentMethod.Cash, amount: halfVes, currency: 'VES' },
        { method: PaymentMethod.PagoMovil, amount: halfVes, currency: 'VES' },
      ]);
    }
  };

  const handleConfirm = () => {
    const totalPaid = lines.reduce((sum, l) => {
      if (l.currency === 'VES') return sum + l.amount;
      return sum + l.amount * exchangeRate;
    }, 0);
    const diff = Math.abs(totalPaid - collectTotal);
    if (diff > 0.01) {
      setError('El total pagado no coincide con el total a cobrar');
      return;
    }
    setError('');
    const payments: SalePayment[] = lines
      .filter((l) => l.amount > 0)
      .map((l) => ({ method: l.method, amount: l.amount, currency: l.currency }));

    onPayment(payments);
    clearLines();
    onOpenChange(false);
  };

  const handleOpenForm = () => {
    setShowForm(true);
    // Fill amount with remaining if in VES mode
    if (remaining > 0) {
      setEditAmount(remaining.toFixed(2));
      setEditCurrency('VES');
    } else if (collectTotalUsd > 0 && lines.length === 0) {
      setEditAmount(collectTotalUsd.toFixed(2));
      setEditCurrency('USD');
    }
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setShowForm(false); setError(''); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pos.payment.title')}</DialogTitle>
          <DialogDescription>{t('pos.payment.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Total display */}
          <div>
            <div className="text-2xl font-bold tabular-nums text-primary">Bs. {collectTotal.toFixed(2)}</div>
            {collectTotalUsd > 0 && (
              <div className="text-lg text-muted-foreground tabular-nums">$ {collectTotalUsd.toFixed(2)} USD</div>
            )}
            <div className="text-xs text-muted-foreground">Tasa: Bs. {exchangeRate.toFixed(2)} / USD</div>
            {hasWithholding && (
              <div className="text-xs text-muted-foreground mt-1">
                {t('pos.withholding.invoiceTotal')}: Bs. {(total + totalTax).toFixed(2)}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleQuickAllCashVes} disabled={collectTotal <= 0}>
              <Banknote className="h-3.5 w-3.5 mr-1" />
              {t('pos.payment.quickCashVes')}
            </Button>
            {collectTotalUsd > 0 && (
              <Button variant="outline" size="sm" onClick={handleQuickAllCashUsd}>
                <Banknote className="h-3.5 w-3.5 mr-1" />
                {t('pos.payment.quickCashUsd')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleQuickSplit} disabled={collectTotal <= 0}>
              {t('pos.payment.quickSplit')}
            </Button>
          </div>

          {/* Payment lines */}
          {lines.length > 0 && (
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-2.5 pr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground shrink-0">{methodIcon(line.method)}</span>
                    <span className="text-sm font-medium truncate">
                      {t(METHODS.find((m) => m.value === line.method)?.labelKey ?? '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                      {line.currency === 'USD' ? '$' : 'Bs.'} {line.amount.toFixed(2)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveLine(i)} aria-label={t('pos.payment.remove')}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add method button / form */}
          {!showForm ? (
            <Button variant="outline" className="w-full border-dashed" onClick={handleOpenForm}>
              <Plus className="h-4 w-4 mr-1" />
              {t('pos.payment.addMethod')}
            </Button>
          ) : (
            <div className="border rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('pos.payment.method')}</Label>
                  <Select value={String(editMethod)} onValueChange={(v) => setEditMethod(Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>{t(m.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('pos.payment.currency')}</Label>
                  <Select value={editCurrency} onValueChange={(v) => setEditCurrency(v as 'VES' | 'USD')}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs">{editCurrency === 'USD' ? t('pos.payment.amountUsd') : t('pos.payment.amountVes')}</Label>
                  <Input
                    ref={amountRef}
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-9"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddLine(); }}
                    autoFocus
                  />
                </div>
                <Button size="sm" className="h-9" onClick={handleAddLine}>{t('pos.payment.add')}</Button>
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className={`border rounded-lg p-3 space-y-1.5 ${
            isExact && lines.length > 0 ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
            isOver ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
            paidVes > 0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
            'bg-muted/30'
          }`}>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('pos.payment.paid')}</span>
              <span className="tabular-nums">Bs. {paidVes.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-sm font-semibold ${
              isExact && lines.length > 0 ? 'text-green-600 dark:text-green-400' :
              isOver ? 'text-destructive' :
              'text-yellow-600 dark:text-yellow-400'
            }`}>
              <span>
                {isExact && lines.length > 0 ? t('pos.payment.complete') :
                 isOver ? t('pos.payment.excess') :
                 paidVes > 0 ? t('pos.payment.remaining') :
                 t('pos.payment.pending')}
              </span>
              <span className="tabular-nums">
                {isExact && lines.length > 0 ? '\u2713' :
                 paidVes > 0 ? `Bs. ${Math.abs(remaining).toFixed(2)}` :
                 `Bs. ${collectTotal.toFixed(2)}`}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" size="lg" onClick={handleConfirm} disabled={lines.length === 0}>
            {t('pos.payment.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
