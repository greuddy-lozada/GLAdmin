export interface TestProductOverrides {
  name?: string;
  price?: number;
  code?: string;
  available?: boolean;
}

export function createTestProductDto(overrides: TestProductOverrides = {}) {
  return {
    name: overrides.name ?? 'Test Product',
    price: overrides.price ?? 100,
    code: overrides.code ?? 'TEST-001',
    available: overrides.available ?? true,
  };
}

export function createTestProductEntity(overrides: TestProductOverrides = {}) {
  const dto = createTestProductDto(overrides);
  return {
    id: '00000000-0000-0000-0000-000000000001',
    ...dto,
    organizationId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    tax: null,
    brand: null,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}
