export interface TestCustomerOverrides {
  firstName?: string;
  lastName?: string;
  idCardNumber?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  available?: boolean;
  isWithholdingAgent?: boolean;
  withholdingPercentage?: number;
}

export function createTestCustomerDto(overrides: TestCustomerOverrides = {}) {
  return {
    firstName: overrides.firstName ?? 'John',
    lastName: overrides.lastName ?? 'Doe',
    idCardNumber: overrides.idCardNumber ?? 'V-12345678',
    address: overrides.address ?? 'Av. Principal #123',
    phoneNumber: overrides.phoneNumber ?? '+58 212-555-1234',
    email: overrides.email ?? 'john.doe@example.com',
    available: overrides.available ?? true,
    isWithholdingAgent: overrides.isWithholdingAgent ?? false,
    withholdingPercentage: overrides.withholdingPercentage ?? 0,
  };
}

export function createTestCustomerEntity(
  overrides: TestCustomerOverrides = {},
) {
  const dto = createTestCustomerDto(overrides);
  return {
    id: '00000000-0000-0000-0000-000000000001',
    ...dto,
    version: 0,
    withholdingProof: null,
    organizationId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}
