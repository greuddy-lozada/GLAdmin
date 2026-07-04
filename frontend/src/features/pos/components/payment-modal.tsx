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
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
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

          <div className="text-xs text-muted-foreground">
            Total: Bs. {vesNum.toFixed(2)} + USD ${usdNum.toFixed(2)} × {exchangeRate.toFixed(2)} = Bs. {(vesNum + usdNum * exchangeRate).toFixed(2)}
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
