# Subscription Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement monthly subscription lifecycle: expiration after 30 days, 7-day grace period, automatic downgrade to Free plan.

**Architecture:** Backend: NestJS service + `@nestjs/schedule` cron + auth integration at `selectOrg()`. Frontend: subscription banner, billing page enhancement, new i18n keys. Two new fields on Organization (`subscriptionStatus`, `subscriptionExpiresAt`).

**Tech Stack:** NestJS, Prisma, `@nestjs/schedule`, React/Next.js, shadcn/ui, i18n JSON

**Spec:** `.spec/business/subscription-lifecycle.md`

---

## File Structure

| Layer | Action | File | Responsibility |
|---|---|---|---|
| DB | Modify | `backend/prisma/schema.prisma:101-146` | +2 fields on Organization |
| DB | Create | Migration SQL | New columns |
| Backend | Create | `backend/src/modules/subscriptions/constants.ts` | `as const` subscription status constants |
| Backend | Create | `backend/src/modules/subscriptions/subscription-lifecycle.service.ts` | Evaluation logic |
| Backend | Create | `backend/src/modules/subscriptions/subscription-lifecycle.cron.ts` | Daily cron job |
| Backend | Modify | `backend/src/modules/subscriptions/subscription-payment.service.ts` | Expiration logic in `review()` |
| Backend | Modify | `backend/src/modules/subscriptions/subscription-payments.module.ts` | Add ScheduleModule + providers |
| Backend | Modify | `backend/src/modules/auth/auth.service.ts` | Call `evaluateSubscription()` in `selectOrg()` |
| Backend | Install | `@nestjs/schedule` | Dependency |
| Frontend | Modify | `frontend/src/features/auth/models/auth.model.ts` | Add `subscriptionStatus`, `subscriptionExpiresAt` to `OrganizationDetail` |
| Frontend | Modify | `frontend/src/features/billing/components/billing-page.tsx` | Show subscription status |
| Frontend | Create | `frontend/src/features/dashboard/components/subscription-banner.tsx` | Banner for `past_due` state |
| Frontend | Modify | `frontend/src/i18n/locales/es.json` | +7 keys |
| Frontend | Modify | `frontend/src/i18n/locales/en.json` | +7 keys |

---

### Task 1: Install `@nestjs/schedule` dependency

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install the package**

Run: `pnpm --filter backend add @nestjs/schedule`

- [ ] **Step 2: Verify it was added**

```bash
grep "schedule" backend/package.json
```

Expected: `"@nestjs/schedule": "^X.X.X"`

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml
git commit -m "chore(deps): add @nestjs/schedule for subscription lifecycle cron"
```

---

### Task 2: Add subscription fields to Organization in Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma:108-109`

- [ ] **Step 1: Add fields to Organization model**

Insert after line 108 (`planId Int? @map("plan_id")`):

```prisma
  subscriptionStatus    String     @default("inactive") @map("subscription_status")
  subscriptionExpiresAt DateTime?  @map("subscription_expires_at")
```

- [ ] **Step 2: Generate and review migration**

```bash
pnpm --filter backend exec prisma migrate dev --name add-subscription-lifecycle
```

Review the generated SQL in `backend/prisma/migrations/`. It should:
- Add `subscription_status VARCHAR` with default `'inactive'`
- Add `subscription_expires_at TIMESTAMPTZ` nullable

- [ ] **Step 3: Verify Prisma Client regenerates**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add subscription_status and subscription_expires_at to organizations"
```

---

### Task 3: Create subscription constants

**Files:**
- Create: `backend/src/modules/subscriptions/constants.ts`

- [ ] **Step 1: Write the constants file**

```typescript
export const SUBSCRIPTION_STATUS = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
} as const;

export const SubscriptionStatus = [
  SUBSCRIPTION_STATUS.INACTIVE,
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE,
] as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[number];

export const GRACE_PERIOD_DAYS = 7;
export const SUBSCRIPTION_DURATION_DAYS = 30;
```

- [ ] **Step 2: Verify no type errors**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/subscriptions/constants.ts
git commit -m "feat(subscriptions): add subscription status constants as const"
```

---

### Task 4: Create SubscriptionLifecycleService

**Files:**
- Create: `backend/src/modules/subscriptions/subscription-lifecycle.service.ts`

- [ ] **Step 1: Write the lifecycle service**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SUBSCRIPTION_STATUS, GRACE_PERIOD_DAYS, SUBSCRIPTION_DURATION_DAYS } from './constants';

@Injectable()
export class SubscriptionLifecycleService {
  private readonly logger = new Logger(SubscriptionLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluateSubscription(organizationId: number): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        planId: true,
        plan: { select: { name: true } },
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });
    if (!org) return;

    if (!org.planId) {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.INACTIVE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        });
      }
      return;
    }

    if (org.plan?.name === 'free') {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.INACTIVE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: {
            subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
            subscriptionExpiresAt: null,
          },
        });
      }
      return;
    }

    if (!org.subscriptionExpiresAt) {
      await this.prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
          subscriptionExpiresAt: new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 86400000),
        },
      });
      return;
    }

    const now = new Date();

    if (org.subscriptionExpiresAt > now) {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.ACTIVE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: { subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE },
        });
      }
      return;
    }

    const daysSinceExpiry = Math.floor(
      (now.getTime() - org.subscriptionExpiresAt.getTime()) / 86400000,
    );

    if (daysSinceExpiry <= GRACE_PERIOD_DAYS) {
      if (org.subscriptionStatus !== SUBSCRIPTION_STATUS.PAST_DUE) {
        await this.prisma.organization.update({
          where: { id: organizationId },
          data: { subscriptionStatus: SUBSCRIPTION_STATUS.PAST_DUE },
        });
      }
      return;
    }

    const freePlan = await this.prisma.plan.findUnique({
      where: { name: 'free' },
    });
    if (!freePlan) {
      this.logger.warn(`Free plan not found, cannot downgrade org ${organizationId}`);
      return;
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        planId: freePlan.id,
        subscriptionStatus: SUBSCRIPTION_STATUS.INACTIVE,
        subscriptionExpiresAt: null,
      },
    });
    this.logger.log(`Organization ${organizationId} downgraded to Free plan`);
  }

  async evaluateAllActive(): Promise<void> {
    const orgs = await this.prisma.organization.findMany({
      where: {
        planId: { not: null },
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const org of orgs) {
      try {
        await this.evaluateSubscription(org.id);
      } catch (error) {
        this.logger.error(`Failed to evaluate org ${org.id}`, error);
      }
    }
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/subscriptions/subscription-lifecycle.service.ts
git commit -m "feat(subscriptions): add subscription lifecycle service"
```

---

### Task 5: Create daily cron job

**Files:**
- Create: `backend/src/modules/subscriptions/subscription-lifecycle.cron.ts`

- [ ] **Step 1: Write the cron service**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';

@Injectable()
export class SubscriptionLifecycleCron {
  private readonly logger = new Logger(SubscriptionLifecycleCron.name);

  constructor(private readonly lifecycleService: SubscriptionLifecycleService) {}

  @Cron('0 3 * * *')
  async handleSubscriptionCheck() {
    this.logger.log('Running subscription lifecycle check');
    await this.lifecycleService.evaluateAllActive();
    this.logger.log('Subscription lifecycle check complete');
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/subscriptions/subscription-lifecycle.cron.ts
git commit -m "feat(subscriptions): add daily subscription lifecycle cron"
```

---

### Task 6: Register ScheduleModule and new providers in SubscriptionsModule

**Files:**
- Modify: `backend/src/modules/subscriptions/subscription-payments.module.ts`

- [ ] **Step 1: Update the module**

Replace the module content:

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { SubscriptionPaymentController } from './subscription-payment.controller';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { SubscriptionLifecycleCron } from './subscription-lifecycle.cron';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [SubscriptionPaymentController],
  providers: [
    SubscriptionPaymentService,
    SubscriptionLifecycleService,
    SubscriptionLifecycleCron,
  ],
  exports: [SubscriptionLifecycleService],
})
export class SubscriptionsModule {}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/subscriptions/subscription-payments.module.ts
git commit -m "feat(subscriptions): register lifecycle service and schedule module"
```

---

### Task 7: Update SubscriptionPaymentService.review() to set expiration

**Files:**
- Modify: `backend/src/modules/subscriptions/subscription-payment.service.ts:98-133`

- [ ] **Step 1: Add imports at top of file**

After line 12 (the DTO import), add:

```typescript
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_DURATION_DAYS } from './constants';
```

- [ ] **Step 2: Replace the transaction block in review() (lines 122-127)**

Replace the `if (dto.status === 'approved')` block inside the transaction:

Old:
```typescript
      if (dto.status === 'approved') {
        await tx.organization.update({
          where: { id: payment.organizationId },
          data: { planId: payment.planId },
        });
      }
```

New:
```typescript
      if (dto.status === 'approved') {
        const org = await tx.organization.findUnique({
          where: { id: payment.organizationId },
          select: { subscriptionStatus: true, subscriptionExpiresAt: true },
        });

        const now = new Date();
        let newExpiresAt: Date;

        if (
          org?.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE &&
          org?.subscriptionExpiresAt &&
          org.subscriptionExpiresAt > now
        ) {
          newExpiresAt = new Date(org.subscriptionExpiresAt.getTime() + SUBSCRIPTION_DURATION_DAYS * 86400000);
        } else {
          newExpiresAt = new Date(now.getTime() + SUBSCRIPTION_DURATION_DAYS * 86400000);
        }

        await tx.organization.update({
          where: { id: payment.organizationId },
          data: {
            planId: payment.planId,
            subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
            subscriptionExpiresAt: newExpiresAt,
          },
        });
      }
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/subscriptions/subscription-payment.service.ts
git commit -m "feat(subscriptions): set subscription expiration on payment approval"
```

---

### Task 8: Integrate lifecycle check into AuthService.selectOrg()

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.module.ts`

- [ ] **Step 1: Import SubscriptionLifecycleService in auth.module.ts**

Read `backend/src/modules/auth/auth.module.ts` first, then add the import:

If `SubscriptionsModule` is not already imported in `AuthModule`, add it to `imports`:

```typescript
import { SubscriptionsModule } from '../subscriptions/subscription-payments.module';
```

Then in the `@Module` decorator add `SubscriptionsModule` to `imports`.

If `SubscriptionsModule` is already available (check existing imports), skip the module import step.

- [ ] **Step 2: Add SubscriptionLifecycleService to AuthService constructor**

In `auth.service.ts`, add import:

```typescript
import { SubscriptionLifecycleService } from '../subscriptions/subscription-lifecycle.service';
```

Update constructor to accept the service:

```typescript
constructor(
  private readonly userRepository: UserRepository,
  private readonly authFactory: AuthFactory,
  private readonly prisma: PrismaService,
  private readonly auditLog: AuditLogService,
  private readonly subscriptionLifecycle: SubscriptionLifecycleService,
) {}
```

- [ ] **Step 3: Call evaluateSubscription in selectOrg()**

In the `selectOrg()` method, after the membership check (line 172, after the `if (!membership)` block closes) and before the `user.update()`, add:

```typescript
this.subscriptionLifecycle.evaluateSubscription(organizationId).catch((err) => {
  this.auditLog.log({
    organizationId,
    userId,
    action: 'SUBSCRIPTION_EVAL_FAILED',
    entity: 'Organization',
    entityId: organizationId,
    metadata: { error: err.message },
  }).catch(() => {});
});
```

This is non-blocking: if `evaluateSubscription` fails, login still proceeds.

- [ ] **Step 4: Include subscription fields in selectOrg response**

In the `selectOrg()` response object (around lines 207-224), add the subscription fields to the `organization` block:

```typescript
organization: {
  id: membership.organization.id,
  name: membership.organization.name,
  slug: membership.organization.slug,
  plan: membership.organization.plan
    ? {
        name: membership.organization.plan.name,
        label: membership.organization.plan.label,
        features: membership.organization.plan.features,
      }
    : null,
  subscriptionStatus: membership.organization.subscriptionStatus,
  subscriptionExpiresAt: membership.organization.subscriptionExpiresAt,
},
```

Also include subscription fields in the `login()` response (around lines 138-149) where the single-org auto-select returns the organization object:

```typescript
organization: {
  id: org.id,
  name: org.name,
  slug: org.slug,
  plan: org.plan
    ? {
        name: org.plan.name,
        label: org.plan.label,
        features: org.plan.features,
      }
    : null,
  subscriptionStatus: org.subscriptionStatus,
  subscriptionExpiresAt: org.subscriptionExpiresAt,
},
```

To achieve this, update the queries in `login()` (line 50+) and `getUserOrgs()` to include the subscription fields. Read the current query and add:

```typescript
// In login() where org is fetched (getUserOrgs), add:
subscriptionStatus: true,
subscriptionExpiresAt: true,
```

- [ ] **Step 5: Verify typecheck**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/auth/
git commit -m "feat(auth): evaluate subscription on org selection, return subscription fields"
```

---

### Task 9: Update seed to include subscription fields

**Files:**
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Add subscription fields to default org creation**

In the `seed.ts` file, find the default organization upsert (around line 139-148). Add the new fields:

```typescript
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
    subscriptionStatus: 'inactive',
    subscriptionExpiresAt: null,
  },
});
```

- [ ] **Step 2: Verify seed runs**

```bash
pnpm --filter backend exec tsx prisma/seed.ts
```

Expected: Seeds run without errors.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/seed.ts
git commit -m "feat(db): add subscription fields to seed default org"
```

---

### Task 10: Update frontend OrganizationDetail model

**Files:**
- Modify: `frontend/src/features/auth/models/auth.model.ts`

- [ ] **Step 1: Add subscription fields to OrganizationDetail interface**

Update the `OrganizationDetail` interface:

```typescript
export interface OrganizationDetail {
  id: number;
  name: string;
  slug: string;
  plan: { name: string; label: string; features: string } | null;
  subscriptionStatus: 'inactive' | 'active' | 'past_due';
  subscriptionExpiresAt: string | null;
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter frontend typecheck
```

Expected: 0 errors (or errors only for places that now need to handle new fields — we'll fix those next).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/models/auth.model.ts
git commit -m "feat(frontend): add subscription fields to OrganizationDetail"
```

---

### Task 11: Create SubscriptionBanner component

**Files:**
- Create: `frontend/src/features/dashboard/components/subscription-banner.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export function SubscriptionBanner() {
  const { currentOrg } = useAuth();
  const { t, tp } = useI18n();
  const planName = currentOrg?.plan?.label ?? '';

  if (!currentOrg) return null;

  if (currentOrg.subscriptionStatus !== 'past_due' || !currentOrg.subscriptionExpiresAt) {
    return null;
  }

  const expiresAt = new Date(currentOrg.subscriptionExpiresAt);
  const graceEnd = new Date(expiresAt);
  graceEnd.setDate(graceEnd.getDate() + 7);

  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {tp('subscription.banner.pastDue', {
          date: expiresAt.toLocaleDateString('es-VE'),
          graceEnd: graceEnd.toLocaleDateString('es-VE'),
          plan: planName,
        })}
      </AlertDescription>
      <Link href="/billing">
        <Button variant="outline" size="sm">
          {t('subscription.banner.renew')}
        </Button>
      </Link>
    </Alert>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter frontend typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/dashboard/components/subscription-banner.tsx
git commit -m "feat(frontend): add subscription expiration banner"
```

---

### Task 12: Update billing page to show subscription status

**Files:**
- Modify: `frontend/src/features/billing/components/billing-page.tsx`

- [ ] **Step 1: Add subscription status info above plan cards**

Add after the error alert (line 95) and before the plan grid (line 102):

```tsx
{currentOrg && currentOrg.subscriptionStatus !== 'inactive' && (
  <Alert variant="default" className="mb-0">
    <AlertDescription>
      {currentOrg.subscriptionStatus === 'active' && currentOrg.subscriptionExpiresAt
        ? tp('subscription.status.active', {
            plan: currentOrg.plan?.label ?? '',
            date: new Date(currentOrg.subscriptionExpiresAt).toLocaleDateString('es-VE'),
          })
        : currentOrg.subscriptionStatus === 'past_due' && currentOrg.subscriptionExpiresAt
          ? tp('subscription.status.pastDue', {
              date: new Date(currentOrg.subscriptionExpiresAt).toLocaleDateString('es-VE'),
            })
          : null}
      {currentOrg.subscriptionStatus === 'past_due' && (
        <span className="ml-2 text-sm font-medium">{t('subscription.banner.renewPrompt')}</span>
      )}
    </AlertDescription>
  </Alert>
)}
{currentOrg && currentOrg.subscriptionStatus === 'inactive' && (
  <Alert variant="default">
    <AlertDescription>
      {t('subscription.status.inactive')}
    </AlertDescription>
  </Alert>
)}
```

Add the `tp` import at the top (line 11):

```typescript
const { t, tp } = useI18n();
```

Replace line 11 which currently has:
```typescript
const { t } = useI18n();
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm --filter frontend typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/billing/components/billing-page.tsx
git commit -m "feat(frontend): show subscription status on billing page"
```

---

### Task 13: Add i18n keys

**Files:**
- Modify: `frontend/src/i18n/locales/es.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: Add keys to es.json**

In the `subscription` section, add after line 914 (`"error": { ... }` block in admin) and before the closing `}` of subscription:

```json
"banner": {
  "pastDue": "Tu suscripción de {{plan}} venció el {{date}}. Renueva antes del {{graceEnd}} para mantener tu plan.",
  "renew": "Renovar",
  "renewPrompt": "Renueva para mantener tu plan actual."
},
"status": {
  "inactive": "Tu plan actual es Free. Mejora tu plan para acceder a más funcionalidades.",
  "active": "Plan {{plan}} activo hasta el {{date}}.",
  "pastDue": "Tu suscripción venció el {{date}}."
},
"downgraded": "Tu suscripción ha sido degradada al plan Free. Tus datos están intactos."
```

- [ ] **Step 2: Add keys to en.json**

Same structure, English translations:

```json
"banner": {
  "pastDue": "Your {{plan}} subscription expired on {{date}}. Renew before {{graceEnd}} to keep your plan.",
  "renew": "Renew",
  "renewPrompt": "Renew to keep your current plan."
},
"status": {
  "inactive": "Your current plan is Free. Upgrade to access more features.",
  "active": "{{plan}} plan active until {{date}}.",
  "pastDue": "Your subscription expired on {{date}}."
},
"downgraded": "Your subscription has been downgraded to the Free plan. Your data is safe."
```

- [ ] **Step 3: Verify JSON validity**

```bash
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/locales/es.json','utf8')); console.log('es.json: valid')"
node -e "JSON.parse(require('fs').readFileSync('frontend/src/i18n/locales/en.json','utf8')); console.log('en.json: valid')"
```

Expected: Both print "valid".

- [ ] **Step 4: Commit**

```bash
git add frontend/src/i18n/locales/es.json frontend/src/i18n/locales/en.json
git commit -m "feat(i18n): add subscription lifecycle keys (es + en)"
```

---

### Task 14: Run full typecheck + lint, fix errors

- [ ] **Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: If errors found, fix and re-run before committing**

---

## Self-Review

1. **Spec coverage**: Each spec requirement maps to a task:
   - Schema changes → Task 2
   - Constants → Task 3
   - Lifecycle service → Task 4
   - Cron → Task 5
   - Module registration → Task 6
   - Payment approval expiration → Task 7
   - Auth integration → Task 8
   - Seed update → Task 9
   - Frontend model → Task 10
   - Banner component → Task 11
   - Billing page status → Task 12
   - i18n → Task 13
   - Verification → Task 14

2. **Placeholder scan**: No TBD, TODO, or vague instructions.

3. **Type consistency**: `subscriptionStatus` is `String` in Prisma, `'inactive' | 'active' | 'past_due'` in TypeScript interfaces. Matches across backend/frontend.
