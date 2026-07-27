import { Page } from '@playwright/test';

const BASE = 'http://localhost:4000/api';

function randomPassword(): string {
  return Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 6);
}

function decodeJwt(token: string): Record<string, unknown> {
  return JSON.parse(atob(token.split('.')[1]));
}

export interface LoginResult {
  accessToken: string;
  orgToken?: string;
  userId?: string;
  orgId?: string;
  email?: string;
  password?: string;
}

export async function login(
  page: Page,
  email: string,
  password: string,
  selectOrg?: boolean,
): Promise<LoginResult> {
  let res = await page.request.post(`${BASE}/auth/login`, {
    data: { email, password },
  });
  let body = await res.json();
  // Handle rate limiting with retry
  let retries = 0;
  while (res.status() === 429 && retries < 5) {
    await new Promise((r) => setTimeout(r, 15000));
    res = await page.request.post(`${BASE}/auth/login`, {
      data: { email, password },
    });
    body = await res.json();
    retries++;
  }
  if (res.status() < 200 || res.status() >= 300) {
    throw new Error(`Login failed (${res.status()}): ${JSON.stringify(body)}`);
  }
  const { accessToken } = body.data;
  const payload = decodeJwt(accessToken);

  let orgToken: string | undefined;
  let orgId: string | undefined;

  const orgs = body.data.organizations;
  if (selectOrg && orgs && orgs.length > 0) {
    orgId = orgs[0].id;
    const selRes = await page.request.post(
      `${BASE}/auth/select-org`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { organizationId: orgId },
      },
    );
    const selBody = await selRes.json();
    orgToken = selBody.data.accessToken;
  }

  return {
    accessToken,
    orgToken,
    userId: payload.sub as string | undefined,
    orgId: orgId ?? (payload.orgId as string | undefined),
  };
}

export async function getRolesMap(
  page: Page,
  token: string,
): Promise<Record<string, string>> {
  const res = await page.request.get(`${BASE}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  const map: Record<string, string> = {};
  for (const r of body.data ?? []) {
    map[r.slug] = r.id;
  }
  return map;
}

/**
 * Create a system-level user (master, admin) via POST /admin/users.
 * Password is randomly generated — discard after test.
 */
export async function createSystemUser(
  page: Page,
  masterToken: string,
  roleId: string,
): Promise<{ email: string; password: string; userId: string }> {
  const ts = Date.now();
  const email = `sys-${ts}@test.com`;
  const password = randomPassword();
  const res = await page.request.post(`${BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${masterToken}` },
    data: {
      email,
      password,
      userName: email,
      firstName: 'System',
      lastName: `User ${ts}`,
      idRole: roleId,
    },
  });
  if (!res.ok()) throw new Error(`createSystemUser failed: ${await res.text()}`);
  const body = await res.json();
  return { email, password, userId: body.data.id };
}

export async function createOrgUser(
  page: Page,
  orgToken: string,
  roleId: string,
): Promise<{ email: string; password: string; userId: string }> {
  const ts = Date.now();
  const email = `org-${ts}@test.com`;
  const password = randomPassword();
  const res = await page.request.post(`${BASE}/users`, {
    headers: { Authorization: `Bearer ${orgToken}` },
    data: {
      email,
      password,
      userName: email,
      firstName: 'Org',
      lastName: `User ${ts}`,
      idRole: roleId,
    },
  });
  if (!res.ok()) throw new Error(`createOrgUser failed: ${await res.text()}`);
  const body = await res.json();
  return { email, password, userId: body.data.id };
}

export interface RoleTokens {
  master: LoginResult;
  admin: LoginResult;
  executive: LoginResult;
  manager: LoginResult;
  employee: LoginResult;
}

export async function bootstrapAllRoles(page: Page): Promise<RoleTokens> {
  const master = await login(page, 'admin@cuadra.app', '000000', true);
  const roles = await getRolesMap(page, master.orgToken!);

  const adminCreds = await createSystemUser(page, master.accessToken, roles.admin);
  const admin = await login(page, adminCreds.email, adminCreds.password, false);
  admin.email = adminCreds.email;
  admin.password = adminCreds.password;

  const execCreds = await createOrgUser(page, master.orgToken!, roles.executive);
  const executive = await login(page, execCreds.email, execCreds.password, true);
  executive.email = execCreds.email;
  executive.password = execCreds.password;

  const mgrCreds = await createOrgUser(page, executive.orgToken!, roles.manager);
  const manager = await login(page, mgrCreds.email, mgrCreds.password, true);
  manager.email = mgrCreds.email;
  manager.password = mgrCreds.password;

  const empCreds = await createOrgUser(page, manager.orgToken!, roles.employee);
  const employee = await login(page, empCreds.email, empCreds.password, true);
  employee.email = empCreds.email;
  employee.password = empCreds.password;

  return { master, admin, executive, manager, employee };
}

/**
 * Delete a user by ID via master token (admin panel).
 */
export async function deleteUser(page: Page, masterToken: string, userId: string): Promise<void> {
  await page.request.delete(`${BASE}/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
}
