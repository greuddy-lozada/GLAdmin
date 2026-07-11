'use client';

import { useState } from 'react';
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

const CURRENCIES = [
  { value: PaymentMethod.Cash, labelKey: 'pos.payment.cash' },
  { value: PaymentMethod.PagoMovil, labelKey: 'pos.payment.pagoMovil' },
  { value: PaymentMethod.Transfer, labelKey: 'pos.payment.transfer' },
  { value: PaymentMethod.Card, labelKey: 'pos.payment.card' },
] as const;

export function PaymentModal({ open, onOpenChange, total, totalUsd, totalTax, totalTaxUsd, exchangeRate, withholdingAmount, netToCollect, netToCollectUsd, onPayment }: PaymentModalProps) {
  const { t } = useI18n();
  const hasWithholding = (withholdingAmount ?? 0) > 0;
  const fullTotal = total + totalTax;
  const fullTotalUsd = totalUsd + totalTaxUsd;
  const collectTotal = hasWithholding ? (netToCollect ?? fullTotal) : fullTotal;
  const collectTotalUsd = hasWithholding ? (netToCollectUsd ?? fullTotalUsd) : fullTotalUsd;

  const [vesMethod, setVesMethod] = useState(PaymentMethod.Cash);
  const [vesAmount, setVesAmount] = useState(collectTotal.toFixed(2));
  const [usdMethod, setUsdMethod] = useState(PaymentMethod.Cash);
  const [usdAmount, setUsdAmount] = useState('0');
  const [error, setError] = useState('');

  const vesNum = parseFloat(vesAmount) || 0;
  const usdNum = parseFloat(usdAmount) || 0;
  const paidVes = vesNum + usdNum * exchangeRate;
  const remaining = collectTotal - paidVes;
  const isExact = Math.abs(remaining) < 0.01;
  const isOver = remaining < 0;
  const remainingUsd = exchangeRate > 0 ? Math.abs(remaining) / exchangeRate : 0;

  const handleConfirm = () => {
    const paidVes = vesNum + usdNum * exchangeRate;
    const diff = Math.abs(paidVes - collectTotal);
    if (diff > 0.01) {
      setError(`El total pagado (Bs. ${paidVes.toFixed(2)}) no coincide con el total a cobrar (Bs. ${collectTotal.toFixed(2)})`);
      return;
    }
    setError('');

    const payments: SalePayment[] = [];
    if (vesNum > 0) payments.push({ method: vesMethod, amount: vesNum, currency: 'VES' });
    if (usdNum > 0) payments.push({ method: usdMethod, amount: usdNum, currency: 'USD' });
    if (payments.length === 0) return;

    onPayment(payments);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pos.payment.title')}</DialogTitle>
          <DialogDescription>{t('pos.payment.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold tabular-nums text-primary">${collectTotal.toFixed(2)} VES</div>
            <div className="text-lg text-muted-foreground tabular-nums">${collectTotalUsd.toFixed(2)} USD</div>
            <div className="text-xs text-muted-foreground">Tasa: Bs. {exchangeRate.toFixed(2)} / USD</div>
            {hasWithholding && (
              <div className="text-xs text-muted-foreground mt-1">
                {t('pos.withholding.invoiceTotal')}: ${total.toFixed(2)} VES
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-medium">{t('pos.payment.vesSection')}</h4>
            <div className="space-y-2">
              <Label>{t('pos.payment.method')}</Label>
              <Select value={String(vesMethod)} onValueChange={(v) => setVesMethod(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={String(c.value)}>{t(c.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('pos.payment.amountVes')}</Label>
              <Input type="number" step="0.01" min="0" value={vesAmount} onChange={(e) => { setVesAmount(e.target.value); setError(''); }} />
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-medium">{t('pos.payment.usdSection')}</h4>
            <div className="space-y-2">
              <Label>{t('pos.payment.method')}</Label>
              <Select value={String(usdMethod)} onValueChange={(v) => setUsdMethod(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.value} value={String(c.value)}>{t(c.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('pos.payment.amountUsd')}</Label>
              <Input type="number" step="0.01" min="0" value={usdAmount} onChange={(e) => { setUsdAmount(e.target.value); setError(''); }} />
            </div>
          </div>

          <div className={`border rounded-lg p-3 space-y-1.5 ${isExact ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : isOver ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : paidVes > 0 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' : 'bg-muted/30'}`}>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('pos.payment.paid')}</span>
              <span className="tabular-nums">Bs. {paidVes.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-sm font-semibold ${isExact ? 'text-green-600 dark:text-green-400' : isOver ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-400'}`}>
              <span>
                {isExact ? t('pos.payment.complete') : isOver ? t('pos.payment.excess') : t('pos.payment.remaining')}
              </span>
              <span className="tabular-nums">
                {isExact ? '\u2713' : `Bs. ${Math.abs(remaining).toFixed(2)}`}
                {!isExact && exchangeRate > 0 && (
                  <span className="text-xs ml-1 font-normal">($ {remainingUsd.toFixed(2)} USD)</span>
                )}
              </span>
            </div>
            {!isExact && (
              <div className="text-[10px] text-muted-foreground text-right">
                Total a cobrar: Bs. {collectTotal.toFixed(2)}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" size="lg" onClick={handleConfirm}>
            {t('pos.payment.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
