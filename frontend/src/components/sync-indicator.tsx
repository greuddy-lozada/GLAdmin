'use client';

import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/lib/sync/hooks/use-sync-status';
import { useI18n } from '@/i18n';

export function SyncIndicator() {
  const { isOnline, pendingCount, syncStatus } = useSyncStatus();
  const { t } = useI18n();

  if (!isOnline) {
    return <Badge variant="destructive">{t('sync.offline')}</Badge>;
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
