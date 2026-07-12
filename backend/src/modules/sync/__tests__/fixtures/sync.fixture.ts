export const MOCK_ORG_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export interface ProductOverrides {
  id?: string;
  name?: string;
  code?: string;
  price?: number;
  dollarPrice?: number | null;
  baseCost?: number | null;
  margin?: number;
  idTax?: string | null;
  idBrand?: string | null;
  idCategory?: string | null;
  updatedAt?: Date;
  stockExistence?: number;
}

export function createProductRow(overrides: ProductOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000001',
    name: overrides.name ?? 'Test Product',
    code: overrides.code ?? 'TEST-001',
    price: overrides.price ?? 100,
    dollarPrice: overrides.dollarPrice ?? null,
    baseCost: overrides.baseCost ?? null,
    margin: overrides.margin ?? 0.3,
    idTax: overrides.idTax ?? null,
    idBrand: overrides.idBrand ?? null,
    idCategory: overrides.idCategory ?? null,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
    stocks: [{ existence: overrides.stockExistence ?? 10 }],
  };
}

export interface CustomerOverrides {
  id?: string;
  firstName?: string;
  lastName?: string;
  idCardNumber?: string;
  phoneNumber?: string;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
  withholdingProof?: string;
  updatedAt?: Date;
}

export function createCustomerRow(overrides: CustomerOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000101',
    firstName: overrides.firstName ?? 'John',
    lastName: overrides.lastName ?? 'Doe',
    idCardNumber: overrides.idCardNumber ?? 'V-12345678',
    phoneNumber: overrides.phoneNumber ?? '+584141234567',
    isWithholdingAgent: overrides.isWithholdingAgent ?? false,
    withholdingPercentage: overrides.withholdingPercentage ?? 0,
    withholdingProof: overrides.withholdingProof ?? null,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface ExchangeRateOverrides {
  id?: string;
  rate?: number;
  updatedAt?: Date;
}

export function createExchangeRateRow(overrides: ExchangeRateOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000201',
    rate: overrides.rate ?? 35.5,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface ExchangeRateDayOverrides {
  id?: string;
  date?: Date;
  rateBcvUsd?: number;
  rateParalelo?: number;
  updatedAt?: Date;
}

export function createExchangeRateDayRow(
  overrides: ExchangeRateDayOverrides = {},
) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000301',
    date: overrides.date ?? new Date('2025-01-01'),
    rateBcvUsd: overrides.rateBcvUsd ?? 36.0,
    rateParalelo: overrides.rateParalelo ?? 42.0,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface SupplierOverrides {
  id?: string;
  companyName?: string;
  updatedAt?: Date;
}

export function createSupplierRow(overrides: SupplierOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000401',
    companyName: overrides.companyName ?? 'Test Supplier Inc.',
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface CompanyOverrides {
  id?: string;
  name?: string;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
  updatedAt?: Date;
}

export function createCompanyRow(overrides: CompanyOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000501',
    name: overrides.name ?? 'Test Company S.A.',
    isWithholdingAgent: overrides.isWithholdingAgent ?? false,
    withholdingPercentage: overrides.withholdingPercentage ?? 0,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface TaxOverrides {
  id?: string;
  name?: string;
  percentage?: number;
  updatedAt?: Date;
}

export function createTaxRow(overrides: TaxOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000601',
    name: overrides.name ?? 'IVA',
    percentage: overrides.percentage ?? 16,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface BrandOverrides {
  id?: string;
  name?: string;
  description?: string;
  updatedAt?: Date;
}

export function createBrandRow(overrides: BrandOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000701',
    name: overrides.name ?? 'Test Brand',
    description: overrides.description ?? 'A test brand',
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface CategoryOverrides {
  id?: string;
  name?: string;
  description?: string;
  idParent?: string | null;
  updatedAt?: Date;
}

export function createCategoryRow(overrides: CategoryOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000801',
    name: overrides.name ?? 'Test Category',
    description: overrides.description ?? 'A test category',
    idParent: overrides.idParent ?? null,
    updatedAt: overrides.updatedAt ?? new Date('2025-01-01'),
  };
}

export interface PushMutationOverrides {
  operation?: 'create' | 'update' | 'delete';
  table?: string;
  recordId?: string;
  data?: Record<string, unknown>;
  localTimestamp?: string;
}

export function createPushMutation(overrides: PushMutationOverrides = {}) {
  return {
    operation: overrides.operation ?? 'update',
    table: overrides.table ?? 'products',
    recordId: overrides.recordId ?? '00000000-0000-0000-0000-000000000001',
    data: overrides.data ?? { name: 'Updated Product' },
    localTimestamp:
      overrides.localTimestamp ?? new Date('2025-06-01').toISOString(),
  };
}

export function createSalePushMutation(
  overrides: {
    recordId?: string;
    localTimestamp?: string;
    items?: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      unitPriceUsd: number;
      subtotal: number;
      subtotalUsd: number;
    }>;
    code?: string;
    date?: string;
    amount?: number;
    amountUsd?: number;
    exchangeRate?: number;
    paymentMethod?: number;
    status?: number;
    idCustomer?: string;
  } = {},
) {
  return {
    operation: 'create' as const,
    table: 'sales',
    recordId: overrides.recordId ?? '00000000-0000-0000-0000-000000000901',
    localTimestamp:
      overrides.localTimestamp ?? new Date('2025-06-01').toISOString(),
    data: {
      code: overrides.code ?? 'SALE-001',
      date: overrides.date ?? new Date('2025-06-01').toISOString(),
      amount: overrides.amount ?? 1000,
      amountUsd: overrides.amountUsd ?? 28.17,
      exchangeRate: overrides.exchangeRate ?? 35.5,
      paymentMethod: overrides.paymentMethod ?? 1,
      status: overrides.status ?? 1,
      idCustomer:
        overrides.idCustomer ?? '00000000-0000-0000-0000-000000000101',
      items: overrides.items ?? [
        {
          productId: '00000000-0000-0000-0000-000000000001',
          quantity: 2,
          unitPrice: 500,
          unitPriceUsd: 14.08,
          subtotal: 1000,
          subtotalUsd: 28.17,
        },
      ],
    },
  };
}

export function createSyncConflictEntity(
  overrides: {
    id?: string;
    organizationId?: string;
    table?: string;
    recordId?: string;
    localData?: string;
    serverData?: string;
    localTimestamp?: Date;
    description?: string;
    status?: string;
    createdAt?: Date;
    resolvedAt?: Date | null;
  } = {},
) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000cc1',
    organizationId: overrides.organizationId ?? MOCK_ORG_ID,
    table: overrides.table ?? 'sales',
    recordId: overrides.recordId ?? '00000000-0000-0000-0000-000000000901',
    localData: overrides.localData ?? '{"items":[]}',
    serverData: overrides.serverData ?? '{"currentStock":0}',
    localTimestamp: overrides.localTimestamp ?? new Date('2025-06-01'),
    description: overrides.description ?? 'Oversold product',
    status: overrides.status ?? 'pending',
    createdAt: overrides.createdAt ?? new Date('2025-06-02'),
    resolvedAt: overrides.resolvedAt ?? null,
  };
}
