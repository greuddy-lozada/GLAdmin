'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { conflictResolver } from '@/lib/sync/conflict-resolver';
import type { SyncConflict } from '@/lib/sync/types';

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setLoading(true);
    const data = await conflictResolver.getConflicts();
    setConflicts(data);
    setLoading(false);
  };

  const handleResolve = async (id: number, status: 'resolved_server' | 'resolved_local') => {
    await conflictResolver.resolveConflict(id, status);
    await loadConflicts();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sync Conflicts</h1>
      {conflicts.length === 0 ? (
        <p className="text-muted-foreground">No conflicts</p>
      ) : (
        <div className="space-y-4">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="p-4 border rounded-lg space-y-2">
              <div className="font-medium">{conflict.description}</div>
              <div className="text-sm text-muted-foreground">
                Table: {conflict.table} | Status: {conflict.status}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResolve(conflict.id, 'resolved_server')}
                >
                  Accept Server
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolve(conflict.id, 'resolved_local')}
                >
                  Accept Local
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
