'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/i18n';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  saleCode: string;
  itemCount: number;
  total: number;
  totalUsd: number;
}

export function ReceiptDialog({ open, onClose, saleCode, itemCount, total, totalUsd }: ReceiptDialogProps) {
  const { t, tp } = useI18n();

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <DialogTitle>{t('pos.receipt.title')}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground font-mono">{saleCode}</p>
          <p>{tp('pos.receipt.items', { count: String(itemCount) })}</p>
          <div className="text-lg font-bold">${total.toFixed(2)} VES</div>
          <div className="text-sm text-muted-foreground">${totalUsd.toFixed(2)} USD</div>
          <p className="text-xs text-muted-foreground">{t('pos.receipt.autoClose')}</p>
        </div>
        <Button onClick={onClose} className="w-full">{t('pos.receipt.close')}</Button>
      </DialogContent>
    </Dialog>
  );
}
