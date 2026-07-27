# Role Separation Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate system roles (master, admin) from org roles (executive, manager, employee) by adding `type` + `level` to the Role model, splitting the guard logic, moving hardcoded levels to DB, and fixing `currentOrganizationId` dangling reference.

**Architecture:** Single `Role` table gets `type` (system/org) + `level` (100/70/80/60/40). Two guards: `@MinLevel` checks system role, `@MinOrgLevel` checks org role. Role levels read from DB with cache instead of hardcoded dicts.

**Tech Stack:** NestJS, Prisma, Next.js

---

### Task 1: Add `type` and `level` to Prisma Role model

**Files:**
- Modify: `backend/prisma/schema.prisma:17-29`

- [ ] **Add `type` and `level` fields**

```prisma
model Role {
  id        String   @id @default(uuid()) @db.Uuid @map("id")
  name      String   @map("name")
  slug      String   @unique @map("slug")
  type      String   @default("org") @map("type")
  level     Int      @default(0) @map("level")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users             User[]
  userOrganizations UserOrganization[]
  invites           Invite[]

  @@map("roles")
}
```

- [ ] **Run prisma migrate**

```bash
cd backend && npx prisma migrate dev --name add_role_type_and_level
```

---

### Task 2: Update bootstrap to seed all 5 roles

**Files:**
- Modify: `backend/src/modules/bootstrap/bootstrap.service.ts:52-58`

- [ ] **Replace single-role creation with upsert of all 5 roles**

```typescript
const rolesData = [
  { name: 'Master', slug: 'master', type: 'system', level: 100 },
  { name: 'Admin', slug: 'admin', type: 'system', level: 70 },
  { name: 'Executive', slug: 'executive', type: 'org', level: 80 },
  { name: 'Manager', slug: 'manager', type: 'org', level: 60 },
  { name: 'Employee', slug: 'employee', type: 'org', level: 40 },
];

let masterRole: { id: string } | null = null;
for (const r of rolesData) {
  const role = await tx.role.upsert({
    where: { slug: r.slug },
    create: r,
    update: {},
  });
  if (r.slug === 'master') masterRole = role;
}
```

Replace the old `let role = await tx.role.findFirst({ where: { slug: 'master' } }); if (!role) ...` block.

- [ ] **Update the references** — `role.id` becomes `masterRole!.id` throughout the existing `BootstrapService.setup()` logic.

- [ ] **Run typecheck**

```bash
cd backend && npx tsc --noEmit
```

---

### Task 3: Update backend role-hierarchy to read from DB with cache

**Files:**
- Modify: `backend/src/common/auth/role-hierarchy.ts`

- [ ] **Replace hardcoded `ROLE_LEVEL` dict with DB-backed cache**

```typescript
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

const ROLE_LEVEL_CACHE_TTL = 60;

let instance: RoleHierarchyService | null = null;

@Injectable()
export class RoleHierarchyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    instance = this;
  }

  static async getLevel(slug: string): Promise<number | undefined> {
    if (!instance) return undefined;
    return instance.getLevel(slug);
  }

  async getLevel(slug: string): Promise<number | undefined> {
    const cacheKey = `role_level:${slug}`;
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== undefined) return cached;

    const role = await this.prisma.role.findUnique({ where: { slug } });
    if (!role) return undefined;

    await this.cache.set(cacheKey, role.level, ROLE_LEVEL_CACHE_TTL);
    return role.level;
  }
}

export async function canAssignRole(actorSlug: string, targetSlug: string): Promise<boolean> {
  const actorLevel = await RoleHierarchyService.getLevel(actorSlug);
  const targetLevel = await RoleHierarchyService.getLevel(targetSlug);
  if (actorLevel === undefined || targetLevel === undefined) return false;
  if (actorSlug === 'master') return true;
  return targetLevel < actorLevel;
}

export async function assertCanAssignRole(actorSlug: string, targetSlug: string): Promise<void> {
  if (!(await canAssignRole(actorSlug, targetSlug))) {
    throw new ForbiddenException('USER.ROLE_HIERARCHY');
  }
}
```

Make these functions async since they now do DB lookups.

- [ ] **Update all callers of `assertCanAssignRole` and `canAssignRole` to `await` them**

Files to update:
- `backend/src/modules/users/users.service.ts:63` — `await assertCanAssignRole(...)`
- `backend/src/modules/admin/admin.service.ts` — any usage of `assertCanAssignRole`

- [ ] **Register `RoleHierarchyService` in the appropriate module** (probably `backend/src/modules/roles/roles.module.ts` since that owns the role domain):

```typescript
// roles.module.ts — add to providers + exports
providers: [RolesService, RoleHierarchyService],
exports: [RolesService, RoleHierarchyService],
```

- [ ] **Import `RolesModule` in modules that use `assertCanAssignRole`** (or alternatively, register `RoleHierarchyService` globally).

The simplest approach: make `RoleHierarchyService` a `@Global()` module or register it in the root `AppModule`. Let's add it to `roles.module.ts` and export it, then import `RolesModule` in `UsersModule` and `AdminModule`.

- [ ] **Run typecheck**

```bash
cd backend && npx tsc --noEmit
```

---

### Task 4: Create `@MinOrgLevel` decorator

**Files:**
- Modify: `backend/src/common/decorators/min-level.decorator.ts`

- [ ] **Add `@MinOrgLevel` decorator**

```typescript
export const MIN_ORG_LEVEL_KEY = 'minOrgLevel';
export const MinOrgLevel = (level: number) => SetMetadata(MIN_ORG_LEVEL_KEY, level);
```

The `ROLE_LEVEL` constant stays as a reference for the numeric values, but it's now just a convenience const — the actual guard logic uses the DB level.

```typescript
export const ROLE_LEVEL = {
  master: 100,
  admin: 70,
  executive: 80,
  manager: 60,
  employee: 40,
} as const;
```

---

### Task 5: Update RolesGuard to handle both system and org

**Files:**
- Modify: `backend/src/common/guards/roles.guard.ts`

- [ ] **Split into two check methods**

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MIN_LEVEL_KEY, MIN_ORG_LEVEL_KEY, ROLE_LEVEL } from '../decorators/min-level.decorator';
import { RoleHierarchyService } from '../auth/role-hierarchy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roleHierarchy: RoleHierarchyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const minLevel = this.reflector.getAllAndOverride<number>(MIN_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const minOrgLevel = this.reflector.getAllAndOverride<number>(MIN_ORG_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request: { user?: { orgRole?: string; role?: string } } = context
      .switchToHttp()
      .getRequest();
    const user = request.user;

    if (minLevel !== undefined) {
      if (!user?.role) throw new ForbiddenException();
      const userLevel = await this.roleHierarchy.getLevel(user.role);
      if (userLevel === undefined || userLevel < minLevel) throw new ForbiddenException();
      return true;
    }

    if (minOrgLevel !== undefined) {
      if (!user?.orgRole) throw new ForbiddenException();
      const orgLevel = await this.roleHierarchy.getLevel(user.orgRole);
      if (orgLevel === undefined || orgLevel < minOrgLevel) throw new ForbiddenException();
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const effectiveRole = user?.orgRole || user?.role;
    if (!effectiveRole) throw new ForbiddenException();
    return requiredRoles.includes(effectiveRole);
  }
}
```

- [ ] **Run typecheck**

```bash
cd backend && npx tsc --noEmit
```

---

### Task 6: Fix `currentOrganizationId` dangling reference in `removeUserFromOrg`

**Files:**
- Modify: `backend/src/modules/admin/admin.service.ts:215-225`

- [ ] **Update `removeUserFromOrg` to clear `currentOrganizationId`**

```typescript
async removeUserFromOrg(orgId: string, userId: string) {
  const membership = await this.prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!membership) throw new NotFoundException('ADMIN.MEMBERSHIP_NOT_FOUND');

  await this.prisma.$transaction(async (tx) => {
    await tx.userOrganization.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    // If the removed org was the user's current org, clear it
    const user = await tx.user.findUnique({ where: { id: userId }, select: { currentOrganizationId: true } });
    if (user?.currentOrganizationId === orgId) {
      await tx.user.update({ where: { id: userId }, data: { currentOrganizationId: null } });
    }
  });
  return { data: null, message: 'ADMIN.USER_REMOVED' };
}
```

---

### Task 7: Update admin controller `@MinLevel` annotations

**Files:**
- Modify: `backend/src/modules/admin/admin-orgs.controller.ts`
- Modify: `backend/src/modules/admin/admin-users.controller.ts`
- Modify: `backend/src/modules/admin/admin-plans.controller.ts`
- Modify: `backend/src/modules/admin/admin-invites.controller.ts`

- [ ] **Change admin controllers to use appropriate levels**

Pattern: non-sensitive ops → `@MinLevel(ROLE_LEVEL.admin)`, sensitive ops → `@MinLevel(ROLE_LEVEL.master)`.

**admin-orgs.controller.ts:**
- `GET /` → `@MinLevel(ROLE_LEVEL.admin)`
- `GET /:id` → `@MinLevel(ROLE_LEVEL.admin)`
- `POST /` → `@MinLevel(ROLE_LEVEL.admin)`
- `PATCH /:id` → `@MinLevel(ROLE_LEVEL.admin)`
- `DELETE /:id` → `@MinLevel(ROLE_LEVEL.master)` (deleting orgs is sensitive)
- All assign/remove/changeRole → `@MinLevel(ROLE_LEVEL.admin)`

**admin-users.controller.ts:**
- `POST /` → `@MinLevel(ROLE_LEVEL.master)` (creating system users includes admins — sensitive)
- `GET /` → `@MinLevel(ROLE_LEVEL.admin)`
- `GET /:id` → `@MinLevel(ROLE_LEVEL.admin)` (assuming it exists)
- `PATCH /:id` → `@MinLevel(ROLE_LEVEL.admin)`
- `DELETE /:id` → `@MinLevel(ROLE_LEVEL.master)` (deactivating system users — sensitive)

**admin-plans.controller.ts:**
- All → `@MinLevel(ROLE_LEVEL.master)` (plans are sensitive)

**admin-invites.controller.ts:**
- All → `@MinLevel(ROLE_LEVEL.admin)`

---

### Task 8: Update users controller to use `@MinOrgLevel`

**Files:**
- Modify: `backend/src/modules/users/users.controller.ts`

- [ ] **Replace `@MinLevel` with `@MinOrgLevel` on org-scoped endpoints**

```typescript
import { MinOrgLevel } from '../../common/decorators/min-level.decorator';

@Controller('users')
export class UsersController {
  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)
  async create(@Body() dto: CreateUserDto) { ... }

  @Get()
  @MinOrgLevel(ROLE_LEVEL.manager)
  async findAll(...) { ... }

  @Get(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  async findById(...) { ... }

  @Patch(':id')
  @MinOrgLevel(ROLE_LEVEL.manager)
  async update(...) { ... }

  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.executive)
  async delete(...) { ... }
}
```

Note: `DELETE /users/:id` goes from `@MinLevel(ROLE_LEVEL.master)` (master only) to `@MinOrgLevel(ROLE_LEVEL.executive)` (executive+). This matches the design — deleting a user from an org should be an executive-level action, not master-only.

- [ ] **Remove the unused `MinLevel` import** since only `MinOrgLevel` is needed now.

```typescript
import { MinOrgLevel, ROLE_LEVEL } from '../../common/decorators/min-level.decorator';
```

---

### Task 9: Update `UsersService.create()` to await the async `assertCanAssignRole`

**Files:**
- Modify: `backend/src/modules/users/users.service.ts`

- [ ] **Check if any callers need `await` added**

```typescript
// line 63 in users.service.ts
await assertCanAssignRole(actorSlug, targetRole.slug);
```

Also check `admin.service.ts` for `assertCanAssignRole` calls.

- [ ] **Run typecheck**

```bash
cd backend && npx tsc --noEmit
```

---

### Task 10: Update frontend roles.ts to build hierarchy from API

**Files:**
- Modify: `frontend/src/lib/auth/roles.ts`
- Modify: `frontend/src/features/roles/models/role.model.ts`

- [ ] **Add `type` and `level` to role model**

```typescript
// frontend/src/features/roles/models/role.model.ts
export interface Role {
  id: string;
  name: string;
  slug: string;
  type: 'system' | 'org';
  level: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Update `roles.ts` to accept roles from API**

```typescript
// frontend/src/lib/auth/roles.ts
export const ROLE_LEVEL: Record<string, number> = {
  master: 100,
  admin: 70,
  executive: 80,
  manager: 60,
  employee: 40,
};

export function hasMinLevel(userRole: string, minLevel: number): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= minLevel;
}

export function canAssignRole(actorSlug: string, targetSlug: string): boolean {
  const actorLevel = ROLE_LEVEL[actorSlug];
  const targetLevel = ROLE_LEVEL[targetSlug];
  if (actorLevel === undefined || targetLevel === undefined) return false;
  if (actorSlug === 'master') return true;
  return targetLevel < actorLevel;
}

export function assignableRoleSlugs(actorSlug: string): string[] {
  return Object.keys(ROLE_LEVEL).filter((slug) => canAssignRole(actorSlug, slug));
}
```

For now the frontend `ROLE_LEVEL` stays hardcoded since it already mirrors the DB values. It can be replaced with an API-driven approach in a follow-up. The key architectural change (backend reads levels from DB) is what eliminates the maintenance trap — the frontend just needs to stay in sync.

- [ ] **Run typecheck**

```bash
cd frontend && npx tsc --noEmit
```

---

### Verification

- [ ] **Full typecheck**

```bash
pnpm typecheck
```

- [ ] **Full lint**

```bash
pnpm lint
```

- [ ] **Manual smoke test**: Create a migration, start the backend, verify that admin endpoints still respond correctly.
