'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localDb } from '@/lib/sync/db';

interface PinSetupProps {
  userId: number;
  onComplete: () => void;
}

export function PinSetup({ userId, onComplete }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    await localDb.syncMetadata.put({
      key: `pin_${userId}`,
      value: hashHex,
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
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={6}
        />
        <Input
          type="password"
          placeholder="Confirm PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          maxLength={6}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Save PIN
      </Button>
    </div>
  );
}
