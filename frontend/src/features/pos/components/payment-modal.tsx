'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import { PaymentMethod } from '../models/pos.model';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  totalUsd: number;
  withholdingAmount?: number;
  withholdingAmountUsd?: number;
  netToCollect?: number;
  netToCollectUsd?: number;
  onPayment: (paymentMethod: PaymentMethod) => void;
}

export function PaymentModal({ open, onOpenChange, total, totalUsd, withholdingAmount, withholdingAmountUsd, netToCollect, netToCollectUsd, onPayment }: PaymentModalProps) {
  const { t } = useI18n();
  const hasWithholding = (withholdingAmount ?? 0) > 0;

  const handlePayment = (method: PaymentMethod) => {
    onPayment(method);
    onOpenChange(false);
  };

  const paymentMethods = [
    { value: PaymentMethod.Cash, label: t('pos.payment.cash') },
    { value: PaymentMethod.PagoMovil, label: t('pos.payment.pagoMovil') },
    { value: PaymentMethod.Transfer, label: t('pos.payment.transfer') },
    { value: PaymentMethod.Card, label: t('pos.payment.card') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('pos.payment.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${(hasWithholding ? (netToCollect ?? total) : total).toFixed(2)} VES</div>
            <div className="text-lg text-muted-foreground">${(hasWithholding ? (netToCollectUsd ?? totalUsd) : totalUsd).toFixed(2)} USD</div>
            {hasWithholding && (
              <div className="text-xs text-muted-foreground mt-1">
                {t('pos.withholding.invoiceTotal')}: ${total.toFixed(2)} VES
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {paymentMethods.map(pm => (
              <Button key={pm.value} onClick={() => handlePayment(pm.value)}>
                {pm.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
