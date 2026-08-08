'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Printer } from 'lucide-react';
import { useI18n } from '@/i18n';
import { localDb } from '@/lib/sync/db';
import type { CartItem, SalePayment } from '../models/pos.model';
import { PaymentMethod } from '../models/pos.model';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  code: string;
  items: CartItem[];
  total: number;
  totalUsd: number;
  customerName?: string;
  customerTaxId?: string;
  payments: SalePayment[];
  exchangeRate: number;
}

const METHOD_LABELS: Record<number, string> = {
  [PaymentMethod.Cash]: 'efectivo',
  [PaymentMethod.PagoMovil]: 'pago_movil',
  [PaymentMethod.Transfer]: 'transferencia',
  [PaymentMethod.Card]: 'tarjeta',
  [PaymentMethod.Mixed]: 'mixto',
  [PaymentMethod.Credit]: 'credito',
};

export function ReceiptDialog({ open, onClose, code, items, total, totalUsd, customerName, customerTaxId, payments, exchangeRate }: ReceiptDialogProps) {
  const { t } = useI18n();
  const [company, setCompany] = useState<{ name: string; rif?: string; phone?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    localDb.companies.orderBy('id').first().then(c => {
      if (c) setCompany({ name: c.companyName, phone: '' });
    }).catch(console.warn);

    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  const handlePrint = () => window.print();

  const totalTax = items.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const subtotal = total - totalTax;

  const receiptContent = (
    <div id="pos-receipt" className="space-y-3 text-sm">
      <div className="text-center pb-3 border-b border-border/50 border-dashed">
        <p className="text-lg font-bold">{company?.name ?? 'Cuadra'}</p>
        {company?.rif && <p className="text-xs text-muted-foreground">RIF: {company.rif}</p>}
        {company?.phone && <p className="text-xs text-muted-foreground">Tlf: {company.phone}</p>}
        <p className="text-base font-semibold mt-2">Recibo de venta #{code}</p>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleString('es-VE')}</p>
      </div>

      {customerName && (
        <div className="pb-2 border-b border-border/50 border-dashed">
          <p className="font-medium">Cliente: {customerName}</p>
          {customerTaxId && <p className="text-xs text-muted-foreground">RIF/C.I.: {customerTaxId}</p>}
        </div>
      )}

      <div className="pb-2 border-b border-border/50 border-dashed space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-xs">
            <span>{item.quantity}× {item.name}</span>
            <span className="tabular-nums font-medium">Bs. {item.subtotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">Bs. {subtotal.toFixed(2)}</span>
        </div>
        {totalTax > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>IVA</span>
            <span className="tabular-nums">Bs. {totalTax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-1 border-t border-border/50">
          <span>TOTAL</span>
          <span className="tabular-nums">Bs. {total.toFixed(2)}</span>
        </div>
        {totalUsd > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Total USD</span>
            <span className="tabular-nums">$ {totalUsd.toFixed(2)}</span>
          </div>
        )}
      </div>

      {payments.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50 border-dashed">
          {payments.map((p, i) => (
            <p key={i} className="flex justify-between">
              <span>{t(`pos.payment.${METHOD_LABELS[p.method] as 'cash'}`)} ({p.currency})</span>
              <span className="tabular-nums">{p.currency === 'USD' ? '$' : 'Bs.'} {p.amount.toFixed(2)}</span>
            </p>
          ))}
          {exchangeRate > 0 && (
            <p className="text-right">Tasa: Bs. {exchangeRate.toFixed(2)}/USD</p>
          )}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border/50 border-dashed">
        {t('pos.receipt.thanks')}
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm receipt-dialog">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-green-500 receipt-no-print" />
            <DialogTitle>{t('pos.receipt.title')}</DialogTitle>
          </div>
        </DialogHeader>

        {receiptContent}

        <div className="flex gap-2 receipt-no-print">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('pos.receipt.close')}
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            {t('pos.receipt.print')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
