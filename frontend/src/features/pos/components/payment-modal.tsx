'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import { PaymentMethod } from '../models/pos.model';

interface PaymentModalProps {
  total: number;
  totalUsd: number;
  onPayment: (paymentMethod: number) => void;
}

export function PaymentModal({ total, totalUsd, onPayment }: PaymentModalProps) {
  const [open, setOpen] = useState(false);

  const handlePayment = (method: number) => {
    onPayment(method);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={total === 0}>
          Checkout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${total.toFixed(2)} VES</div>
            <div className="text-lg text-muted-foreground">${totalUsd.toFixed(2)} USD</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => handlePayment(1)}>Cash</Button>
            <Button onClick={() => handlePayment(2)}>Pago Movil</Button>
            <Button onClick={() => handlePayment(3)}>Transfer</Button>
            <Button onClick={() => handlePayment(4)}>Card</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
