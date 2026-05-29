import { localDb } from './db';
import { syncQueue } from './sync-queue';
import { networkStatus } from './network-status';
import type { SyncEvent, SyncListener, PullResponse, PushResponse } from './types';
import apiClient from '@/lib/api/api-client';

export class SyncEngine {
  private events: Map<SyncEvent, Set<SyncListener>> = new Map();
  private pullInterval?: ReturnType<typeof setInterval>;
  private pushInFlight = false;
  private pullInFlight = false;
  private _lastSyncAt?: string;
  private broadcastChannel?: BroadcastChannel;
  private isLeader = false;

  get lastSyncAt() {
    return this._lastSyncAt;
  }

  on(event: SyncEvent, listener: SyncListener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return () => {
      this.events.get(event)?.delete(listener);
    };
  }

  private emit(event: SyncEvent, payload?: unknown) {
    this.events.get(event)?.forEach(listener => listener(payload));
  }

  async pull(): Promise<void> {
    if (this.pullInFlight || !networkStatus.isOnline) return;

    this.pullInFlight = true;
    this.emit('sync-start');

    try {
      const metadata = await localDb.syncMetadata.get('lastPullAt');
      const since = metadata?.value;

      const response = await apiClient.get<PullResponse>('/sync/pull', {
        params: since ? { since } : undefined,
      });

      const { products, customers, exchangeRates, cursor } = response.data.data;

      for (const product of products) {
        await localDb.products.put({
          id: product.id,
          organizationId: 1,
          name: product.name,
          price: product.price,
          priceUsd: product.priceUsd,
          stock: product.stock,
          taxId: product.taxId,
          updatedAt: product.updatedAt,
        });
      }

      for (const customer of customers) {
        await localDb.customers.put({
          id: customer.id,
          organizationId: 1,
          firstName: customer.firstName,
          lastName: customer.lastName,
          taxId: customer.taxId,
          phone: customer.phone,
          updatedAt: customer.updatedAt,
        });
      }

      await localDb.syncMetadata.put({
        key: 'lastPullAt',
        value: cursor.lastPullAt,
      });

      this._lastSyncAt = cursor.lastPullAt;
      this.emit('sync-complete');
    } catch (error) {
      this.emit('sync-error', error);
    } finally {
      this.pullInFlight = false;
    }
  }

  async push(): Promise<void> {
    if (this.pushInFlight || !networkStatus.isOnline) return;

    const pending = await syncQueue.getPending();
    if (pending.length === 0) return;

    this.pushInFlight = true;
    this.emit('sync-start');

    try {
      const mutations = pending.map(item => ({
        operation: item.operation,
        table: item.table,
        recordId: item.recordId,
        data: item.data,
        stockSnapshot: item.stockSnapshot,
        localTimestamp: item.localTimestamp,
      }));

      const response = await apiClient.post<PushResponse>('/sync/push', {
        mutations,
      });

      const { accepted, conflicts, errors } = response.data.data;

      for (const id of accepted) {
        const item = pending.find(p => p.recordId === id);
        if (item?.id) {
          await syncQueue.markComplete(item.id);
        }
      }

      for (const conflict of conflicts) {
        const item = pending.find(p => p.localTimestamp === conflict.localTimestamp);
        if (item?.id) {
          await syncQueue.markFailed(item.id);
        }
      }

      for (const error of errors) {
        const item = pending.find(p => p.localTimestamp === error.localTimestamp);
        if (item?.id) {
          await syncQueue.markFailed(item.id);
        }
      }

      if (conflicts.length > 0) {
        this.emit('conflict-detected', conflicts);
      }

      this.emit('sync-complete');
    } catch (error) {
      this.emit('sync-error', error);
    } finally {
      this.pushInFlight = false;
    }
  }

  triggerPush(): void {
    setTimeout(() => this.push(), 2000);
  }

  start() {
    if (typeof window === 'undefined') return;

    this.broadcastChannel = new BroadcastChannel('gladmin-sync');

    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'leader-election' && event.data.tabId < this.getTabId()) {
        this.isLeader = false;
      }
    };

    this.broadcastChannel.postMessage({ type: 'leader-election', tabId: this.getTabId() });
    setTimeout(() => {
      this.isLeader = true;
    }, 1000);

    this.pullInterval = setInterval(() => {
      if (this.isLeader) {
        this.pull();
      }
    }, 30_000);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isLeader) {
        this.pull();
      }
    });

    window.addEventListener('beforeunload', (event) => {
      syncQueue.count().then(count => {
        if (count > 0) {
          event.preventDefault();
          event.returnValue = `You have ${count} pending changes that haven't been synced. Are you sure you want to leave?`;
        }
      });
    });

    if (this.isLeader) {
      this.pull();
    }
  }

  private getTabId(): number {
    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2);
      sessionStorage.setItem('tabId', tabId);
    }
    return parseInt(tabId, 36);
  }

  stop() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }

  async forceSync(): Promise<void> {
    await this.pull();
    await this.push();
  }
}

export const syncEngine = new SyncEngine();
