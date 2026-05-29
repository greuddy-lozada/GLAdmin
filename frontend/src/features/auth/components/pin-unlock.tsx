'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localDb } from '@/lib/sync/db';

interface PinUnlockProps {
  userId: number;
  onUnlock: () => void;
}

export function PinUnlock({ userId, onUnlock }: PinUnlockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const stored = await localDb.syncMetadata.get(`pin_${userId}`);
    if (!stored) {
      setError('PIN not set up');
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === stored.value) {
      onUnlock();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Enter PIN</h2>
      <p className="text-sm text-muted-foreground">
        Enter your PIN to access the app offline.
      </p>
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={6}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Unlock
      </Button>
    </div>
  );
}
