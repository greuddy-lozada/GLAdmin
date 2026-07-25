export type SyncEvent = 'sync-start' | 'sync-complete' | 'sync-error' | 'conflict-detected';
export type SyncListener = (payload?: unknown) => void;

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error';

export interface SyncConflict {
  id: string;
  table: string;
  recordId?: string;
  localData: unknown;
  serverData: unknown;
  localTimestamp: string;
  description: string;
  status: 'pending' | 'resolved_server' | 'resolved_local' | 'manual';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullResponse {
  data: {
    products: Array<{ id: string; name: string; price: number; dollarPrice?: number; baseCost?: number; margin: number; stock: number; idTax?: string; idBrand?: string; idCategory?: string; code?: string; updatedAt: string }>;
    customers: Array<{ id: string; firstName: string; lastName: string; idCardNumber: string; phoneNumber?: string; isWithholdingAgent?: boolean; withholdingPercentage?: number; withholdingProof?: string; updatedAt: string }>;
    exchangeRates: Array<{ id: string; rate: number; updatedAt: string }>;
    exchangeRateDays: Array<{ id: string; date: string; rateBcvUsd: number | null; rateParalelo: number | null; updatedAt: string }>;
    suppliers: Array<{ id: string; companyName: string; updatedAt: string }>;
    companies: Array<{ id: string; name: string; isWithholdingAgent?: boolean; withholdingPercentage?: number; updatedAt: string }>;
    taxes: Array<{ id: string; name: string; percentage: number; updatedAt: string }>;
    brands: Array<{ id: string; name: string; description?: string; updatedAt: string }>;
    categories: Array<{ id: string; name: string; description?: string; idParent?: string; updatedAt: string }>;
    cashRegisters?: Array<{ id: string; name: string; code: string; isActive: boolean; updatedAt: string }>;
    hasMore?: boolean;
    cursor: { lastPullAt: string };
  };
}

export interface PushMutation {
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId?: string;
  data: unknown;
  stockSnapshot?: Record<string, number>;
  localTimestamp: string;
}

export interface PushRequest {
  mutations: PushMutation[];
}

export interface PushResponse {
  data: {
    accepted: string[];
    conflicts: Array<{
      localTimestamp: string;
      recordId?: string;
      issue: string;
      description: string;
    }>;
    errors: Array<{
      localTimestamp: string;
      error: string;
    }>;
  };
}
