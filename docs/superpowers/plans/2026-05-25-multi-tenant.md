# Multi-Tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-tenant isolation, org-scoped auth, admin panel, plan gating, and payments (Pago Movil + Stripe) to GLAdmin.

**Architecture:** Row-level `organizationId` on all business tables, filtered transparently via Prisma `$use` middleware. Per-org roles via `UserOrganization` join table. Org picker after login. Payments via Pago Movil (Venezuela) and Stripe.

**Tech Stack:** NestJS, Prisma, PostgreSQL (target), Next.js App Router, Tailwind v4, shadcn/ui v4

---

## File Structure

### Backend — New Modules

| File | Purpose |
|---|---|
| `backend/src/modules/tenant/tenant.middleware.ts` | Resolves org from header/cookie/JWT |
| `backend/src/modules/tenant/tenant.decorator.ts` | `@TenantContext()` param decorator |
| `backend/src/modules/tenant/tenant.module.ts` | Module exporting middleware |
| `backend/src/modules/tenant/context.service.ts` | AsyncLocalStorage-based org context |
| `backend/src/modules/admin/admin.module.ts` | Admin user management |
| `backend/src/modules/admin/admin.controller.ts` | Admin endpoints |
| `backend/src/modules/admin/admin.service.ts` | Admin business logic |
| `backend/src/modules/admin/dto/create-user.dto.ts` | Admin create user DTO |
| `backend/src/modules/admin/dto/invite-user.dto.ts` | Admin invite DTO |
| `backend/src/modules/subscription/subscription.module.ts` | Plans + billing |
| `backend/src/modules/subscription/subscription.controller.ts` | Plan/subscription endpoints |
| `backend/src/modules/subscription/subscription.service.ts` | Plan logic + feature checks |
| `backend/src/modules/subscription/stripe.service.ts` | Stripe integration |
| `backend/src/modules/subscription/pago-movil.service.ts` | Pago Movil integration |
| `backend/src/modules/subscription/pago-movil.controller.ts` | Pago Movil endpoints |
| `backend/src/modules/subscription/webhooks.controller.ts` | Stripe webhook |
| `backend/src/modules/subscription/guards/plan.guard.ts` | `@RequiresFeature()` guard |
| `backend/src/modules/subscription/decorators/requires-feature.decorator.ts` | Decorator for plan guard |
| `backend/src/modules/subscription/dto/pago-movil.dto.ts` | Pago Movil DTOs |
| `backend/src/modules/bootstrap/bootstrap.module.ts` | First-run setup |
| `backend/src/modules/bootstrap/bootstrap.controller.ts` | Setup endpoints |
| `backend/src/modules/bootstrap/bootstrap.service.ts` | Setup logic |

### Backend — Modified Files

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add Organization, Plan, UserOrganization, Invite, PagoMovilConfig, PagoMovilTransaction; add organizationId to all business models; add currentOrganizationId to User |
| `backend/prisma/seed.ts` | Seed default org, Free plan, UserOrganization for existing users |
| `backend/src/app.module.ts` | Import TenantModule, AdminModule, SubscriptionModule, BootstrapModule |
| `backend/src/modules/auth/auth.service.ts` | Login returns orgs; add select-org flow; JWT includes orgId + orgRoleId |
| `backend/src/modules/auth/auth.controller.ts` | Add POST /auth/select-org |
| `backend/src/common/guards/auth.guard.ts` | Pass org context to JWT payload |
| `backend/src/common/guards/roles.guard.ts` | Read orgRoleId from JWT |
| `backend/src/main.ts` | Register TenantMiddleware globally |

### Frontend — New Files

| File | Purpose |
|---|---|
| `frontend/src/providers/org-provider.tsx` | OrgContext React provider |
| `frontend/src/app/(dashboard)/admin/page.tsx` | Admin panel page (user mgmt) |
| `frontend/src/app/(dashboard)/admin/users/page.tsx` | User list under admin |
| `frontend/src/app/(dashboard)/billing/page.tsx` | Billing/plan page |
| `frontend/src/app/(auth)/org-picker/page.tsx` | Org picker after login |
| `frontend/src/app/(auth)/setup/page.tsx` | First-run setup wizard |
| `frontend/src/components/ui/require-feature.tsx` | Feature gate component |

### Frontend — Modified Files

| File | Change |
|---|---|
| `frontend/src/providers/auth-provider.tsx` | Store orgs list, current org, add selectOrg |
| `frontend/src/lib/api/api-client.ts` | Add request interceptor for org header |
| `frontend/src/app/(dashboard)/layout.tsx` | Add org switcher to sidebar |
| `frontend/src/app/(dashboard)/settings/page.tsx` | Add org settings tab |
| `frontend/src/features/users/services/user.service.ts` | Scope to org |
| `frontend/src/features/users/hooks/use-users.ts` | Scope to org |
| `frontend/src/components/ui/role-guard.tsx` | Use org-scoped role |

---

## Phase 1: Foundation

### Task 1.1: Add Prisma models

**File:** `backend/prisma/schema.prisma`

Add new models after the existing `Role` model:

```prisma
// ────────────────────────────────────────────
// ORGANIZATION (Multi-tenant core)
// ────────────────────────────────────────────
model Organization {
  id        Int      @id @default(autoincrement())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  settings  String?
  planId    Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  plan                  Plan?                    @relation(fields: [planId], references: [id])
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
  name      String   @unique
  label     String
  amount    Int                  // cents
  currency  String   @default("usd")
  interval  String               // "month" | "year" | "lifetime"
  features  String               // JSON array string
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
  code           String   @unique
  email          String
  organizationId Int
  roleId         Int
  invitedById    Int
  expiresAt      DateTime
  used           Boolean  @default(false)
  createdAt      DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id])
  role         Role         @relation(fields: [roleId], references: [id])
  invitedBy    User         @relation(fields: [invitedById], references: [id])
}

model PagoMovilConfig {
  id             Int      @id @default(autoincrement())
  organizationId Int      @unique
  phoneNumber    String
  bankId         String
  idNumber       String
  exchangeRate   Decimal  @db.Decimal(10, 2)
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
  phoneNumber    String
  reference      String
  proofImage     String?
  status         String   @default("pending")
  reviewedBy     Int?
  reviewedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
}
```

Add `organizationId` and `currentOrganizationId` to existing `User`:

```prisma
model User {
  id                     Int      @id @default(autoincrement())
  email                  String   @unique
  userName               String   @unique
  password               String
  firstName              String
  lastName               String
  idRole                 Int
  mustChangePassword     Boolean  @default(false)
  lastLogin              DateTime?
  isActive               Boolean  @default(true)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  currentOrganizationId  Int?

  role                   Role               @relation(fields: [idRole], references: [id])
  refreshTokens          RefreshToken[]
  currentOrganization    Organization?      @relation("CurrentOrg", fields: [currentOrganizationId], references: [id])
  organizations          UserOrganization[]
  invites                Invite[]           @relation("InvitedBy")
}
```

Add `organizationId` to every business model. Example for Supplier:

```prisma
model Supplier {
  id                  Int      @id @default(autoincrement())
  companyName         String
  businessName        String?
  fiscalAddress       String?
  taxId               String?
  firstName           String?
  lastName            String?
  address             String?
  phoneNumber         String?
  email               String?
  taxWithholdingAgent Boolean  @default(false)
  available           Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  organizationId      Int

  organization        Organization          @relation(fields: [organizationId], references: [id])
  stocks              Stock[]
  purchaseOrders      PurchaseOrder[]
  withholdingRecords  WithholdingRecord[]
}
```

Apply the same `organizationId Int` + `organization Organization @relation(fields: [organizationId], references: [id])` to all: Customer, Company, Product, Tax, Batch, Stock, PurchaseOrder, PurchaseOrderDet, Sale, SalesDet, ExchangeRate, WithholdingRecord, AccountsPayable, AccountsReceivable.

- [ ] **Step 1**: Add new models and update existing models in `schema.prisma`
- [ ] **Step 2**: Run `prisma db push --force-reset --accept-data-loss` and re-seed
- [ ] **Step 3**: Run `pnpm typecheck` on backend

### Task 1.2: Tenant context service

**Files:**
- Create: `backend/src/modules/tenant/context.service.ts`
- Create: `backend/src/modules/tenant/tenant.module.ts`
- Create: `backend/src/modules/tenant/tenant.middleware.ts`

- [ ] **Step 1: Create ContextService**

```ts
// backend/src/modules/tenant/context.service.ts
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  organizationId: number;
  organizationSlug?: string;
  isSuperAdmin?: boolean;
  plan?: { name: string; features: string[] };
}

@Injectable()
export class ContextService {
  private storage = new AsyncLocalStorage<TenantContext>();

  run(context: TenantContext, fn: () => Promise<void>) {
    return this.storage.run(context, fn);
  }

  getCurrent(): TenantContext | undefined {
    return this.storage.getStore();
  }
}
```

- [ ] **Step 2: Create TenantModule**

```ts
// backend/src/modules/tenant/tenant.module.ts
import { Module, Global } from '@nestjs/common';
import { ContextService } from './context.service';

@Global()
@Module({
  providers: [ContextService],
  exports: [ContextService],
})
export class TenantModule {}
```

- [ ] **Step 3: Create TenantMiddleware**

```ts
// backend/src/modules/tenant/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ContextService, TenantContext } from './context.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: ContextService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const orgId = this.resolveOrgId(req);
    if (!orgId) {
      await this.contextService.run({} as TenantContext, () => next());
      return;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId, isActive: true },
      include: { plan: true },
    });

    if (!org) {
      await this.contextService.run({} as TenantContext, () => next());
      return;
    }

    const ctx: TenantContext = {
      organizationId: org.id,
      organizationSlug: org.slug,
      plan: org.plan ? { name: org.plan.name, features: JSON.parse(org.plan.features) } : undefined,
    };

    await this.contextService.run(ctx, () => next());
  }

  private resolveOrgId(req: Request): number | undefined {
    const header = req.headers['x-organization-id'];
    if (header) return parseInt(header as string, 10);

    const cookie = req.cookies?.['organization_id'];
    if (cookie) return parseInt(cookie, 10);

    const jwtOrg = (req as any).user?.orgId;
    if (jwtOrg) return jwtOrg;

    return undefined;
  }
}
```

- [ ] **Step 4: Register middleware in main.ts**

```ts
// backend/src/main.ts
app.use(cookieParser()); // add import
```

```ts
// backend/src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './modules/tenant/tenant.middleware';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
```

- [ ] **Step 5: Typecheck**

### Task 1.3: Prisma middleware

**File:** Modify `backend/src/shared/prisma/prisma.service.ts`

- [ ] **Step 1: Add `$use` middleware**

```ts
// Inside PrismaService constructor or onModuleInit
constructor() {
  super();

  this.$use(async (params, next) => {
    const ctx = this.contextService?.getCurrent();
    if (!ctx || ctx.isSuperAdmin || !ctx.organizationId) return next(params);
    if (params.model === 'User') return next(params);

    const businessModels = [
      'Supplier', 'Customer', 'Company', 'Product', 'Tax',
      'Batch', 'Stock', 'PurchaseOrder', 'PurchaseOrderDet',
      'Sale', 'SalesDet', 'ExchangeRate', 'WithholdingRecord',
      'AccountsPayable', 'AccountsReceivable',
      'PagoMovilConfig', 'PagoMovilTransaction', 'Invite',
    ];
    if (!businessModels.includes(params.model)) return next(params);

    if (params.action === 'create') {
      if (!params.args.data?.organizationId) {
        params.args.data.organizationId = ctx.organizationId;
      }
      return next(params);
    }

    const actionsWithWhere = ['findUnique', 'findFirst', 'findMany', 'update', 'delete', 'updateMany', 'deleteMany'];
    if (actionsWithWhere.includes(params.action)) {
      params.args.where = { ...params.args.where, organizationId: ctx.organizationId };
    }

    return next(params);
  });
}
```

PrismaService needs access to `ContextService`. Inject it:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ContextService } from '../../modules/tenant/context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly contextService?: ContextService) {
    super();
    this.installMiddleware();
  }

  private installMiddleware() {
    this.$use(async (params, next) => {
      // ... middleware code from above ...
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 2: Typecheck**

### Task 1.4: Seed default org + Free plan

**File:** `backend/prisma/seed.ts`

- [ ] **Step 1: Add seed data after existing seeds**

```ts
// At top of seed file, after currencies creation:

// ── Plans ──
await prisma.plan.upsert({
  where: { name: 'free' },
  update: {},
  create: {
    name: 'free',
    label: 'Free',
    amount: 0,
    currency: 'usd',
    interval: 'lifetime',
    features: JSON.stringify(['basic_auth', 'multi_currency', 'basic_reports']),
    maxUsers: 5,
  },
});

const freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });

// ── Default Organization ──
await prisma.organization.upsert({
  where: { id: 1 },
  update: {},
  create: {
    id: 1,
    name: 'Default Organization',
    slug: 'default',
    isActive: true,
    settings: JSON.stringify({ requireInvite: false, allowPublicSignup: false }),
    planId: freePlan!.id,
  },
});

// ── Assign existing users to org ──
const users = await prisma.user.findMany();
for (const user of users) {
  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: 1 } },
    update: {},
    create: {
      userId: user.id,
      organizationId: 1,
      roleId: user.idRole,
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { currentOrganizationId: 1 },
  });
}
```

- [ ] **Step 2: Run seed**
```bash
cd backend && npx prisma db push --force-reset --accept-data-loss && npx prisma db seed
```

- [ ] **Step 3: Verify**
```bash
cd backend && npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM UserOrganization; SELECT COUNT(*) FROM Organization; SELECT COUNT(*) FROM Plan;"
```

---

## Phase 2: Auth + Org Picker

### Task 2.1: Auth service — login returns orgs, select-org endpoint

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Update login response**

```ts
// In auth.service.ts, login() method
// After successful validation, fetch user's orgs

async login(dto: CredentialsDto) {
  const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { role: true } });
  if (!user) throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
  if (!user.isActive) throw new UnauthorizedException('AUTH.USER_INACTIVE');

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');

  const tokens = await this.generateTokens(user);

  // Fetch user's organizations
  const memberships = await this.prisma.userOrganization.findMany({
    where: { userId: user.id },
    include: { organization: { include: { plan: true } } },
  });

  const organizations = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    plan: m.organization.plan ? { name: m.organization.plan.name, label: m.organization.plan.label } : null,
    role: m.role.slug,
  }));

  // Update lastLogin
  await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  return {
    data: {
      ...tokens,
      user: { ...this.sanitizeUser(user) },
      organizations,
    },
    message: null,
    errors: null,
    statusCode: 200,
  };
}
```

- [ ] **Step 2: Add select-org method**

```ts
// In auth.service.ts
async selectOrg(userId: number, organizationId: number) {
  const membership = await this.prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { role: true, organization: true },
  });
  if (!membership) throw new ForbiddenException('AUTH.NOT_ORG_MEMBER');

  // Update user's current org
  await this.prisma.user.update({
    where: { id: userId },
    data: { currentOrganizationId: organizationId },
  });

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  // Generate JWT with org context
  const payload = {
    sub: user!.id,
    email: user!.email,
    role: membership.role.slug,
    orgId: organizationId,
    orgRole: membership.role.slug,
    type: 'access',
  };
  const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

  const refreshToken = await this.createRefreshToken(user!.id);

  return {
    data: {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user!),
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
    },
  };
}
```

- [ ] **Step 3: Add controller endpoint**

```ts
// In auth.controller.ts
@Post('select-org')
@UseGuards(JwtAuthGuard)
async selectOrg(@Req() req: any, @Body('organizationId') organizationId: number) {
  return this.authService.selectOrg(req.user.sub, organizationId);
}
```

- [ ] **Step 4: Typecheck**

### Task 2.2: JWT includes org context + RolesGuard reads org role

**Files:**
- Modify: `backend/src/common/guards/auth.guard.ts`
- Modify: `backend/src/common/guards/roles.guard.ts`

- [ ] **Step 1: Update AuthGuard to include org in JWT payload**

In the `validate` method (or where JWT is signed), ensure `orgId` and `orgRole` are in the payload. This is already done in Task 2.1.

- [ ] **Step 2: Update RolesGuard to read org-scoped role**

```ts
// backend/src/common/guards/roles.guard.ts
canActivate(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest();
  const user = request.user;

  // Check @MinLevel() first
  const minLevel = this.reflector.get<number>('minLevel', context.getHandler());
  if (minLevel !== undefined) {
    const role = user?.orgRole || user?.role;
    const level = ROLE_LEVEL[role];
    return level >= minLevel;
  }

  // Fallback to @Roles()
  const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
  if (!requiredRoles) return true;
  const userRole = user?.orgRole || user?.role;
  return requiredRoles.includes(userRole);
}
```

- [ ] **Step 3: Typecheck**

### Task 2.3: Frontend org picker

**Files:**
- Modify: `frontend/src/providers/auth-provider.tsx`
- Create: `frontend/src/app/(auth)/org-picker/page.tsx`
- Modify: `frontend/src/lib/api/api-client.ts`

- [ ] **Step 1: Update AuthProvider to store orgs and support selectOrg**

```ts
// Inside auth-provider.tsx
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  organizations: { id: number; name: string; slug: string; plan: any; role: string }[];
  currentOrg: { id: number; name: string; slug: string } | null;
}

// Add selectOrg method
const selectOrg = async (organizationId: number) => {
  const response = await authService.selectOrg(organizationId);
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('refreshToken', response.refreshToken);
  setState(prev => ({
    ...prev,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
    currentOrg: response.organization,
  }));
};
```

- [ ] **Step 2: Create org picker page**

```tsx
// frontend/src/app/(auth)/org-picker/page.tsx
'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';

export default function OrgPickerPage() {
  const { organizations, selectOrg } = useAuth();
  const router = useRouter();

  const handleSelect = async (orgId: number) => {
    await selectOrg(orgId);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-center">Select Organization</h2>
        <div className="space-y-3">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelect(org.id)}
              className="w-full p-4 rounded-lg border flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <Building2 className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-muted-foreground">{org.plan?.label || 'No plan'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add org header interceptor in api-client.ts**

```ts
// In the request interceptor, after token
const org = localStorage.getItem('currentOrgId');
if (org) {
  config.headers['x-organization-id'] = org;
}
```

- [ ] **Step 4: Create `authService.selectOrg`**

```ts
// In auth.service.ts on frontend
async selectOrg(organizationId: number): Promise<LoginResponse> {
  const response = await apiClient.post('/auth/select-org', { organizationId });
  return response.data.data;
}
```

- [ ] **Step 5: Typecheck**

---

## Phase 3: Admin Panel (Backend)

### Task 3.1: Admin module — create, list, deactivate users

**Files:**
- Create: `backend/src/modules/admin/admin.module.ts`
- Create: `backend/src/modules/admin/admin.controller.ts`
- Create: `backend/src/modules/admin/admin.service.ts`
- Create: `backend/src/modules/admin/dto/create-user.dto.ts`
- Create: `backend/src/modules/admin/dto/invite-user.dto.ts`

- [ ] **Step 1: Create DTOs**

```ts
// backend/src/modules/admin/dto/create-user.dto.ts
import { IsString, IsEmail, IsInt, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail() email: string;
  @IsString() firstName: string;
  @IsString() lastName: string;
  @IsInt() roleId: number;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsString() userName?: string;
}

// backend/src/modules/admin/dto/invite-user.dto.ts
import { IsEmail, IsInt } from 'class-validator';

export class InviteUserDto {
  @IsEmail() email: string;
  @IsInt() roleId: number;
}
```

- [ ] **Step 2: Create AdminService**

```ts
// backend/src/modules/admin/admin.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private getOrgId(): number {
    const ctx = this.context.getCurrent();
    if (!ctx?.organizationId) throw new ForbiddenException('TENANT.REQUIRED');
    return ctx.organizationId;
  }

  async createUser(dto: CreateUserDto) {
    const orgId = this.getOrgId();
    const password = dto.password || crypto.randomBytes(12).toString('hex');
    const hashed = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        userName: dto.userName || dto.email.split('@')[0],
        password: hashed,
        firstName: dto.firstName,
        lastName: dto.lastName,
        idRole: dto.roleId,
        mustChangePassword: !!dto.password,
        currentOrganizationId: orgId,
      },
    });

    await this.prisma.userOrganization.create({
      data: { userId: user.id, organizationId: orgId, roleId: dto.roleId },
    });

    return { data: this.sanitizeUser(user), message: 'ADMIN.USER_CREATED' };
  }

  async listUsers() {
    const orgId = this.getOrgId();
    const memberships = await this.prisma.userOrganization.findMany({
      where: { organizationId: orgId },
      include: { user: { include: { role: true } }, role: true },
    });
    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: m.role,
      isActive: m.user.isActive,
      createdAt: m.user.createdAt,
    }));
  }

  async deactivateUser(userId: number) {
    const orgId = this.getOrgId();
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.USER_NOT_IN_ORG');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { data: null, message: 'ADMIN.USER_DEACTIVATED' };
  }

  async reactivateUser(userId: number) {
    const orgId = this.getOrgId();
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.USER_NOT_IN_ORG');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    return { data: null, message: 'ADMIN.USER_REACTIVATED' };
  }

  async updateUserRole(userId: number, roleId: number) {
    const orgId = this.getOrgId();
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.USER_NOT_IN_ORG');

    await this.prisma.userOrganization.update({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      data: { roleId },
    });
    return { data: null, message: 'ADMIN.ROLE_UPDATED' };
  }

  async getStats() {
    const orgId = this.getOrgId();
    const total = await this.prisma.userOrganization.count({ where: { organizationId: orgId } });
    return { data: { totalUsers: total }, message: null };
  }

  async createInvite(dto: InviteUserDto) {
    const orgId = this.getOrgId();
    const code = crypto.randomBytes(32).toString('hex');
    const invite = await this.prisma.invite.create({
      data: {
        code,
        email: dto.email,
        organizationId: orgId,
        roleId: dto.roleId,
        invitedById: 0, // will be set from JWT
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { data: { code: invite.code, email: invite.email }, message: 'ADMIN.INVITE_CREATED' };
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
```

- [ ] **Step 3: Create AdminController**

```ts
// backend/src/modules/admin/admin.controller.ts
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles('master', 'executive', 'manager')
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users')
  @Roles('master', 'executive')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id/role')
  @Roles('master', 'executive')
  async updateUserRole(@Param('id') id: string, @Body('roleId') roleId: number) {
    return this.adminService.updateUserRole(parseInt(id), roleId);
  }

  @Post('users/:id/deactivate')
  @Roles('master', 'executive')
  async deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(parseInt(id));
  }

  @Post('users/:id/reactivate')
  @Roles('master', 'executive')
  async reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(parseInt(id));
  }

  @Post('invites')
  @Roles('master', 'executive')
  async createInvite(@Body() dto: InviteUserDto) {
    return this.adminService.createInvite(dto);
  }

  @Get('stats')
  @Roles('master', 'executive', 'manager')
  async getStats() {
    return this.adminService.getStats();
  }
}
```

- [ ] **Step 4: Create AdminModule and register in app.module.ts**

- [ ] **Step 5: Typecheck**

---

## Phase 4: Frontend Admin + Org Context

### Task 4.1: OrgProvider + sidebar org switcher

**Files:**
- Create: `frontend/src/providers/org-provider.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create OrgProvider**

```tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './auth-provider';

interface OrgContextType {
  currentOrg: { id: number; name: string; slug: string } | null;
  selectOrg: (orgId: number) => Promise<void>;
  organizations: { id: number; name: string; slug: string }[];
}

const OrgContext = createContext<OrgContextType>({} as OrgContextType);

export function OrgProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return (
    <OrgContext.Provider value={{
      currentOrg: (auth as any).currentOrg,
      selectOrg: (auth as any).selectOrg,
      organizations: (auth as any).organizations || [],
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
```

- [ ] **Step 2: Add org switcher to sidebar in layout.tsx**

In the sidebar header area (above the nav groups), add:

```tsx
{currentOrg && (
  <div className="flex items-center gap-2 px-2 py-2 border-b">
    <Building2 className="h-4 w-4 text-muted-foreground" />
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium truncate">{currentOrg.name}</div>
      <div className="text-xs text-muted-foreground">
        {plan?.label || 'Free'}
      </div>
    </div>
    {organizations.length > 1 && (
      <select
        className="text-xs bg-transparent border-none cursor-pointer"
        onChange={(e) => selectOrg(parseInt(e.target.value))}
        value={currentOrg.id}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </select>
    )}
  </div>
)}
```

- [ ] **Step 3: Typecheck**

### Task 4.2: Admin page (frontend)

**File:** `frontend/src/app/(dashboard)/admin/users/page.tsx`

- [ ] **Step 1: Create admin users page**

Standard CRUD page following existing patterns (DataTable, SlideForm). Lists users in current org, shows role, allows create/deactivate/change-role. Modeled after existing `users/page.tsx`.

---

## Phase 5: Plans + Feature Gating

### Task 5.1: PlanGuard + @RequiresFeature

- [ ] **Step 1: Create decorator**

```ts
// backend/src/modules/subscription/decorators/requires-feature.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const REQUIRES_FEATURE_KEY = 'requiresFeature';
export const RequiresFeature = (feature: string) => SetMetadata(REQUIRES_FEATURE_KEY, feature);
```

- [ ] **Step 2: Create PlanGuard**

```ts
// backend/src/modules/subscription/guards/plan.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';
import { ContextService } from '../../tenant/context.service';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly context: ContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.get<string>(REQUIRES_FEATURE_KEY, context.getHandler());
    if (!requiredFeature) return true;

    const ctx = this.context.getCurrent();
    if (!ctx?.plan) throw new ForbiddenException('PLAN.NO_PLAN');

    const features: string[] = ctx.plan.features;
    if (!features.includes(requiredFeature)) {
      throw new ForbiddenException('PLAN.FEATURE_NOT_AVAILABLE');
    }
    return true;
  }
}
```

- [ ] **Step 3: Frontend RequireFeature component**

```tsx
// frontend/src/components/ui/require-feature.tsx
'use client';

import { ReactNode } from 'react';
import { useOrg } from '@/providers/org-provider';

export function RequireFeature({ feature, children, fallback }: {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { currentOrg } = useOrg();
  const features: string[] = (currentOrg as any)?.features || [];
  if (features.includes(feature)) return <>{children}</>;
  return <>{fallback || null}</>;
}
```

---

## Phase 6: Payments

### Task 6.1: Pago Movil backend

**File:** `backend/src/modules/subscription/pago-movil.service.ts`
**File:** `backend/src/modules/subscription/pago-movil.controller.ts`

Standard CRUD + admin review flow. See saas-auth reference:

```
GET  /payments/pago-movil/banks          → List Venezuelan banks
GET  /payments/pago-movil/config         → Org's config
POST /payments/pago-movil/initiate       → Create transaction
POST /payments/pago-movil/submit-proof   → Upload receipt
GET  /payments/pago-movil/my-transactions → User history
POST /payments/pago-movil/admin/review   → Approve/reject
POST /payments/pago-movil/admin/exchange-rate → Set rate
```

### Task 6.2: Stripe integration

**File:** `backend/src/modules/subscription/stripe.service.ts`
**File:** `backend/src/modules/subscription/webhooks.controller.ts`

### Task 6.3: Frontend billing page

**File:** `frontend/src/app/(dashboard)/billing/page.tsx`

---

## Phase 7: Bootstrap

### Task 7.1: Bootstrap module

```ts
// backend/src/modules/bootstrap/bootstrap.controller.ts
@Controller('api/bootstrap')
export class BootstrapController {
  @Get('status')
  async status() {
    const count = await this.prisma.organization.count();
    return { data: { requiresSetup: count === 0 } };
  }

  @Post('setup')
  async setup(@Body() dto: SetupDto) {
    // Create org, create admin user, assign membership
    // Return JWT
  }
}
```

### Task 7.2: Frontend setup wizard

**File:** `frontend/src/app/(auth)/setup/page.tsx`

Redirect to org + admin account creation form on first visit.

---

## Self-Review

### Spec coverage
- Multi-tenant data model ✅ (Task 1.1)
- Prisma middleware filtering ✅ (Task 1.3)
- Tenant resolution (header/cookie/JWT) ✅ (Task 1.2)
- Per-org roles via UserOrganization ✅ (Task 1.1, 2.2)
- Login returns orgs list ✅ (Task 2.1)
- Org picker after login ✅ (Task 2.3)
- JWT includes org context ✅ (Task 2.1, 2.2)
- Admin user management (create, list, deactivate, invites) ✅ (Task 3.1)
- Frontend org context + sidebar switcher ✅ (Task 4.1)
- Frontend admin page ✅ (Task 4.2)
- Plan model + feature gating ✅ (Task 5.1)
- Pago Movil payments ✅ (Task 6.1)
- Stripe integration ✅ (Task 6.2)
- Bootstrap / setup wizard ✅ (Task 7.1, 7.2)
- Data migration (seed default org, backfill) ✅ (Task 1.4)

### Gaps
- UsersService scoping (GET /api/users currently lists all users) — covered by admin module but existing users page needs updating. Added Phases 3-4.
- i18n keys for new pages — implied but not explicitly tasked. Each frontend task should add i18n keys.
- Tests — deferred per project convention (no test framework set up yet).

### Type consistency
- All `organizationId` fields are `Int` (matches existing `id` pattern)
- `UserOrganization` composite PK uses `@@id([userId, organizationId])` — matches Prisma conventions
- JWT payload `orgRole` used consistently across AuthGuard and RolesGuard
- `ContextService.getCurrent()` returns `TenantContext | undefined` — handles edge case
