# Multi-Tenant & Subscriptions — Evaluation

> Analysis of what exists in `$HOME/Dev/saas-auth` vs what's implemented in GLAdmin,
> and what's needed to make GLAdmin multi-tenant with payments and administration.

---

## Current State

GLAdmin is **single-tenant**. All data belongs to one organization. The `saas-auth` project has a complete multi-tenant SaaS backend (MongoDB/Fastify) that covers:

- Multi-tenant isolation (Organization/Tenant model)
- Admin user management + invites
- Subscription plans (Free/Pro/Enterprise)
- Payments: Stripe (cards), Binance Pay (crypto), Pago Movil (Venezuela bank transfer)
- Feature gating per plan
- Bootstrap/setup wizard
- Device tracking + refresh token reuse detection
- Super admin (global, no tenant)

The existing `specs/saas-auth-integration.md` covers Phases 1-4 at a high level but has not been updated against the actual `saas-auth` codebase. Several architectural decisions need revisiting.

---

## Key Architectural Differences

| Aspect | saas-auth (reference) | GLAdmin current | GLAdmin target constraint |
|---|---|---|---|
| Database | MongoDB (NoSQL) | SQLite dev → PostgreSQL prod | PostgreSQL (from prod-deployment.md) |
| ORM | Mongoose | Prisma | Prisma |
| Tenancy | Soft (`tenantId` field on every document) | None | Row-level `organizationId` column |
| Frontend | None (API-only) | Next.js App Router | Must add org-switcher, scoped views |
| Auth device tracking | Full (Device model + per-device tokens) | None | Deferrable |
| Super admin | Global users without `tenantId` | Role `master` (level 100) | Already exists via role hierarchy |
| Payments | Stripe + Binance + Pago Movil | None | Pago Movil required (Venezuela) |

---

## What's Already in GLAdmin (vs saas-auth)

### Present in both

| Feature | saas-auth | GLAdmin | Notes |
|---|---|---|---|
| JWT access/refresh token | ✅ | ✅ | GLAdmin has 15-min access + rotation |
| Refresh token rotation + reuse detection | ✅ | ✅ | `auth.service.ts` detects reuse, revokes all |
| bcrypt password hashing | ✅ | ✅ | Both use bcrypt |
| Role-based access | ✅ | ✅ | GLAdmin: level-based (40/60/80/100), saas-auth: string-based |
| User activation/deactivation | ✅ | ✅ | GLAdmin has `isActive` + AuthGuard check |
| Email-based login | ✅ | ✅ | Both use email |

### In saas-auth, missing from GLAdmin

| Feature | saas-auth | GLAdmin need | Priority |
|---|---|---|---|
| Multi-tenant (Organization model) | ✅ Full middleware + resolver | 🔲 Missing | High |
| Organization-scoped queries | ✅ Middleware on every request | 🔲 Missing | High |
| Admin user management (list, create, deactivate, stats) | ✅ Full CRUD | 🔲 Missing | High |
| Bootstrap/setup wizard | ✅ First-run flow | 🔲 Missing | Medium |
| Plan/Subscription models | ✅ Free/Pro/Enterprise | 🔲 Missing | Medium |
| Feature gating (`@RequiresFeature`) | ✅ PlanGuard decorator | 🔲 Missing | Medium |
| Stripe integration | ✅ Checkout + portal + webhooks | 🔲 Missing | Low |
| Binance Pay (crypto) | ✅ API integration | 🔲 Missing | Low |
| Pago Movil (Venezuela transfers) | ✅ Full admin review flow | 🔲 Missing | High |
| Invite system | ✅ Code-based, 7-day expiry | 🔲 Missing | Medium |
| Device tracking | ✅ Per-device tokens + revocation | 🔲 Missing | Low |
| Mobile-specific auth | ✅ Longer-lived tokens | 🔲 Missing | Low |
| Super admin (system-level) | ✅ No tenantId users | 🔲 Missing | Medium |
| Tenant settings (logo, domains, etc.) | ✅ JSON settings per tenant | 🔲 Missing | Low |

---

## Tenant Isolation Strategy for Prisma/PostgreSQL

### Option A: Row-level `organizationId` (recommended)

Every business table gets an `organizationId` column. Queries always filter by it.

```prisma
model Supplier {
  id             Int      @id @default(autoincrement())
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])
  // ... other fields
}
```

**Pros:** Simple, single database, easy cross-tenant reporting (super admin), easy migrations
**Cons:** Must ensure every query includes the filter (forget it = data leak)

**Mitigation:** Prisma middleware or a base service wrapper that auto-injects `where.organizationId`.

### Option B: Schema-per-tenant (PostgreSQL schemas)

Each tenant gets its own PostgreSQL schema (`org_1`, `org_2`). Queries set `search_path`.

**Pros:** Strong isolation, can restore per-tenant, no accidental cross-tenant queries
**Cons:** Complex migrations (run for each schema), Prisma doesn't natively support dynamic schemas, harder cross-tenant queries

**Verdict:** Overkill for an admin tool. Row-level is the right choice.

---

## Prisma Schema Changes Required

### New models

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

  plan       Plan?
  users      User[]
  suppliers  Supplier[]
  customers  Customer[]
  companies  Company[]
  products   Product[]
  // ... all tenant-scoped models
}

model Plan {
  id        Int      @id @default(autoincrement())
  name      String   @unique   // "free", "pro", "enterprise"
  label     String              // "Free", "Pro", "Enterprise"
  amount    Int                 // in cents ($29 = 2900)
  currency  String   @default("usd")
  interval  String              // "month", "year", "lifetime"
  features  String              // JSON array: ["multi_currency", "advanced_reports"]
  maxUsers  Int      @default(5)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Invite {
  id             Int      @id @default(autoincrement())
  code           String   @unique   // 32-byte hex
  email          String
  organizationId Int
  roleId         Int
  invitedById    Int
  expiresAt      DateTime           // 7 days
  used           Boolean  @default(false)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  role         Role         @relation(fields: [roleId], references: [id])
  invitedBy    User         @relation(fields: [invitedById], references: [id])
}
```

### Modified models

Every business model gets `organizationId Int` + relation:

```prisma
model User {
  // ... existing fields ...
  organizationId Int?
  organization   Organization? @relation(fields: [organizationId], references: [id])
}

model Supplier {
  // ... existing fields (without documentNumber) ...
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])
}

model Customer {
  // ... existing fields ...
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])
}
// → Same for Company, Product, PurchaseOrder, Sale, Tax, Batch, Stock,
//   ExchangeRate, WithholdingRecord, AccountsPayable, AccountsReceivable
```

---

## Metadata vs Current User Schema

The existing `User` model uses `idRole` (FK → `Role`), not direct role strings. The `Organization` user adds:

- `organizationId` (nullable for super admin users)
- `idRole` already exists for RBAC

Super admin users would have `organizationId: null` and `role.slug === 'master'`. This aligns with the existing role hierarchy (master=100).

---

## Payment Integration

### Pago Movil (Venezuela) — High Priority

Since GLAdmin is a Venezuela-focused app, Pago Movil is the most important payment method. The saas-auth reference implements:

| Endpoint | Purpose |
|---|---|
| `GET /payments/pago-movil/banks` | List Venezuelan banks |
| `GET /payments/pago-movil/config` | Organization's Pago Movil config |
| `POST /payments/pago-movil/initiate` | User starts payment |
| `POST /payments/pago-movil/submit-proof` | Upload screenshot |
| `GET /payments/pago-movil/my-transactions` | User history |
| `GET /payments/pago-movil/admin/pending` | Admin views pending |
| `POST /payments/pago-movil/admin/review` | Admin approves/rejects |
| `POST /payments/pago-movil/admin/exchange-rate` | Super admin sets VES/USD |

**Pago Movil models needed in Prisma:**

```prisma
model PagoMovilConfig {
  id             Int    @id @default(autoincrement())
  organizationId Int    @unique
  phoneNumber    String
  bankId         String // "0102", "0105", etc.
  idNumber       String // ID/VAT of account holder
  exchangeRate   Decimal @db.Decimal(10, 2) // VES/USD for subscription pricing
  isActive       Boolean @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model PagoMovilTransaction {
  id             Int      @id @default(autoincrement())
  organizationId Int
  userId         Int
  amountVes      Decimal  @db.Decimal(14, 2)
  amountUsd      Decimal  @db.Decimal(14, 2)
  bankId         String
  phoneNumber    String   // Sender's phone
  reference      String   // Transaction reference number
  proofImage     String?  // URL/path to screenshot
  status         String   // "pending" | "under_review" | "approved" | "rejected" | "expired"
  reviewedBy     Int?
  reviewedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
}
```

### Stripe — Medium Priority

For international customers. Follows the same pattern as saas-auth:

1. Organization gets a `stripeCustomerId` field
2. Checkout session creation → Stripe hosted page
3. Webhook handler → `checkout.session.completed` → activate subscription
4. Stripe metadata maps to Plan IDs

### Binance Pay — Low Priority

For crypto-native customers. Same architecture as Stripe but with HMAC-signed API calls.

---

## Tenant Resolution Strategy

### Middleware priority (Prisma/NestJS compatible)

```
1. Header:   x-organization-id       (API clients)
2. Cookie:   organization_id         (browser)
3. Subdomain: <slug>.localhost:3000  (web UI)
4. Default:  user's first org        (fallback for single-org users)
```

### Implementation as NestJS middleware

```ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const orgId = this.resolveOrganizationId(req);
    if (orgId) {
      const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
      req['orgContext'] = { organizationId: org.id, isActive: org.isActive, plan: org.plan };
    }
    next();
  }
}
```

### Scoped queries

Every Prisma service method must include `organizationId`. Pattern:

```ts
class BaseService {
  constructor(protected prisma: PrismaService) {}

  protected orgFilter(ctx?: OrgContext): { organizationId?: number } {
    if (!ctx || ctx.isSuperAdmin) return {};
    if (!ctx.organizationId) throw new ForbiddenException();
    return { organizationId: ctx.organizationId };
  }
}
```

**Risk:** Forgetting the filter exposes data cross-tenant. Mitigations:
- TypeScript wrapper that wraps Prisma queries with org filter
- Integration tests that verify isolation
- Code review checklist item

---

## Frontend Impact

### What changes for the user

| Page | Change |
|---|---|
| Login | Add org slug input (or detect via subdomain) |
| Sidebar | Org name/logo at top, org switcher if multi-org |
| Dashboard | Scoped to current org |
| All CRUD pages | Filtered by current org |
| Settings | Add org settings tab (name, slug, plan) |
| Admin panel (new) | User management, invites, subscription |
| Billing (new) | Plan selection, payment history |

### Org context in frontend

```ts
// React context
interface OrgContext {
  id: number;
  name: string;
  slug: string;
  plan: { name: string; features: string[] };
}

// API calls include header
apiClient.defaults.headers['x-organization-id'] = orgId;
```

### Page guard for features

```tsx
<RequireFeature feature="advanced_reports">
  <ReportsButton />
</RequireFeature>
```

---

## Data Migration: Single-Tenant → Multi-Tenant

### Step 1: Create default organization

```sql
INSERT INTO "Organization" (id, name, slug, "isActive", settings)
VALUES (1, 'Default Organization', 'default', true, '{}');
```

### Step 2: Backfill organizationId on existing records

```sql
UPDATE "User" SET "organizationId" = 1 WHERE "organizationId" IS NULL;
UPDATE "Supplier" SET "organizationId" = 1 WHERE "organizationId" IS NULL;
-- ... every business table
```

### Step 3: Make organizationId NOT NULL (after backfill)

```prisma
organizationId Int
→
organizationId Int  @default(1)  // temporary
→
organizationId Int                 // after data verified
```

### Step 4: Seed default free plan and assign to org

---

## Recommended Implementation Order

| Step | What | Depends on | Effort |
|---|---|---|---|
| 1 | Add Organization + Plan models to Prisma schema | — | Small |
| 2 | Add `organizationId` to all business models | Step 1 | Medium |
| 3 | Create TenantMiddleware (header/query/subdomain) | Step 2 | Small |
| 4 | BaseService with auto-org filter | Step 3 | Small |
| 5 | Update all CRUD services to use org filter | Step 4 | Large |
| 6 | Seed default org + plan + migration script | Step 1 | Small |
| 7 | Bootstrap/setup flow (first-run wizard) | Step 6 | Medium |
| 8 | Admin user management (list, create, deactivate, invites) | Steps 1-5 | Large |
| 9 | Frontend org context + org-scoped views | Steps 3-5 | Large |
| 10 | Subscription backend (plans, feature gating) | Step 1 | Medium |
| 11 | Pago Movil integration | Steps 9-10 | Medium |
| 12 | Stripe integration | Steps 9-10 | Medium |
| 13 | Frontend billing/admin pages | Steps 10-12 | Large |

**Total effort estimate:** 3-4 sprints (multi-tenant core → admin → payments)

---

## What NOT to port from saas-auth

These features exist in saas-auth but are unnecessary or already covered in GLAdmin:

| Feature | Reason to skip |
|---|---|
| Device tracking + per-device tokens | GLAdmin is a web-only admin tool; no mobile app |
| Mobile-specific auth (7d access token) | No mobile client planned |
| Binance Pay | Low demand; Stripe + Pago Movil sufficient |
| Fastify adapter | GLAdmin already uses Express (NestJS default) |
| MongoDB replica set | PostgreSQL handles this natively |
| Mongoose BaseRepository | Prisma Client replaces this entirely |
