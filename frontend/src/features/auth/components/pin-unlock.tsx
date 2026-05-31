'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localDb } from '@/lib/sync/db';

interface PinUnlockProps {
  userId: number;
  onUnlock: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

function getAttemptData(userId: number): { count: number; lockUntil: number } {
  try {
    const raw = localStorage.getItem(`pin_attempts_${userId}`);
    return raw ? JSON.parse(raw) : { count: 0, lockUntil: 0 };
  } catch {
    return { count: 0, lockUntil: 0 };
  }
}

function setAttemptData(userId: number, count: number, lockUntil: number) {
  localStorage.setItem(`pin_attempts_${userId}`, JSON.stringify({ count, lockUntil }));
}

async function verifyPin(pin: string, storedValue: string): Promise<boolean> {
  const { hash, salt, iterations } = JSON.parse(storedValue);
  const encoder = new TextEncoder();
  const saltBuffer = new Uint8Array(
    salt.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)),
  );
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuffer, iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hash === hashHex;
}

export function PinUnlock({ userId, onUnlock }: PinUnlockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const { lockUntil } = getAttemptData(userId);
    if (lockUntil > Date.now()) {
      setLocked(true);
      setRemainingSeconds(Math.ceil((lockUntil - Date.now()) / 1000));

      const timer = setInterval(() => {
        const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLocked(false);
          setRemainingSeconds(0);
          clearInterval(timer);
        } else {
          setRemainingSeconds(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [userId]);

  const handleSubmit = async () => {
    if (locked) return;

    const stored = await localDb.syncMetadata.get(`pin_${userId}`);
    if (!stored) {
      setError('PIN not set up');
      return;
    }

    const valid = await verifyPin(pin, stored.value);
    if (valid) {
      setAttemptData(userId, 0, 0);
      onUnlock();
    } else {
      const { count } = getAttemptData(userId);
      const newCount = count + 1;
      if (newCount >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_MS;
        setAttemptData(userId, newCount, lockUntil);
        setLocked(true);
        setRemainingSeconds(LOCKOUT_MS / 1000);
        setError(`Too many attempts. Try again in ${LOCKOUT_MS / 1000} seconds.`);
      } else {
        setAttemptData(userId, newCount, 0);
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newCount} attempts remaining.`);
      }
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
          inputMode="numeric"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          maxLength={6}
          disabled={locked}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {locked && remainingSeconds > 0 && (
          <p className="text-sm text-muted-foreground">
            Locked for {remainingSeconds}s
          </p>
        )}
      </div>
      <Button type="button" onClick={handleSubmit} className="w-full" disabled={locked}>
        Unlock
      </Button>
    </div>
  );
}
