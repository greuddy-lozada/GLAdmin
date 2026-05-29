'use client';

import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/lib/sync/hooks/use-sync-status';

export function SyncIndicator() {
  const { isOnline, pendingCount, syncStatus } = useSyncStatus();

  if (!isOnline) {
    return <Badge variant="destructive">Offline</Badge>;
  }

  if (syncStatus === 'syncing') {
    return <Badge variant="secondary">Syncing...</Badge>;
  }

  if (pendingCount > 0) {
    return <Badge>{pendingCount} pending</Badge>;
  }

  if (syncStatus === 'conflict') {
    return <Badge variant="warning">Conflicts</Badge>;
  }

  return <Badge variant="outline">Synced</Badge>;
}
