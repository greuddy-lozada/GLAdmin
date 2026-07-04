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
    id: 1,
    ...dto,
    organizationId: 1,
    tax: null,
    brand: null,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}
