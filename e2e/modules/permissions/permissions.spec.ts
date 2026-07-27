import { test, expect } from '@playwright/test';
import { ENDPOINTS, ALL_ROLES, canAccessByLevel } from './helpers/matrix';
const canAccess = canAccessByLevel;
import { bootstrapAllRoles, deleteUser } from './helpers/auth.helper';

const BASE = 'http://localhost:4000/api';

test.describe('Permission Matrix — exhaustive role × endpoint', () => {
  test.slow(); // 3x timeout multiplier for CI/Local
  let tokens: Record<string, { accessToken: string; orgToken?: string }>;
  let createdUserIds: string[] = [];
  let entityIds: Record<string, string>;
  let masterToken: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    const allTokens = await bootstrapAllRoles(page);
    tokens = allTokens as unknown as Record<string, { accessToken: string; orgToken?: string }>;
    masterToken = allTokens.master.accessToken;

    createdUserIds = [
      allTokens.admin.userId!,
      allTokens.executive.userId!,
      allTokens.manager.userId!,
      allTokens.employee.userId!,
    ];

    // Fetch entity IDs from seed data for :id parameter resolution
    entityIds = {};

    // Get an org ID
    const orgsRes = await page.request.get(`${BASE}/admin/orgs`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const orgsBody = await orgsRes.json();
    if (orgsBody.data?.length > 0) entityIds.org = orgsBody.data[0].id;

    // Get a product ID
    const prodRes = await page.request.get(`${BASE}/products`, {
      headers: { Authorization: `Bearer ${allTokens.executive.orgToken}` },
    });
    const prodBody = await prodRes.json();
    if (prodBody.data?.length > 0) entityIds.product = prodBody.data[0].id;

    // Get a category ID
    const catRes = await page.request.get(`${BASE}/categories`, {
      headers: { Authorization: `Bearer ${allTokens.executive.orgToken}` },
    });
    const catBody = await catRes.json();
    if (catBody.data?.length > 0) entityIds.category = catBody.data[0].id;

    // Get a customer ID
    const custRes = await page.request.get(`${BASE}/customers`, {
      headers: { Authorization: `Bearer ${allTokens.executive.orgToken}` },
    });
    const custBody = await custRes.json();
    if (custBody.data?.length > 0) entityIds.customer = custBody.data[0].id;

    // Get a plan ID
    const plansRes = await page.request.get(`${BASE}/admin/plans`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const plansBody = await plansRes.json();
    if (plansBody.data?.length > 0) entityIds.plan = plansBody.data[0].id;

    // Get a role ID
    const rolesRes = await page.request.get(`${BASE}/roles`, {
      headers: { Authorization: `Bearer ${allTokens.executive.orgToken}` },
    });
    const rolesBody = await rolesRes.json();
    if (rolesBody.data?.length > 0) entityIds.role = rolesBody.data[0].id;

    // Get a user ID (for user-scoped endpoints)
    const usersRes = await page.request.get(`${BASE}/users`, {
      headers: { Authorization: `Bearer ${allTokens.executive.orgToken}` },
    });
    const usersBody = await usersRes.json();
    if (usersBody.data?.length > 0) entityIds.user = usersBody.data[0].id;

    await page.close();
    await ctx.close();
  });

  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: undefined });
    const page = await ctx.newPage();
    for (const uid of createdUserIds) {
      await deleteUser(page, masterToken, uid);
    }
    // Clean up any orphaned test users from previous runs
    const listRes = await page.request.get(`${BASE}/admin/users?isActive=all`, {
      headers: { Authorization: `Bearer ${masterToken}` },
    });
    const listBody = await listRes.json();
    for (const u of listBody.data ?? []) {
      if (u.email.endsWith('@test.com')) {
        await page.request.delete(`${BASE}/admin/users/${u.id}`, {
          headers: { Authorization: `Bearer ${masterToken}` },
        });
      }
    }
    await page.close();
    await ctx.close();
  });

  for (const ep of ENDPOINTS) {
    for (const role of ALL_ROLES) {
      test(`${role} → ${ep.method} ${ep.path}`, async ({ page }) => {
        const token =
          ep.guardType === 'system'
            ? tokens[role]?.accessToken
            : tokens[role]?.orgToken;

        if (!token) {
          test.skip();
          return;
        }

        // Resolve path params
        let path = ep.path;
        if (ep.params) {
          for (const param of ep.params) {
            const id = entityIds[param];
            path = path.replace(`:${param}`, id ?? '00000000-0000-0000-0000-000000000000');
          }
        }

        const res = await page.request.fetch(`${BASE}${path}`, {
          method: ep.method,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (canAccess(role, ep)) {
          // Any status except 401 means the guard passed
          expect(
            res.status(),
            `expected non-401 (guard pass) got 401 for ${ep.method} ${ep.path}`,
          ).not.toBe(401);
        } else {
          expect(
            res.status(),
            `expected 403 guard rejection for ${role} on ${ep.method} ${ep.path}`,
          ).toBe(403);
        }
      });
    }
  }
});
