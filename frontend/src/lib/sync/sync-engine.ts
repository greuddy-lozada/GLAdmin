import { localDb } from './db';
import { syncQueue, MAX_PUSH_RETRIES, getBackoffDelay } from './sync-queue';
import { networkStatus } from './network-status';
import type { SyncEvent, SyncListener, PullResponse, PushResponse } from './types';
import apiClient from '@/lib/api/api-client';

const ORG_STORAGE_KEY = 'currentOrgId';
const INITIAL_BACKOFF = 15000;
const MAX_BACKOFF = 30000;
const LEADER_HEARTBEAT_MS = 15_000;
const ELECTION_TIMEOUT_MS = 2000;

function getStoredOrgId(): string {
  const raw = localStorage.getItem(ORG_STORAGE_KEY);
  return raw || '';
}

export class SyncEngine {
  private events: Map<SyncEvent, Set<SyncListener>> = new Map();
  private heartbeatInterval?: ReturnType<typeof setInterval>;
  private pushInFlight = false;
  private pullInFlight = false;
  private retryCount = 0;
  private pullTimer?: ReturnType<typeof setTimeout>;
  private pushRetryTimer?: ReturnType<typeof setTimeout>;
  private _lastSyncAt?: string;
  private broadcastChannel?: BroadcastChannel;
  private isLeader = false;
  private electionTimer?: ReturnType<typeof setTimeout>;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private tabId = 0;
  private unsubNetwork?: () => void;
  private beforeUnloadHandler?: (event: BeforeUnloadEvent) => void;
  private visibilityHandler?: () => void;

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
    if (this.pullInFlight) return;

    if (!networkStatus.isOnline) {
      this.scheduleNext();
      return;
    }

    this.pullInFlight = true;
    this.emit('sync-start');

    try {
      const metadata = await localDb.syncMetadata.get('lastPullAt');
      const since = metadata?.value;
      const orgId = getStoredOrgId();

      const response = await apiClient.get<PullResponse>('/sync/pull', {
        params: since ? { since } : undefined,
      });

      const { products, customers, exchangeRates, exchangeRateDays, suppliers, companies, taxes, brands, categories, cashRegisters, hasMore, cursor } = response.data.data;

      for (const product of products) {
        await localDb.products.put({
          id: product.id,
          organizationId: orgId,
          name: product.name,
          price: product.price,
          priceUsd: product.dollarPrice ?? undefined,
          baseCost: product.baseCost ?? undefined,
          margin: product.margin ?? 20,
          stock: product.stock,
          taxId: product.idTax ?? undefined,
          code: product.code,
          brandId: product.idBrand ?? undefined,
          categoryId: product.idCategory ?? undefined,
          updatedAt: product.updatedAt,
        });
      }

      for (const customer of customers) {
        await localDb.customers.put({
          id: customer.id,
          organizationId: orgId,
          firstName: customer.firstName,
          lastName: customer.lastName,
          taxId: customer.idCardNumber,
          phone: customer.phoneNumber,
          isWithholdingAgent: customer.isWithholdingAgent ?? false,
          withholdingPercentage: customer.withholdingPercentage ?? undefined,
          withholdingProof: customer.withholdingProof ?? undefined,
          updatedAt: customer.updatedAt,
        });
      }

      for (const supplier of suppliers) {
        await localDb.suppliers.put({
          id: supplier.id,
          organizationId: orgId,
          companyName: supplier.companyName,
          updatedAt: supplier.updatedAt,
        });
      }

      for (const company of companies) {
        await localDb.companies.put({
          id: company.id,
          organizationId: orgId,
          companyName: company.name,
          isWithholdingAgent: company.isWithholdingAgent ?? false,
          withholdingPercentage: company.withholdingPercentage ?? undefined,
          updatedAt: company.updatedAt,
        });
      }

      for (const tax of taxes) {
        await localDb.taxes.put({
          id: tax.id,
          organizationId: orgId,
          name: tax.name,
          percentage: tax.percentage,
          updatedAt: tax.updatedAt,
        });
      }

      for (const brand of brands) {
        await localDb.brands.put({
          id: brand.id,
          organizationId: orgId,
          name: brand.name,
          description: brand.description,
          updatedAt: brand.updatedAt,
        });
      }

      for (const category of categories) {
        await localDb.categories.put({
          id: category.id,
          organizationId: orgId,
          name: category.name,
          description: category.description,
          idParent: category.idParent,
          updatedAt: category.updatedAt,
        });
      }

      if (cashRegisters) {
        for (const cr of cashRegisters) {
          await localDb.cashRegisters.put({
            id: cr.id,
            organizationId: orgId,
            name: cr.name,
            code: cr.code,
            isActive: cr.isActive,
            updatedAt: cr.updatedAt,
          });
        }
      }

      for (const rate of exchangeRates) {
        await localDb.exchangeRates.put({
          id: rate.id,
          rate: rate.rate,
          updatedAt: rate.updatedAt,
        });
      }

      for (const day of exchangeRateDays) {
        await localDb.exchangeRateDays.put({
          id: day.id,
          date: day.date,
          rateBcvUsd: day.rateBcvUsd,
          rateParalelo: day.rateParalelo,
          updatedAt: day.updatedAt,
        });
      }

      await localDb.syncMetadata.put({
        key: 'lastPullAt',
        value: cursor.lastPullAt,
      });

      this._lastSyncAt = cursor.lastPullAt;
      this.retryCount = 0;

      // Immediately pull next chunk if data was truncated
      if (hasMore) {
        this.pullInFlight = false;
        this.pull();
        return;
      }

      this.emit('sync-complete');
    } catch (error) {
      this.retryCount++;
      this.emit('sync-error', error);
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED')
      ) {
        networkStatus.setOnline(false);
      }
    } finally {
      this.pullInFlight = false;
      this.scheduleNext();
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

      for (let i = 0; i < accepted.length; i++) {
        const item = pending[i];
        if (item?.id !== undefined) {
          await syncQueue.markComplete(item.id);
        }
      }

      for (const conflict of conflicts) {
        const item = pending.find(p => p.localTimestamp === conflict.localTimestamp);
        if (item?.id !== undefined) {
          await syncQueue.markFailed(item.id);
        }
      }

      for (const error of errors) {
        const item = pending.find(p => p.localTimestamp === error.localTimestamp);
        if (item?.id !== undefined) {
          await syncQueue.markFailed(item.id);
        }
      }

      if (conflicts.length > 0) {
        this.emit('conflict-detected', conflicts);
      }

      this.emit('sync-complete');
    } catch (error) {
      let maxRetry = 0;
      for (const item of pending) {
        const newCount = item.retryCount + 1;
        if (newCount > MAX_PUSH_RETRIES) {
          await syncQueue.markFailed(item.id!);
        } else {
          await syncQueue.incrementRetry(item.id!, newCount);
          maxRetry = Math.max(maxRetry, newCount);
        }
      }
      if (maxRetry > 0) {
        this.schedulePushRetry(getBackoffDelay(maxRetry, INITIAL_BACKOFF, MAX_BACKOFF));
      }
      this.emit('sync-error', error);
    } finally {
      this.pushInFlight = false;
    }
  }

  private schedulePushRetry(delay: number) {
    if (this.pushRetryTimer) clearTimeout(this.pushRetryTimer);
    this.pushRetryTimer = setTimeout(() => this.push(), delay);
  }

  private scheduleNext() {
    if (this.pullTimer) clearTimeout(this.pullTimer);
    const delay = this.retryCount === 0
      ? INITIAL_BACKOFF
      : Math.min(INITIAL_BACKOFF * Math.pow(2, this.retryCount), MAX_BACKOFF);
    const jitter = delay * (0.8 + Math.random() * 0.4);
    this.pullTimer = setTimeout(() => this.pull(), jitter);
  }

  triggerPush(): void {
    setTimeout(() => this.push(), 2000);
  }

  start() {
    if (typeof window === 'undefined') return;

    if (this.broadcastChannel) return;

    this.tabId = this.generateTabId();
    this.broadcastChannel = new BroadcastChannel('cuadra-sync');

    this.broadcastChannel.onmessage = (event) => {
      const { type, tabId } = event.data;

      if (type === 'election-probe' && this.isLeader) {
        this.broadcastChannel!.postMessage({ type: 'leader-heartbeat', tabId: this.tabId });
        return;
      }

      if (type === 'leader-heartbeat' && tabId < this.tabId) {
        this.isLeader = false;
        if (this.electionTimer) {
          clearTimeout(this.electionTimer);
          this.electionTimer = undefined;
        }
      }
    };

    this.broadcastChannel.postMessage({ type: 'election-probe', tabId: this.tabId });

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.isLeader) {
        void this.pull();
        void this.push();
      }
    };

    this.electionTimer = setTimeout(() => {
      this.isLeader = true;

      this.heartbeatInterval = setInterval(() => {
        if (this.isLeader && this.broadcastChannel) {
          this.broadcastChannel.postMessage({ type: 'leader-heartbeat', tabId: this.tabId });
        }
      }, LEADER_HEARTBEAT_MS);

      document.addEventListener('visibilitychange', this.visibilityHandler!);

      void this.pull();
      void this.push();

      // Periodic cleanup of old IndexedDB data (every 24h)
      this.cleanupTimer = setInterval(() => this.cleanupLocalDb(), 24 * 60 * 60 * 1000);
    }, ELECTION_TIMEOUT_MS);

    this.unsubNetwork = networkStatus.onStatusChange((online) => {
      if (online && this.isLeader) {
        void this.forceSync();
      }
    });

    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (syncQueue.hasPendingSync) {
        event.preventDefault();
        event.returnValue = 'You have pending changes that have not been synced. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private async cleanupLocalDb(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await localDb.sales.filter(s => s.createdAt < cutoff).delete();
      await localDb.parkedOrders.filter(o => o.createdAt < cutoff).delete();
      await localDb.syncQueue.where('status').equals('failed').delete();
    } catch {
      // Best-effort cleanup, ignore errors
    }
  }

  private generateTabId(): number {
    let raw = sessionStorage.getItem('tabId');
    if (!raw) {
      raw = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('tabId', raw);
    }
    return parseInt(raw, 36);
  }

  stop() {
    if (this.pullTimer) {
      clearTimeout(this.pullTimer);
      this.pullTimer = undefined;
    }
    if (this.pushRetryTimer) {
      clearTimeout(this.pushRetryTimer);
      this.pushRetryTimer = undefined;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    if (this.electionTimer) {
      clearTimeout(this.electionTimer);
      this.electionTimer = undefined;
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = undefined;
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    if (this.unsubNetwork) {
      this.unsubNetwork();
      this.unsubNetwork = undefined;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = undefined;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = undefined;
    }
    this.isLeader = false;
  }

  async forceSync(): Promise<void> {
    await this.pull();
    await this.push();
  }

  async clearLocalData(): Promise<void> {
    await localDb.products.clear();
    await localDb.customers.clear();
    await localDb.syncQueue.clear();
    await localDb.stockCache.clear();
    await localDb.sales.clear();
    await localDb.syncMetadata.clear();
    await localDb.suppliers.clear();
    await localDb.companies.clear();
    await localDb.taxes.clear();
    await localDb.brands.clear();
    await localDb.categories.clear();
  }

  async onOrgSwitch(): Promise<void> {
    await this.push();
    await this.clearLocalData();
    this._lastSyncAt = undefined;
    await this.pull();
  }
}

export const syncEngine = new SyncEngine();
