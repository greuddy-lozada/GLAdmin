# Subscription Lifecycle — Suscripción Mensual

> **status:** `current` · last-verified: 2026-08-08  
> Define expiración, grace period, downgrade y renovación.  
> Plan gating: [plan-gating.md](../system/plan-gating.md) (slugs: `free` | `starter` | `professional` | `enterprise`).

---

## 1. Contexto

El lifecycle de suscripción **está implementado** en código (`subscriptionStatus`, `subscriptionExpiresAt`, cron/services bajo `modules/subscriptions/`).

Al aprobar un `SubscriptionPayment` se activa/extiende la suscripción. Post-vencimiento → `past_due` (grace) → degradación a plan Free. Datos de la org intactos.

---

## 2. Design Decisions

| Decisión | Valor | Justificación |
|---|---|---|
| Estados de suscripción | `as const` string union, no Prisma enum | Validación en backend con `@IsIn()`. |
| Cron | `@nestjs/schedule` | Mismo proceso NestJS. |
| Grace period | 7 días | Estándar SaaS. |
| Pago doble | Se acumulan: `subscriptionExpiresAt += 30d` | No penaliza pago adelantado. |
| Degradación | Automática post grace. `planId` → Free. Datos intactos. | Sin intervención manual. |

---

## 3. Schema

### Prisma — Organization (actual)

```prisma
model Organization {
  // ...
  planId                String?   @db.Uuid @map("plan_id")
  subscriptionStatus    String    @default("inactive") @map("subscription_status")
  subscriptionExpiresAt DateTime? @map("subscription_expires_at")
}
```

`planId` es **UUID**, no `Int`.

### Constantes de estado

```typescript
export const SUBSCRIPTION_STATUS = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
} as const;

export const GRACE_PERIOD_DAYS = 7;
export const SUBSCRIPTION_DURATION_DAYS = 30;
```

| Estado | Significado |
|---|---|
| `inactive` | Nunca pagó o ya fue degradado. Plan = Free. |
| `active` | Pago al día. `planId` = plan contratado. |
| `past_due` | Venció, en período de gracia. Features siguen funcionando. |

---

## 4. Flujo de Vida

```
Pago aprobado (admin)
  │
  ├─ inactive → subscriptionStatus = 'active', expiresAt = now + 30d
  ├─ active   → extends expiresAt += 30d
  └─ past_due → subscriptionStatus = 'active', expiresAt = now + 30d
        │
        ▼ (día de vencimiento)
subscriptionStatus = 'past_due'
        │
        ├─ Día 0–7: GRACE PERIOD — todo funciona, banner de renovación
        │
        ▼ (día 8+)
subscriptionStatus = 'inactive'
planId = Free plan
subscriptionExpiresAt = null
```

---

## 5. Verificación

Dos puntos de evaluación:

| Punto | Cuándo | Archivo |
|---|---|---|
| `selectOrg()` | Cada vez que el usuario selecciona org (login, switch) | `auth.service.ts` |
| Cron diario | 3 AM todos los días | `subscription-lifecycle.cron.ts` |

---

## 6. Edge Cases

| Escenario | Comportamiento |
|---|---|
| Admin cambia `planId` manualmente | Se corrige en el próximo `selectOrg` o cron |
| Plan Free (`interval = 'lifetime'`) | Status siempre `inactive`, expiresAt siempre `null` |
| Org recién creada (bootstrap) | `planId = free`, `inactive`, `null` |
| Pago doble sin esperar aprobación | Idempotente: cada pago suma 30d |
| `evaluateSubscription()` falla en `selectOrg` | No bloquea login. Try/catch + log + continuar |

---

## 7. File Manifest

### Backend

| Action | File |
|---|---|
| Modify | `prisma/schema.prisma` — +2 campos en Organization |
| Create | Nueva migración |
| Create | `src/modules/subscriptions/constants.ts` |
| Create | `src/modules/subscriptions/subscription-lifecycle.service.ts` |
| Create | `src/modules/subscriptions/subscription-lifecycle.cron.ts` |
| Modify | `src/modules/subscriptions/subscription-payment.service.ts` |
| Modify | `src/modules/subscriptions/subscription-payments.module.ts` |
| Modify | `src/modules/auth/auth.service.ts` |
| Modify | `backend/package.json` — `@nestjs/schedule` |

### Frontend

| Action | File |
|---|---|
| Create | `src/features/dashboard/components/subscription-banner.tsx` |
| Modify | `src/features/billing/models/billing.model.ts` |
| Modify | `src/features/billing/components/billing-page.tsx` |
| Modify | `src/providers/auth-provider.tsx` |
| Modify | `src/i18n/locales/es.json` |
| Modify | `src/i18n/locales/en.json` |

---

## 8. Testing

- `subscription-lifecycle.service.spec.ts`: 6 escenarios (sin planId, Free, activo, grace period, degradado, corrección sin fecha)
- `subscription-payment.service.spec.ts`: extender tests existentes con 3 escenarios de expiración
- `auth.service.spec.ts`: verificar que `selectOrg()` llama a `evaluateSubscription()`
