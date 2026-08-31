'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCashRegisters, useOpenRegister } from '@/features/cash-register/hooks/use-cash-register';
import { useI18n } from '@/i18n';
import { useOffline } from '@/lib/sync/hooks/use-offline';

interface Props {
  open: boolean;
  onSuccess: () => void;
}

export default function RegisterSelector({ open, onSuccess }: Props) {
  const { items: cashRegisters } = useCashRegisters();
  const openRegister = useOpenRegister();
  const { t } = useI18n();
  const { isOnline } = useOffline();
  const [selectedRegisterId, setSelectedRegisterId] = useState('');
  const [initialCashBs, setInitialCashBs] = useState('');
  const [initialCashUsd, setInitialCashUsd] = useState('');

  const activeRegisters = cashRegisters.filter((c) => c.isActive);
  const canOpen = !!selectedRegisterId;

  const handleOpen = () => {
    if (!selectedRegisterId) return;
    openRegister.mutate(
      { cashRegisterId: selectedRegisterId, initialCash: Number(initialCashBs) || 0, initialCashUsd: Number(initialCashUsd) || 0 },
      { onSuccess },
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('registerSession.selectCaja')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('registerSession.selectCaja')}</Label>
            <div className="grid gap-2">
              {activeRegisters.map((cr) => (
                <Button
                  key={cr.id}
                  variant={selectedRegisterId === cr.id ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedRegisterId(cr.id)}
                >
                  {cr.name} ({cr.code})
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('registerSession.initialCash')} (Bs.)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={initialCashBs}
                onChange={(e) => setInitialCashBs(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>{t('registerSession.initialCash')} (USD)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={initialCashUsd}
                onChange={(e) => setInitialCashUsd(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleOpen} disabled={!canOpen || openRegister.isPending || !isOnline} className="w-full">
            {openRegister.isPending ? t('common.loading') : !isOnline ? t('sync.posNavLocked') : t('registerSession.abrir')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
