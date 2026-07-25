import Dexie, { type EntityTable } from 'dexie';

export interface LocalProduct {
  id: string;
  organizationId: string;
  name: string;
  price: number;
  priceUsd?: number;
  baseCost?: number;
  margin: number;
  stock: number;
  taxId?: string;
  code?: string;
  brandId?: string;
  categoryId?: string;
  updatedAt: string;
}

export interface LocalCustomer {
  id: string;
  organizationId: string;
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
  recordId?: string;
  data: unknown;
  stockSnapshot?: Record<string, number>;
  localTimestamp: string;
  retryCount: number;
  status: 'pending' | 'in-flight' | 'failed';
}

export interface StockCacheItem {
  productId: string;
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
  id: string;
  organizationId: string;
  companyName: string;
  updatedAt: string;
}

export interface LocalCompany {
  id: string;
  organizationId: string;
  companyName: string;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
  updatedAt: string;
}

export interface LocalTax {
  id: string;
  organizationId: string;
  name: string;
  percentage: number;
  updatedAt: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

export interface LocalBrand {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  updatedAt: string;
}

export interface LocalCashRegister {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isActive: boolean;
  updatedAt: string;
}

export interface LocalCategory {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  idParent?: string;
  updatedAt: string;
}

export interface LocalExchangeRate {
  id: string;
  rate: number;
  updatedAt: string;
}

export interface LocalExchangeRateDay {
  id: string;
  date: string;
  rateBcvUsd: number | null;
  rateParalelo: number | null;
  updatedAt: string;
}

export interface ParkedOrder {
  id?: number;
  label: string;
  cartItems: Array<{ productId: string; name: string; quantity: number; unitPrice: number; unitPriceUsd: number; subtotal: number; subtotalUsd: number }>;
  customerId?: string;
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

export const localDb = new Dexie('Cuadra') as Dexie & {
  products: EntityTable<LocalProduct, 'id'>;
  customers: EntityTable<LocalCustomer, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  stockCache: EntityTable<StockCacheItem, 'productId'>;
  sales: EntityTable<LocalSale, 'id'>;
  syncMetadata: EntityTable<SyncMetadata, 'key'>;
  suppliers: EntityTable<LocalSupplier, 'id'>;
  companies: EntityTable<LocalCompany, 'id'>;
  taxes: EntityTable<LocalTax, 'id'>;
  brands: EntityTable<LocalBrand, 'id'>;
  categories: EntityTable<LocalCategory, 'id'>;
  cashRegisters: EntityTable<LocalCashRegister, 'id'>;
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

localDb.version(7).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  brands: 'id, updatedAt, organizationId',
  categories: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  exchangeRateDays: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id, shortcutId',
});

localDb.version(8).stores({
  products: 'id, updatedAt, organizationId, name, code',
  customers: 'id, updatedAt, organizationId, firstName, lastName, taxId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  brands: 'id, updatedAt, organizationId',
  categories: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  exchangeRateDays: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id, shortcutId',
});

localDb.version(9).stores({
  products: 'id, updatedAt, organizationId, name, code',
  customers: 'id, updatedAt, organizationId, firstName, lastName, taxId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  brands: 'id, updatedAt, organizationId',
  categories: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  exchangeRateDays: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id, shortcutId',
});

localDb.version(10).stores({
  products: 'id, updatedAt, organizationId, name, code',
  customers: 'id, updatedAt, organizationId, firstName, lastName, taxId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  brands: 'id, updatedAt, organizationId',
  categories: 'id, updatedAt, organizationId',
  cashRegisters: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  exchangeRateDays: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id, shortcutId',
}).upgrade(async (tx) => {
  await tx.table('products').clear();
  await tx.table('customers').clear();
  await tx.table('syncQueue').clear();
  await tx.table('stockCache').clear();
  await tx.table('sales').clear();
  await tx.table('syncMetadata').clear();
  await tx.table('suppliers').clear();
  await tx.table('companies').clear();
  await tx.table('taxes').clear();
  await tx.table('brands').clear();
  await tx.table('categories').clear();
  await tx.table('exchangeRates').clear();
  await tx.table('exchangeRateDays').clear();
  await tx.table('parkedOrders').clear();
});
