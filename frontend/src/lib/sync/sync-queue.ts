import { localDb, type SyncQueueItem } from './db';

export class SyncQueue {
  async enqueue(
    mutation: Omit<SyncQueueItem, 'id' | 'retryCount' | 'status'>
  ): Promise<number> {
    const id = await localDb.syncQueue.add({
      ...mutation,
      retryCount: 0,
      status: 'pending',
    });
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
  }

  async markFailed(id: number) {
    await localDb.syncQueue.update(id, { status: 'failed' });
  }

  async incrementRetry(id: number, retryCount: number) {
    await localDb.syncQueue.update(id, { retryCount });
  }

  async count(): Promise<number> {
    return localDb.syncQueue.where('status').equals('pending').count();
  }

  async clear() {
    await localDb.syncQueue.clear();
  }
}

export const syncQueue = new SyncQueue();
