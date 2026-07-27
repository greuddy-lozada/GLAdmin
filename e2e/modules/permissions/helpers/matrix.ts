export interface EndpointTest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  params?: string[];
  minLevel: number;
  guardType: 'system' | 'org';
  allowedRoles: string[];
}

export const ENDPOINTS: EndpointTest[] = [
  // ─── Admin: System-level ───
  { method: 'GET', path: '/admin/orgs', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'POST', path: '/admin/orgs', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'GET', path: '/admin/orgs/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['org'] },
  { method: 'PATCH', path: '/admin/orgs/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['org'] },
  { method: 'DELETE', path: '/admin/orgs/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['org'] },
  { method: 'POST', path: '/admin/orgs/:id/assign-user', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['org'] },
  { method: 'POST', path: '/admin/orgs/:id/remove-user/:userId', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['org', 'user'] },
  { method: 'PATCH', path: '/admin/orgs/:id/change-role/:userId', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['org', 'user'] },

  { method: 'GET', path: '/admin/users', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'POST', path: '/admin/users', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'GET', path: '/admin/users/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['user'] },
  { method: 'PATCH', path: '/admin/users/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['user'] },
  { method: 'DELETE', path: '/admin/users/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['user'] },

  { method: 'GET', path: '/admin/plans', guardType: 'system', minLevel: 40, allowedRoles: ['master', 'admin', 'executive', 'manager', 'employee'] },
  { method: 'GET', path: '/admin/plans/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['plan'] },
  { method: 'POST', path: '/admin/plans', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'PATCH', path: '/admin/plans/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['plan'] },
  { method: 'DELETE', path: '/admin/plans/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['plan'] },

  { method: 'GET', path: '/admin/invites', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'POST', path: '/admin/invites', guardType: 'system', minLevel: 100, allowedRoles: ['master'] },
  { method: 'DELETE', path: '/admin/invites/:id', guardType: 'system', minLevel: 100, allowedRoles: ['master'], params: ['invite'] },

  // ─── Users (org-scoped) ───
  { method: 'POST', path: '/users', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/users', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/users/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['user'] },
  { method: 'PATCH', path: '/users/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['user'] },
  { method: 'DELETE', path: '/users/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['user'] },

  // ─── Roles (org-scoped) ───
  { method: 'GET', path: '/roles', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/roles/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['role'] },

  // ─── Companies (org-scoped) ───
  { method: 'POST', path: '/companies', guardType: 'org', minLevel: 80, allowedRoles: ['executive'] },
  { method: 'GET', path: '/companies', guardType: 'org', minLevel: 80, allowedRoles: ['executive'] },
  { method: 'GET', path: '/companies/:id', guardType: 'org', minLevel: 80, allowedRoles: ['executive'], params: ['company'] },
  { method: 'PATCH', path: '/companies/:id', guardType: 'org', minLevel: 80, allowedRoles: ['executive'], params: ['company'] },
  { method: 'DELETE', path: '/companies/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['company'] },

  // ─── Products (org-scoped) ───
  { method: 'POST', path: '/products', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/products', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/products/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['product'] },
  { method: 'PATCH', path: '/products/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['product'] },
  { method: 'DELETE', path: '/products/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['product'] },

  // ─── Categories (org-scoped) ───
  { method: 'POST', path: '/categories', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/categories', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/categories/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['category'] },
  { method: 'PATCH', path: '/categories/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['category'] },
  { method: 'DELETE', path: '/categories/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['category'] },

  // ─── Brands (org-scoped) ───
  { method: 'POST', path: '/brands', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/brands', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/brands/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['brand'] },
  { method: 'PATCH', path: '/brands/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['brand'] },
  { method: 'DELETE', path: '/brands/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['brand'] },

  // ─── Suppliers (org-scoped) ───
  { method: 'POST', path: '/suppliers', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/suppliers', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/suppliers/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['supplier'] },
  { method: 'PATCH', path: '/suppliers/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['supplier'] },
  { method: 'DELETE', path: '/suppliers/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['supplier'] },

  // ─── Customers (org-scoped) ───
  { method: 'POST', path: '/customers', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/customers', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/customers/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['customer'] },
  { method: 'PATCH', path: '/customers/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['customer'] },
  { method: 'DELETE', path: '/customers/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['customer'] },

  // ─── Sales (class-level @MinOrgLevel(employee) = 40) ───
  { method: 'POST', path: '/sales', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/sales', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/sales/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['sale'] },
  { method: 'PATCH', path: '/sales/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['sale'] },
  { method: 'DELETE', path: '/sales/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['sale'] },

  // ─── Cash Registers (org-scoped) ───
  { method: 'POST', path: '/cash-registers', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/cash-registers', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/cash-registers/my-active-session', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/cash-registers/sessions', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/cash-registers/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['cashRegister'] },
  { method: 'PATCH', path: '/cash-registers/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['cashRegister'] },
  { method: 'DELETE', path: '/cash-registers/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['cashRegister'] },
  { method: 'POST', path: '/cash-registers/:id/open', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['cashRegister'] },
  { method: 'POST', path: '/cash-registers/sessions/:id/close', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['session'] },

  // ─── Stocks (org-scoped) ───
  { method: 'POST', path: '/stocks', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/stocks', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/stocks/alerts', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/stocks/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['stock'] },
  { method: 'PATCH', path: '/stocks/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['stock'] },
  { method: 'DELETE', path: '/stocks/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['stock'] },

  // ─── Batches (org-scoped) ───
  { method: 'POST', path: '/batches', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/batches', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/batches/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['batch'] },
  { method: 'PATCH', path: '/batches/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['batch'] },
  { method: 'DELETE', path: '/batches/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['batch'] },

  // ─── Taxes (org-scoped) ───
  { method: 'POST', path: '/taxes', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/taxes', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/taxes/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['tax'] },
  { method: 'PATCH', path: '/taxes/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['tax'] },
  { method: 'DELETE', path: '/taxes/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['tax'] },

  // ─── Currencies (all @MinOrgLevel(employee) = 40) ───
  { method: 'GET', path: '/currencies', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/currencies/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['currency'] },

  // ─── Exchange Rates (org-scoped) ───
  { method: 'POST', path: '/exchange-rates/sync', guardType: 'org', minLevel: 80, allowedRoles: ['executive'] },
  { method: 'POST', path: '/exchange-rates', guardType: 'org', minLevel: 80, allowedRoles: ['executive'] },
  { method: 'GET', path: '/exchange-rates', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/exchange-rates/latest', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/exchange-rates/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['exchangeRate'] },
  { method: 'PATCH', path: '/exchange-rates/:id', guardType: 'org', minLevel: 80, allowedRoles: ['executive'], params: ['exchangeRate'] },
  { method: 'DELETE', path: '/exchange-rates/:id', guardType: 'org', minLevel: 80, allowedRoles: ['executive'], params: ['exchangeRate'] },

  // ─── Purchase Orders (org-scoped) ───
  { method: 'POST', path: '/purchase-orders', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/purchase-orders', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/purchase-orders/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['purchaseOrder'] },
  { method: 'PATCH', path: '/purchase-orders/:id', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['purchaseOrder'] },
  { method: 'POST', path: '/purchase-orders/:id/receive', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['purchaseOrder'] },
  { method: 'DELETE', path: '/purchase-orders/:id', guardType: 'org', minLevel: 100, allowedRoles: [], params: ['purchaseOrder'] },

  // ─── Reports (org-scoped) ───
  { method: 'POST', path: '/reports', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'GET', path: '/reports', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/reports/types', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/reports/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['report'] },
  { method: 'DELETE', path: '/reports/:id', guardType: 'org', minLevel: 80, allowedRoles: ['executive'], params: ['report'] },

  // ─── Uploads (all @MinOrgLevel(employee) = 40) ───
  { method: 'POST', path: '/uploads/proof', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },

  // ─── Sync (all @MinOrgLevel(employee) = 40) ───
  { method: 'GET', path: '/sync/pull', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'POST', path: '/sync/push', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/sync/conflicts', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'PATCH', path: '/sync/conflicts/:id/resolve', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['conflict'] },

  // ─── Dashboard (org-scoped) ───
  { method: 'GET', path: '/dashboard/stats', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/dashboard/analytics', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/dashboard/sales-analytics', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },

  // ─── Subscriptions (org-scoped) ───
  { method: 'GET', path: '/subscription-payments/config', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/subscription-payments', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/subscription-payments/admin', guardType: 'org', minLevel: 80, allowedRoles: ['executive'] },
  { method: 'POST', path: '/subscription-payments', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'PATCH', path: '/subscription-payments/:id/review', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['payment'] },

  // ─── Pago Movil Transactions (org-scoped) ───
  { method: 'GET', path: '/pago-movil/transactions', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'POST', path: '/pago-movil/transactions', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'] },
  { method: 'GET', path: '/pago-movil/transactions/:id', guardType: 'org', minLevel: 40, allowedRoles: ['executive', 'manager', 'employee'], params: ['transaction'] },
  { method: 'PATCH', path: '/pago-movil/transactions/:id/review', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'], params: ['transaction'] },

  // ─── Pago Movil Config (all @MinOrgLevel(manager) = 60) ───
  { method: 'GET', path: '/pago-movil/config', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'POST', path: '/pago-movil/config', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'PATCH', path: '/pago-movil/config', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },
  { method: 'DELETE', path: '/pago-movil/config', guardType: 'org', minLevel: 60, allowedRoles: ['executive', 'manager'] },

  // ─── Payments (org-scoped, @MinOrgLevel(master) = 100 — unreachable) ───
  { method: 'POST', path: '/payments/create-checkout-session', guardType: 'org', minLevel: 100, allowedRoles: [] },
];

export const ALL_ROLES = ['master', 'admin', 'executive', 'manager', 'employee'] as const;
export type RoleSlug = (typeof ALL_ROLES)[number];

const ROLE_LEVEL: Record<string, number> = {
  master: 100,
  admin: 70,
  executive: 80,
  manager: 60,
  employee: 40,
};

export function canAccess(role: RoleSlug, ep: EndpointTest): boolean {
  return ep.allowedRoles.includes(role);
}

export function canAccessByLevel(role: RoleSlug, ep: EndpointTest): boolean {
  const roleLevel = ROLE_LEVEL[role];
  if (roleLevel === undefined) return false;
  if (ep.guardType === 'system') return roleLevel >= ep.minLevel;
  // org guard: only roles that have an orgToken in bootstrapAllRoles
  // master (selectOrg=true), executive/manager/employee (selectOrg=true)
  if (role === 'admin') return false; // admin has no orgToken
  return roleLevel >= ep.minLevel;
}
