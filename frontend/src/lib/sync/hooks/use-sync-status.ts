import { useEffect, useState } from 'react';
import { syncEngine } from '../sync-engine';
import { useOffline } from './use-offline';
import type { SyncStatus } from '../types';

export function useSyncStatus() {
  const { isOnline, pendingCount, lastSyncAt, forceSync } = useOffline();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    const unsubscribeStart = syncEngine.on('sync-start', () => {
      setSyncStatus('syncing');
    });

    const unsubscribeComplete = syncEngine.on('sync-complete', () => {
      setSyncStatus('idle');
    });

    const unsubscribeError = syncEngine.on('sync-error', () => {
      setSyncStatus('error');
    });

    const unsubscribeConflict = syncEngine.on('conflict-detected', () => {
      setSyncStatus('conflict');
    });

    return () => {
      unsubscribeStart();
      unsubscribeComplete();
      unsubscribeError();
      unsubscribeConflict();
    };
  }, []);

  return {
    isOnline,
    pendingCount,
    lastSyncAt,
    syncStatus,
    forceSync,
  };
}
