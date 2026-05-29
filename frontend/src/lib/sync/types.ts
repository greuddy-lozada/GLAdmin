export type SyncEvent = 'sync-start' | 'sync-complete' | 'sync-error' | 'conflict-detected';
export type SyncListener = (payload?: unknown) => void;

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error';

export interface SyncConflict {
  id: number;
  table: string;
  recordId?: number;
  localData: unknown;
  serverData: unknown;
  localTimestamp: string;
  description: string;
  status: 'pending' | 'resolved_server' | 'resolved_local' | 'manual';
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullResponse {
  data: {
    products: Array<{ id: number; name: string; price: number; priceUsd?: number; stock: number; taxId?: number; updatedAt: string }>;
    customers: Array<{ id: number; firstName: string; lastName: string; taxId?: string; phone?: string; updatedAt: string }>;
    exchangeRates: Array<{ id: number; rate: number; updatedAt: string }>;
    cursor: { lastPullAt: string };
  };
}

export interface PushMutation {
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId?: number;
  data: unknown;
  stockSnapshot?: Record<number, number>;
  localTimestamp: string;
}

export interface PushRequest {
  mutations: PushMutation[];
}

export interface PushResponse {
  data: {
    accepted: number[];
    conflicts: Array<{
      localTimestamp: string;
      recordId?: number;
      issue: string;
      description: string;
    }>;
    errors: Array<{
      localTimestamp: string;
      error: string;
    }>;
  };
}
