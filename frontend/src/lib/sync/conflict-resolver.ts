import type { SyncConflict } from './types';
import apiClient from '@/lib/api/api-client';

export class ConflictResolver {
  async getConflicts(): Promise<SyncConflict[]> {
    const response = await apiClient.get<{ data: SyncConflict[] }>('/sync/conflicts');
    return response.data.data;
  }

  async resolveConflict(
    id: string,
    status: 'resolved_server' | 'resolved_local' | 'manual',
    manualData?: Record<string, unknown>,
  ): Promise<void> {
    await apiClient.patch(`/sync/conflicts/${id}/resolve`, {
      status,
      manualData,
    });
  }
}

export const conflictResolver = new ConflictResolver();
