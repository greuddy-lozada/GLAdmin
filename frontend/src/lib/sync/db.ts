import Dexie, { type EntityTable } from 'dexie';

export interface LocalProduct {
  id: number;
  organizationId: number;
  name: string;
  price: number;
  priceUsd?: number;
  stock: number;
  taxId?: number;
  updatedAt: string;
}

export interface LocalCustomer {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  taxId?: string;
  phone?: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId?: number;
  data: unknown;
  stockSnapshot?: Record<number, number>;
  localTimestamp: string;
  retryCount: number;
  status: 'pending' | 'in-flight' | 'failed';
}

export interface StockCacheItem {
  productId: number;
  quantity: number;
  lastUpdated: string;
}

export interface LocalSale {
  id?: number;
  localId: string;
  data: unknown;
  syncedAt?: string;
  createdAt: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

export const localDb = new Dexie('GLAdmin') as Dexie & {
  products: EntityTable<LocalProduct, 'id'>;
  customers: EntityTable<LocalCustomer, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  stockCache: EntityTable<StockCacheItem, 'productId'>;
  sales: EntityTable<LocalSale, 'id'>;
  syncMetadata: EntityTable<SyncMetadata, 'key'>;
};

localDb.version(1).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
});
