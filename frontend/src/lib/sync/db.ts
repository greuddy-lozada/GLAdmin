import Dexie, { type EntityTable } from 'dexie';

export interface LocalProduct {
  id: number;
  organizationId: number;
  name: string;
  price: number;
  priceUsd?: number;
  stock: number;
  taxId?: number;
  code?: string;
  updatedAt: string;
}

export interface LocalCustomer {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  taxId?: string;
  phone?: string;
  isWithholdingAgent: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
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

export interface LocalSupplier {
  id: number;
  organizationId: number;
  companyName: string;
  updatedAt: string;
}

export interface LocalCompany {
  id: number;
  organizationId: number;
  companyName: string;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
  updatedAt: string;
}

export interface LocalTax {
  id: number;
  organizationId: number;
  name: string;
  percentage: number;
  updatedAt: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

export interface LocalExchangeRate {
  id: number;
  rate: number;
  updatedAt: string;
}

export interface LocalExchangeRateDay {
  id: number;
  date: string;
  rateBcvUsd: number | null;
  rateParalelo: number | null;
  updatedAt: string;
}

export interface ParkedOrder {
  id?: number;
  label: string;
  cartItems: Array<{ productId: number; name: string; quantity: number; unitPrice: number; unitPriceUsd: number; subtotal: number; subtotalUsd: number }>;
  customerId?: number;
  customerName?: string;
  total: number;
  totalUsd: number;
  totalTax: number;
  totalTaxUsd: number;
  createdAt: string;
}

export interface ShortcutBinding {
  id?: number;
  shortcutId: string;
  keys: string;
  updatedAt: string;
}

export const localDb = new Dexie('GLAdmin') as Dexie & {
  products: EntityTable<LocalProduct, 'id'>;
  customers: EntityTable<LocalCustomer, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  stockCache: EntityTable<StockCacheItem, 'productId'>;
  sales: EntityTable<LocalSale, 'id'>;
  syncMetadata: EntityTable<SyncMetadata, 'key'>;
  suppliers: EntityTable<LocalSupplier, 'id'>;
  companies: EntityTable<LocalCompany, 'id'>;
  taxes: EntityTable<LocalTax, 'id'>;
  exchangeRates: EntityTable<LocalExchangeRate, 'id'>;
  exchangeRateDays: EntityTable<LocalExchangeRateDay, 'id'>;
  parkedOrders: EntityTable<ParkedOrder, 'id'>;
  shortcutBindings: EntityTable<ShortcutBinding, 'id'>;
};

localDb.version(1).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
});

localDb.version(2).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
});

localDb.version(3).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
});

localDb.version(4).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
});

localDb.version(5).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id, shortcutId',
});

localDb.version(6).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  exchangeRateDays: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id, shortcutId',
});
