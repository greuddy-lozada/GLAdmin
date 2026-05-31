'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { localDb } from '@/lib/sync/db';
import { useI18n } from '@/i18n';

interface PinSetupProps {
  userId: number;
  onComplete: () => void;
}

const PBKDF2_ITERATIONS = 100000;

async function hashPin(pin: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { hash: hashHex, salt: saltHex };
}

export function PinSetup({ userId, onComplete }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const { t } = useI18n();

  const handleSubmit = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError(t('auth.pin.errorInvalid'));
      return;
    }

    if (pin !== confirmPin) {
      setError(t('auth.pin.errorMismatch'));
      return;
    }

    const { hash, salt } = await hashPin(pin);

    await localDb.syncMetadata.put({
      key: `pin_${userId}`,
      value: JSON.stringify({ hash, salt, iterations: PBKDF2_ITERATIONS }),
    });

    onComplete();
  };

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('auth.pin.setupTitle')}</DialogTitle>
          <DialogDescription>{t('auth.pin.setupDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="password"
            inputMode="numeric"
            placeholder={t('auth.pin.enterPin')}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            autoFocus
          />
          <Input
            type="password"
            inputMode="numeric"
            placeholder={t('auth.pin.confirmPin')}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" onClick={handleSubmit} className="w-full">
            {t('auth.pin.saveButton')}
          </Button>
          <Button type="button" variant="ghost" onClick={onComplete} className="w-full">
            {t('auth.pin.skipButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
