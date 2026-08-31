'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMyActiveSession, useCloseRegister } from '@/features/cash-register/hooks/use-cash-register';
import { useI18n } from '@/i18n';
import { useOffline } from '@/lib/sync/hooks/use-offline';
import SettlementView from './settlement-view';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseRegisterDialog({ open, onClose, onSuccess }: Props) {
  const { data: session } = useMyActiveSession();
  const closeRegister = useCloseRegister();
  const { t, tp } = useI18n();
  const { isOnline } = useOffline();
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [settlement, setSettlement] = useState<{ expectedCash: number; countedCash: number; difference: number } | null>(null);

  const handleClose = () => {
    if (!session || !countedCash) return;
    closeRegister.mutate(
      { sessionId: session.id, countedCash: Number(countedCash), notes: notes || undefined },
      {
        onSuccess: (result) => {
          setSettlement(result.settlement);
        },
      },
    );
  };

  if (settlement) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <SettlementView settlement={settlement} session={session!} />
          <Button onClick={onSuccess} className="w-full mt-2">{t('common.close')}</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('registerSession.cerrar')}</DialogTitle>
          {session?.cashRegister && (
            <DialogDescription>
              {tp('registerSession.aperturaActiva', { name: session.cashRegister.name })} — {t('registerSession.openedAt')}: {new Date(session.openedAt).toLocaleString()}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('registerSession.countedCash')}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>{t('registerSession.notes')}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button onClick={handleClose} disabled={!countedCash || closeRegister.isPending || !isOnline} className="w-full">
            {t('registerSession.cerrar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
