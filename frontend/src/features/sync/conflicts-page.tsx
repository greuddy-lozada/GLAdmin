'use client';

import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n';
import { conflictResolver } from '@/lib/sync/conflict-resolver';
import type { SyncConflict } from '@/lib/sync/types';

export default function ConflictsPage() {
  const { t } = useI18n();
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConflicts = async () => {
    setLoading(true);
    const data = await conflictResolver.getConflicts();
    setConflicts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const handleResolve = async (id: string, status: 'resolved_server' | 'resolved_local') => {
    await conflictResolver.resolveConflict(id, status);
    await loadConflicts();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">{t('common.loading')}</p></div>}>
      {conflicts.length === 0 ? (
        <p className="text-muted-foreground">{t('sync.noConflicts')}</p>
      ) : (
        <div className="space-y-4">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="p-4 border rounded-lg space-y-2">
              <div className="font-medium">{conflict.description}</div>
              <div className="text-sm text-muted-foreground">
                {t('sync.table')} {conflict.table} | {t('sync.status')} {conflict.status}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResolve(conflict.id, 'resolved_server')}
                >
                  {t('sync.acceptServer')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolve(conflict.id, 'resolved_local')}
                >
                  {t('sync.acceptLocal')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      </Suspense>
    </div>
  );
}
