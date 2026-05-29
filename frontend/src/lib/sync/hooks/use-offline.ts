import { useEffect, useState } from 'react';
import { networkStatus } from '../network-status';
import { syncQueue } from '../sync-queue';
import { syncEngine } from '../sync-engine';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = networkStatus.onStatusChange(setIsOnline);

    const updatePendingCount = async () => {
      const count = await syncQueue.count();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    const unsubscribeSync = syncEngine.on('sync-complete', () => {
      updatePendingCount();
      setLastSyncAt(syncEngine.lastSyncAt);
    });

    return () => {
      unsubscribe();
      clearInterval(interval);
      unsubscribeSync();
    };
  }, []);

  const forceSync = async () => {
    await syncEngine.forceSync();
  };

  return {
    isOnline,
    pendingCount,
    lastSyncAt,
    forceSync,
  };
}
