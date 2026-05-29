# SaaS Auth Integration — Specification

Integrate the auth patterns from `saas-auth` (MongoDB/Fastify) into `GLAdmin` (Prisma/SQLite, Express NestJS, Next.js).

---

## Implementation Status

- ✅ Phase 1 complete (Prisma model, backend auth, frontend provider/API)
- 🔲 Phase 2 (Multi-Tenant) — deferred, current single-org usage works
- 🔲 Phase 3 (Invites) — deferred
- 🔲 Phase 4 (Subscriptions) — deferred

## Phase 1 — Auth Upgrade (COMPLETED)

### 1.1 User Model

```prisma
model User {
  id                 Int       @id @default(autoincrement())
  email              String    @unique
  userName           String    @unique
  password           String
  firstName          String
  lastName           String
  idRole             Int
  mustChangePassword Boolean   @default(false)
  lastLogin          DateTime?
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  role         Role           @relation(fields: [idRole], references: [id])
  refreshTokens RefreshToken[]
}
```

Note: `organizationId` is NOT included yet (deferred to Phase 2).

### 1.2 RefreshToken Model

```prisma
model RefreshToken {
  id        Int      @id @default(autoincrement())
  tokenHash String
  userId    Int
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

### 1.3 JWT

Access token (15 min) payload: `{ sub, email, role, type: 'access' }`
Refresh token: random 32-byte hex, stored as bcrypt hash, rotation with security violation detection.

### 1.4 Auth Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Returns `{ accessToken, refreshToken, expiresIn, user }` |
| GET | `/auth/me` | Current user |
| POST | `/auth/refresh` | Refresh token rotation |
| POST | `/auth/logout` | Revoke current refresh token |
| POST | `/auth/change-password` | Requires old + new password |

### 1.5 Auth Flow

- Login validates email + password, generates JWT + refresh token, updates `lastLogin`
- AuthGuard reads JWT payload without DB hit (role embedded in token)
- RolesGuard reads `user.role` string
- Refresh: bcrypt compare → if mismatch, revoke ALL tokens (security violation)
- Frontend: auto-refresh interceptor on 401, scheduled refresh before expiry

### 1.6 File Changes

**Prisma:**
- `backend/prisma/schema.prisma` — User fields updated, AuthToken replaced with RefreshToken

**Backend:**
- `backend/src/modules/auth/auth.service.ts` — Refresh rotation, change password
- `backend/src/modules/auth/auth.controller.ts` — New endpoints
- `backend/src/modules/auth/auth.factory.ts` — Token pair generation
- `backend/src/common/guards/auth.guard.ts` — Reads JWT without DB hit
- `backend/src/common/guards/roles.guard.ts` — Reads `user.role` string
- `backend/prisma/seed.ts` — Updated user seed

**Frontend:**
- `frontend/src/providers/auth-provider.tsx` — Refresh token, auto-refresh, schedule
- `frontend/src/lib/api/api-client.ts` — 401 interceptor with refresh
- `frontend/src/features/auth/services/auth.service.ts` — Refresh method
- `frontend/src/features/auth/models/auth.model.ts` — Updated User, LoginRequest, LoginResponse
- `frontend/src/features/auth/components/login-form.tsx` — Email input
- `frontend/src/app/(auth)/login/page.tsx` — Landing page with slide panel

---

## Phase 2 — Multi-Tenant

### 2.1 Organization Model

```prisma
model Organization {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  isActive    Boolean  @default(true)
  settings    String?  // JSON blob: { allowPublicSignup, requireInvite, ... }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users            User[]
  suppliers        Supplier[]
  customers        Customer[]
  companies        Company[]
  products         Product[]
  purchaseOrders   PurchaseOrder[]
  sales            Sale[]
  withholdingRecords WithholdingRecord[]
  exchangeRates    ExchangeRate[]
  // ... all tenant-scoped models
}
```

### 2.2 OrganizationId on All Data Models

Every business model gets an optional `organizationId`:

```prisma
model Supplier {
  // ... existing fields ...
  organizationId Int?
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

For now, nullable. When `null`, data is visible across all orgs (master scope).

### 2.3 Tenant Resolution

`TenantMiddleware` (Express-compatible):

```
Priority:
1. x-organization-id header
2. ?org= query parameter
3. Subdomain: <slug>.localhost:3000
```

Attaches to `request.organizationContext`.

### 2.4 Query Filtering

Prisma service mixin or base service that auto-filters by `organizationId`:

```typescript
class BaseService {
  protected organizationFilter(context: OrgContext): PrismaFilter {
    if (context?.isSuperAdmin) return {};
    return { organizationId: context?.organizationId ?? null };
  }
}
```

### 2.5 Bootstrap Flow

On first-ever startup (no users in DB), redirect to setup wizard:

```
GET /setup → Bootstrap page
  → Create first Organization
  → Create first User with role = master
  → Generates setup token (similar to saas-auth setup-token schema)
```

---

## Phase 3 — Invites & User Management

### 3.1 Invite Model

```prisma
model Invite {
  id             Int      @id @default(autoincrement())
  code           String   @unique // 32-byte hex
  email          String
  organizationId Int
  roleId         Int
  invitedById    Int
  expiresAt      DateTime // 7 days from creation
  used           Boolean  @default(false)
  createdAt      DateTime @default(now())
}
```

### 3.2 Invite Flow

```
Admin → POST /admin/invites { email, roleId }
  → Creates invite record, sends email (or returns code)
  
User → POST /auth/accept-invite { code, firstName, lastName, password }
  → Validates invite
  → Creates user, marks invite as used
  → Returns access + refresh tokens
```

### 3.3 User Management Enhancements

- Admin can deactivate/reactivate users
- Admin can revoke all sessions for a user
- `mustChangePassword` for admin-created users

---

## Phase 4 — Subscription Gating (Future)

### 4.1 Plan Model

```prisma
model Plan {
  id          Int      @id @default(autoincrement())
  name        String   @unique // "free", "pro", "enterprise"
  label       String
  amount      Int      // cents
  currency    String   @default("usd")
  interval    String   // "month" | "year"
  features    String   // JSON array: ["multi_currency", "advanced_reports", ...]
  maxUsers    Int      @default(5)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

### 4.2 Feature Gating

```typescript
// Decorator
@RequiresFeature('multi_currency')
```

Backend guard checks organization's plan features array. Returns 403 if feature not available.

Can be implemented later without breaking existing code — just return `true` from guard when no plan system is active.

---

## File Change Inventory

### Prisma Schema
| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add Organization model, RefreshToken model, Invite model, Plan model; update User; add organizationId to all business models |

### Backend — New Modules
| File | Purpose |
|---|---|
| `backend/src/modules/auth/strategies/local.strategy.ts` | Email + password validation |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | JWT extraction + validation |
| `backend/src/modules/auth/guards/jwt-auth.guard.ts` | Global guard, checks @Public() |
| `backend/src/modules/auth/guards/roles.guard.ts` | Reads from JWT payload |
| `backend/src/modules/auth/decorators/public.decorator.ts` | Skip auth |
| `backend/src/modules/tenant/tenant.middleware.ts` | Org resolution (header/query/subdomain) |
| `backend/src/modules/bootstrap/` | Setup wizard |
| `backend/src/modules/admin/` | Invite, user management |
| `backend/src/common/repositories/base.repository.ts` | Org-aware base queries |

### Backend — Modified Modules
| File | Change |
|---|---|
| `backend/src/modules/auth/auth.service.ts` | Refresh token rotation, change password |
| `backend/src/modules/auth/auth.controller.ts` | New endpoints (refresh, change-password) |
| `backend/src/modules/auth/auth.factory.ts` | Token pair generation |
| `backend/src/modules/users/users.service.ts` | Org-scoped queries |
| `backend/src/app.module.ts` | New module imports, global providers |
| `backend/src/common/guards/auth.guard.ts` | Replace with JwtAuthGuard |
| `backend/src/common/guards/roles.guard.ts` | Read role from JWT payload |

### Frontend — Provider / API
| File | Change |
|---|---|
| `frontend/src/providers/auth-provider.tsx` | Add refreshToken, auto-refresh, changePassword |
| `frontend/src/lib/api/api-client.ts` | Interceptor for refresh on 401 |
| `frontend/src/features/auth/services/auth.service.ts` | Refresh, change-password, accept-invite |
| `frontend/src/features/auth/login-form.tsx` | Email instead of userName |

### Frontend — Auth Pages (New)
| File | Purpose |
|---|---|
| `frontend/src/app/(auth)/change-password/page.tsx` | Force password change |
| `frontend/src/app/(auth)/accept-invite/page.tsx` | Invite acceptance |
| `frontend/src/app/(auth)/setup/page.tsx` | First-org bootstrap |

---

## Migration Order

1. **Prisma**: User model changes, create RefreshToken, Organization (nullable FK on User, not on other models yet)
2. **Backend auth**: Local + JWT strategies, refresh token rotation, new endpoints
3. **Frontend auth provider**: Refresh token support, auto-refresh interceptor
4. **Prisma**: Add organizationId to all business models
5. **Tenant middleware**: Resolution + org-scoped queries
6. **Backend admin**: Invites, user management
7. **Frontend**: Bootstrap flow, invite flow, force password change
8. **Plans/subscriptions**: Optional, implement when needed
