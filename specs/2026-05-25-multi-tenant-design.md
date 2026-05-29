# Multi-Tenant Design — GLAdmin

## Architecture Decision

**Approach: Prisma Middleware** (selected via brainstorming 2026-05-25)

A global Prisma `$use` middleware intercepts all queries and auto-injects `organizationId` into the `where` clause. This prevents accidental cross-tenant data leaks without modifying existing service code.

```
prisma.$use(async (params, next) => {
  if (shouldFilter(params.model, params.action, params.args)) {
    params.args.where = { ...params.args.where, organizationId: currentOrgId };
  }
  return next(params);
});
```

### Bypass for super admin
When `user.role.idRole === 1` (master level 100) or org context is null, the middleware skips filtering. Controlled by a `tenantContext` attached to the request via `TenantMiddleware`.

---

## Data Model

### New Models

```prisma
model Organization {
  id        Int      @id @default(autoincrement())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  settings  String?  // JSON: { logoUrl, themeColor, requireInvite, allowPublicSignup }
  planId    Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  plan                  Plan?
  users                 User[]
  userMemberships       UserOrganization[]
  suppliers             Supplier[]
  customers             Customer[]
  companies             Company[]
  products              Product[]
  taxes                 Tax[]
  batches               Batch[]
  stocks                Stock[]
  purchaseOrders        PurchaseOrder[]
  sales                 Sale[]
  exchangeRates         ExchangeRate[]
  withholdingRecords    WithholdingRecord[]
  accountsPayable       AccountsPayable[]
  accountsReceivable    AccountsReceivable[]
  invites               Invite[]
  pagoMovilConfigs      PagoMovilConfig[]
  pagoMovilTransactions PagoMovilTransaction[]
}

model Plan {
  id        Int      @id @default(autoincrement())
  name      String   @unique   // "free", "pro", "enterprise"
  label     String              // "Free", "Pro", "Enterprise"
  amount    Int                 // cents ($29 = 2900)
  currency  String   @default("usd")
  interval  String              // "month", "year", "lifetime"
  features  String              // JSON array: ["multi_currency", "advanced_reports", "bulk_export"]
  maxUsers  Int      @default(5)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  organizations Organization[]
}

model UserOrganization {
  userId         Int
  organizationId Int
  roleId         Int

  user         User         @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])
  role         Role         @relation(fields: [roleId], references: [id])

  @@id([userId, organizationId])
}

model Invite {
  id             Int      @id @default(autoincrement())
  code           String   @unique   // 32-byte hex
  email          String
  organizationId Int
  roleId         Int
  invitedById    Int
  expiresAt      DateTime           // 7 days from creation
  used           Boolean  @default(false)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  role         Role         @relation(fields: [roleId], references: [id])
  invitedBy    User         @relation(fields: [invitedById], references: [id])
}
```

### Modified Model — User

```prisma
model User {
  // ... existing fields (id, email, userName, password, firstName, lastName,
  //      idRole, mustChangePassword, lastLogin, isActive, timestamps) ...

  currentOrganizationId Int?
  currentOrganization   Organization? @relation("CurrentOrg", fields: [currentOrganizationId], references: [id])

  organizations UserOrganization[]
  invites       Invite[]            @relation("InvitedBy")
}
```

### Modified Models — All Business Tables

Every business model gets:
```prisma
model Supplier {
  // ... existing fields ...
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])
}
```

### Payment Models

```prisma
model PagoMovilConfig {
  id             Int      @id @default(autoincrement())
  organizationId Int      @unique
  phoneNumber    String
  bankId         String   // "0102" (Banesco), "0105" (Mercantil), etc.
  idNumber       String   // ID of account holder
  exchangeRate   Decimal  @db.Decimal(10, 2)  // VES/USD for pricing
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
}

model PagoMovilTransaction {
  id             Int      @id @default(autoincrement())
  organizationId Int
  userId         Int
  amountVes      Decimal  @db.Decimal(14, 2)
  amountUsd      Decimal  @db.Decimal(14, 2)
  bankId         String
  phoneNumber    String   // Sender's phone
  reference      String   // Transaction reference
  proofImage     String?  // Upload URL
  status         String   // "pending" | "under_review" | "approved" | "rejected" | "expired"
  reviewedBy     Int?
  reviewedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
}
```

---

## Tenant Resolution

### Middleware priority (NestJS middleware)

```
1. Header:  x-organization-id    → API clients (primary)
2. Cookie:  organization_id      → Browser web app
3. JWT payload orgId             → Fallback from login
```

### TenantContext

```ts
interface TenantContext {
  organizationId: number;
  organizationSlug: string;
  isActive: boolean;
  plan?: { name: string; features: string[] };
  isSuperAdmin?: boolean;  // true when user.role === master
}
```

Attached to `req.tenantContext` via `TenantMiddleware`. Accessible in controllers via `@Req() req` or a custom decorator.

---

## Role Resolution

Per-org roles via `UserOrganization` join table:

```
User signs in → JWT includes { sub, email, role }
User picks org → POST /auth/select-org
  → backend looks up UserOrganization.roleId for this user+org
  → if exists, use it; if not, fallback to User.idRole
  → new JWT includes { sub, email, role, orgId, orgRoleId }
```

`RolesGuard` reads `orgRoleId` from JWT when `orgId` is present, otherwise falls back to `role` (super admin without org context).

---

## Org Picker Flow

```
Login → POST /auth/login
  Response includes: { accessToken, refreshToken, user, organizations: [{ id, name, slug }] }

If organizations.length === 1 → Auto-select, redirect to dashboard
If organizations.length > 1  → Show org picker grid

Org picker → POST /auth/select-org { organizationId }
  Response: { accessToken, refreshToken, user (with org context) }
  JWT now includes orgId + orgRoleId
  → Redirect to dashboard
```

---

## Prisma Middleware — Filter Rules

```ts
prisma.$use(async (params, next) => {
  const ctx = getTenantContext();  // from AsyncLocalStorage or request

  // Skip: super admin or no org context
  if (!ctx || ctx.isSuperAdmin || !ctx.organizationId) return next(params);

  // Skip: non-business models
  // User queries are filtered through UserOrganization join, not orgId column
  if (params.model === 'User') return next(params);

  const businessModels = ['Supplier', 'Customer', 'Company', 'Product', 'Tax',
    'Batch', 'Stock', 'PurchaseOrder', 'PurchaseOrderDet', 'Sale', 'SalesDet',
    'ExchangeRate', 'WithholdingRecord', 'AccountsPayable', 'AccountsReceivable',
    'PagoMovilConfig', 'PagoMovilTransaction', 'Invite'];
  if (!businessModels.includes(params.model)) return next(params);

  // Skip: create actions (orgId is set from context, not filtered)
  if (params.action === 'create') {
    if (!params.args.data?.organizationId) {
      params.args.data.organizationId = ctx.organizationId;
    }
    return next(params);
  }

  // Filter: read/update/delete actions
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.args.where.organizationId = ctx.organizationId;
  }
  if (params.action === 'findMany') {
    params.args.where = { ...params.args.where, organizationId: ctx.organizationId };
  }
  if (params.action === 'update' || params.action === 'delete') {
    params.args.where.organizationId = ctx.organizationId;
  }

  return next(params);
});
```

### User queries — special case

User records do NOT have `organizationId` (users belong to orgs via `UserOrganization`). The `UsersService` must be updated to query org-scoped users:

```ts
// Instead of: prisma.user.findMany()
// Use:       
prisma.userOrganization.findMany({
  where: { organizationId: ctx.organizationId },
  include: { user: true },
});
```

The `GET /api/users` endpoint filters by org membership. The existing Users CRUD forms continue working — they operate on users already within the org scope.

---

## Implementation Phases

### Phase 1: Foundation
- Create Prisma models: Organization, Plan, UserOrganization, Invite
- Add `organizationId` to all 13 business tables
- Add `currentOrganizationId` to User
- Create Prisma middleware for auto-org filtering
- Create TenantMiddleware (header/query/cookie resolution)
- Seed default organization + Free plan
- Migration script to assign existing data to default org

### Phase 2: Auth + Org Picker
- Login returns user's orgs list
- POST /auth/select-org endpoint
- JWT includes orgId + orgRoleId
- Frontend: org picker page after login
- RolesGuard reads org-scoped role from JWT
- AuthProvider stores org context, auto-injects header

### Phase 3: Admin Panel (Backend)
- GET /admin/users — list org users
- POST /admin/users — create user with temp password
- PATCH /admin/users/:id/role — change org role
- POST /admin/users/:id/deactivate | /reactivate
- POST /admin/invites — generate invite code
- POST /auth/accept-invite — consume invite
- GET /admin/stats — org user stats

### Phase 4: Frontend Admin + Org Context
- OrgContext React provider
- API client auto-injects header
- Org switcher in sidebar
- Admin page: user list, create, invites
- Existing CRUD pages scope to current org

### Phase 5: Plans + Feature Gating
- PlanGuard + @RequiresFeature() decorator
- GET /subscriptions/plans
- POST /subscriptions/select-plan
- Frontend: <RequireFeature> component
- Plan badge in sidebar, gated buttons

### Phase 6: Payments
- PagoMovilConfig + PagoMovilTransaction models
- Pago Movil endpoints: banks, initiate, proof, admin review
- Stripe integration (checkout session, portal, webhooks)
- Frontend: billing page, payment history

### Phase 7: Bootstrap / Setup Wizard

Detects first-ever startup (no orgs in DB). Redirects to setup flow:

- `GET /bootstrap/status` → `{ requiresSetup: boolean }`
- `POST /bootstrap/setup { orgName, orgSlug, adminEmail, adminPassword, adminFirstName, adminLastName }`
  - Creates Organization
  - Creates User with role master (no org scope)
  - Assigns master user as org member via UserOrganization
  - Assigns Free plan to org
  - Returns JWT with org context
- Frontend: wizard page on first visit, shows org name/slug + admin account form
- Skip if `NEXT_PUBLIC_SKIP_SETUP=true` (for development, auto-seeds default org)

---

## Data Migration

```sql
-- Step 1: Create default org
INSERT INTO "Organization" (id, name, slug, "isActive", "planId", settings)
VALUES (1, 'Default Organization', 'default', true, NULL, '{}');

-- Step 2: Backfill business tables
UPDATE "User" SET "currentOrganizationId" = 1;
UPDATE "Supplier" SET "organizationId" = 1;
UPDATE "Customer" SET "organizationId" = 1;
-- ... all 13 business tables

-- Step 3: Create UserOrganization records for existing users
INSERT INTO "UserOrganization" ("userId", "organizationId", "roleId")
SELECT u.id, 1, u."idRole" FROM "User" u;
```

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tenant isolation | Row-level `organizationId` | Simple, single DB, works with Prisma |
| Filter mechanism | Prisma middleware | Can't forget filter, no service code changes |
| Org roles | Per-org via `UserOrganization` | User can have different roles in different orgs |
| Super admin | `isSuperAdmin` flag bypasses middleware | Master role users can see all orgs |
| Org resolution | Header (primary) → Cookie → JWT | Works for API + browser |
| Payments | Pago Movil (Venezuela) + Stripe | Covers local + international clients |
| Plans | Free (5 users) / Pro ($29, 50) / Enterprise ($99, 500) | Matches saas-auth seeding |
| First-run setup | Bootstrap wizard on first visit | Standard SaaS pattern |
