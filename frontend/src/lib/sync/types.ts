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
    products: Array<{ id: number; name: string; price: number; dollarPrice?: number; baseCost?: number; margin: number; stock: number; idTax?: number; idBrand?: number; idCategory?: number; code?: string; updatedAt: string }>;
    customers: Array<{ id: number; firstName: string; lastName: string; idCardNumber: string; phoneNumber?: string; isWithholdingAgent?: boolean; withholdingPercentage?: number; withholdingProof?: string; updatedAt: string }>;
    exchangeRates: Array<{ id: number; rate: number; updatedAt: string }>;
    exchangeRateDays: Array<{ id: number; date: string; rateBcvUsd: number | null; rateParalelo: number | null; updatedAt: string }>;
    suppliers: Array<{ id: number; companyName: string; updatedAt: string }>;
    companies: Array<{ id: number; name: string; isWithholdingAgent?: boolean; withholdingPercentage?: number; updatedAt: string }>;
    taxes: Array<{ id: number; name: string; percentage: number; updatedAt: string }>;
    brands: Array<{ id: number; name: string; description?: string; updatedAt: string }>;
    categories: Array<{ id: number; name: string; description?: string; idParent?: number; updatedAt: string }>;
    hasMore?: boolean;
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
