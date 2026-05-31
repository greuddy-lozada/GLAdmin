import { localDb, type SyncQueueItem } from './db';

export const MAX_PUSH_RETRIES = 5;

export function getBackoffDelay(retryCount: number, initial: number, max: number): number {
  const delay = Math.min(initial * Math.pow(2, retryCount), max);
  return delay * (0.8 + Math.random() * 0.4);
}

export class SyncQueue {
  private _pendingSync = 0;

  get hasPendingSync() {
    return this._pendingSync > 0;
  }

  async enqueue(
    mutation: Omit<SyncQueueItem, 'id' | 'retryCount' | 'status'>
  ): Promise<number> {
    const id = await localDb.syncQueue.add({
      ...mutation,
      retryCount: 0,
      status: 'pending',
    });
    this._pendingSync++;
    return id!;
  }

  async getPending(): Promise<SyncQueueItem[]> {
    return localDb.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('localTimestamp');
  }

  async getFailed(): Promise<SyncQueueItem[]> {
    return localDb.syncQueue
      .where('status')
      .equals('failed')
      .sortBy('localTimestamp');
  }

  async markComplete(id: number) {
    await localDb.syncQueue.delete(id);
    this._pendingSync = Math.max(0, this._pendingSync - 1);
  }

  async markFailed(id: number) {
    await localDb.syncQueue.update(id, { status: 'failed' });
    this._pendingSync = Math.max(0, this._pendingSync - 1);
  }

  async incrementRetry(id: number, retryCount: number) {
    await localDb.syncQueue.update(id, { retryCount });
  }

  async count(): Promise<number> {
    return localDb.syncQueue.where('status').equals('pending').count();
  }

  async clear() {
    await localDb.syncQueue.clear();
    this._pendingSync = 0;
  }
}

export const syncQueue = new SyncQueue();
