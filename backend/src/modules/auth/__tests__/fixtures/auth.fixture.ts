export interface TestUserOverrides {
  id?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  role?: { id: string; name: string; slug: string };
}

export function createTestUserEntity(overrides: TestUserOverrides = {}) {
  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000001',
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    userName: overrides.userName ?? 'testuser',
    email: overrides.email ?? 'test@cuadra.dev',
    password: overrides.password ?? '$2b$12$hashedpassword',
    isActive: overrides.isActive ?? true,
    mustChangePassword: overrides.mustChangePassword ?? false,
    role: overrides.role ?? {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Admin',
      slug: 'admin',
    },
    idRole: '00000000-0000-0000-0000-000000000010',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastLogin: null as Date | null,
    currentOrganizationId: null as string | null,
  };
}

export function createTestLoginDto(
  overrides: Partial<{ email: string; password: string }> = {},
) {
  return {
    email: overrides.email ?? 'test@cuadra.dev',
    password: overrides.password ?? 'password123',
  };
}

export function createTestRefreshDto(token?: string) {
  return {
    refreshToken: token ?? 'tokenId123.somesecretvalue',
  };
}

export function createTestChangePasswordDto(
  overrides: Partial<{ oldPassword: string; newPassword: string }> = {},
) {
  return {
    oldPassword: overrides.oldPassword ?? 'oldpass',
    newPassword: overrides.newPassword ?? 'newpass123',
  };
}

export function createTestRefreshTokenResult() {
  return {
    raw: 'tokenId999.rawsecret',
    hash: '$2b$12$hashedrefreshtoken',
    tokenId: 'tokenId999',
  };
}

export function createTestLoginResponse(
  overrides: Record<string, unknown> = {},
) {
  const user = createTestUserEntity();
  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      role: { id: user.role.id, name: user.role.name, slug: user.role.slug },
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    },
    accessToken: 'access.token.abc',
    refreshToken: 'tokenId999.rawsecret',
    expiresIn: 900,
    ...overrides,
  };
}

export interface TestOrgOverrides {
  id?: string;
  name?: string;
  slug?: string;
  plan?: { id: string; name: string; label: string; features: string } | null;
  role?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: Date | null;
}

export function createTestOrganization(overrides: TestOrgOverrides = {}) {
  return {
    id: overrides.id ?? '10000000-0000-0000-0000-000000000001',
    name: overrides.name ?? 'Test Org',
    slug: overrides.slug ?? 'test-org',
    plan: overrides.plan ?? null,
    role: overrides.role ?? 'admin',
    subscriptionStatus: overrides.subscriptionStatus ?? 'active',
    subscriptionExpiresAt: overrides.subscriptionExpiresAt ?? null,
  };
}

export function createTestUserOrganization(
  userId: string,
  orgId: string,
  roleId: string,
) {
  return {
    userId,
    organizationId: orgId,
    roleId,
    organization: {
      id: orgId,
      name: 'Test Org',
      slug: 'test-org',
      plan: null,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: null,
    },
    role: {
      id: roleId,
      name: 'Admin',
      slug: 'admin',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  };
}

export function createTestRefreshTokenEntity(
  overrides: {
    id?: string;
    tokenId?: string;
    tokenHash?: string;
    userId?: string;
    expiresAt?: Date;
    user?: ReturnType<typeof createTestUserEntity>;
  } = {},
) {
  const userId = overrides.userId ?? '00000000-0000-0000-0000-000000000001';
  return {
    id: overrides.id ?? '20000000-0000-0000-0000-000000000001',
    tokenId: overrides.tokenId ?? 'tokenId999',
    tokenHash: overrides.tokenHash ?? '$2b$12$hashedrefreshtoken',
    userId,
    expiresAt:
      overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    user: overrides.user ?? createTestUserEntity({ id: userId }),
  };
}
