'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localDb } from '@/lib/sync/db';

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

  const handleSubmit = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Set Up Offline PIN</h2>
      <p className="text-sm text-muted-foreground">
        Create a 4-6 digit PIN to access the app when offline.
      </p>
      <div className="space-y-2">
        <Input
          type="password"
          inputMode="numeric"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
        />
        <Input
          type="password"
          inputMode="numeric"
          placeholder="Confirm PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="button" onClick={handleSubmit} className="w-full">
        Save PIN
      </Button>
      <Button type="button" variant="ghost" onClick={onComplete} className="w-full">
        Skip for now
      </Button>
    </div>
  );
}
