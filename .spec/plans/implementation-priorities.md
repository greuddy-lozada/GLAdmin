# Implementation Plan — Prioridades Prácticas

> **status:** `done` (Decimal + soft delete; tests parciales)  
> **Estado:** ✅ Completado (Decimal, soft delete implementados; tests parciales)  
> **Fecha:** Julio 2026  
> **Origen:** Gap analysis specs vs implementación

---

## Resumen Ejecutivo

| # | Item | Esfuerzo | Impacto | Riesgo | Estado |
|---|---|---|---|---|---|---|
| 5 | Decimal(18,4) para montos financieros | Alto (~50 archivos) | Crítico | Alto (migración de datos) | ✅ Completado |
| 14 | Soft delete consistente | Medio (~15 archivos) | Alto | Bajo | ✅ Completado |
| 8 | Frontend unit tests | Alto (~20 archivos nuevos) | Alto | Bajo | 🟡 Parcial (5/20 archivos) |
| 9 | Backend unit tests | Medio-Alto (~15 archivos nuevos) | Alto | Bajo | 🟡 Parcial (8/25 módulos) |

---

## 1. Decimal(18,4) para Montos Financieros

### Diagnóstico

**Todos** los campos financieros del schema usan `Float`:
- `product.price`, `product.dollarPrice`, `product.baseCost`, `product.margin`
- `sale.amount`, `sale.amountUsd`, `sale.exchangeRate`, `sale.totalTax`, `sale.withholdingAmount`
- `salesDet.unitPrice`, `salesDet.unitPriceUsd`, `salesDet.subtotal`, `salesDet.subtotalUsd`
- `purchaseOrder.amount`, `purchaseOrderDet.*`
- `tax.percentage`, `withholdingRecord.*`
- `exchangeRate.rate`, `exchangeRateDay.*`
- `subscriptionPayment.amount`, `accountsPayable.*`, `accountsReceivable.*`
- `pagoMovilTransaction.amountVes`, `pagoMovilTransaction.amountUsd`
- `plan.amount`

**Riesgo:** `Float` es impreciso para dinero (IEEE 754). Operaciones repetidas generan errores de redondeo. El spec (`database.md` §1) requiere `Decimal @db.Decimal(18,4)`.

### Plan

#### Fase 1: Schema
1. Cambiar todos los `Float`/`Float?` financieros a `Decimal @db.Decimal(18,4)` en `schema.prisma`
2. Mantener `Float` solo para campos no-financieros (porcentajes de márgenes, tasas de cambio)
3. Generar migración: `npx prisma migrate dev --name decimal_financial_amounts`

#### Fase 2: Backend
4. Actualizar DTOs — `@IsNumber()` sigue funcionando con Decimal (Prisma los expone como `number` en JS)
5. Actualizar seeds — asegurar que los valores seed usen formato numérico estándar
6. Verificar endpoints — tests de integración para confirmar precisión en operaciones

#### Fase 3: Frontend
7. Modelos de TypeScript — la mayoría ya usa `number`, no requiere cambios
8. Verificar que `toFixed(2)` y formateo sigan funcionando

#### Archivos estimados: ~50

| Capa | Archivos |
|---|---|
| Prisma schema | 1 |
| Backend DTOs | ~15 |
| Backend services | ~10 |
| Seeds | 1 |
| Frontend models | ~15 |
| Frontend services | ~8 |
| i18n | 0 |

---

## 2. Soft Delete Consistente

### Diagnóstico

- **Con `deletedAt`:** 18/38 modelos (Organization, User, Role, Product, Customer, Supplier, Company, Brand, Category, Tax, Batch, Stock, PurchaseOrder, PurchaseOrderDet, Sale, SalesDet, WithholdingRecord, AccountsPayable)
- **Sin `deletedAt`:** 20/38 modelos (Plan, SubscriptionPayment, Currency, ExchangeRate, ExchangeRateDay, Module, License, StockDet, PagoMovilConfig, PagoMovilTransaction, AccountsReceivable, ProductsExchangeRates, SyncCursor, SyncConflict, AuditLog, RefreshToken, Permission, UserOrganization, Invite, SalePayment)
- **Sin middleware Prisma:** No existe el middleware que intercepta DELETE y lo convierte en soft delete

### Plan

#### Fase 1: Agregar `deletedAt` a modelos faltantes (solo donde aplica)

Modelos que **SÍ** deben tener soft delete:
| Modelo | Justificación |
|---|---|
| `Plan` | Posible descontinuación de planes |
| `PagoMovilConfig` | Configuración histórica |
| `PagoMovilTransaction` | Auditoría de transacciones |

Modelos que **NO** necesitan soft delete (DELETE físico permitido por spec):
| Modelo | Justificación |
|---|---|
| `RefreshToken` | Tokens expirados — ya tiene cron de limpieza |
| `SyncCursor`, `SyncConflict` | Datos operativos, transient |
| `AuditLog` | Ya tiene cron de limpieza |
| `Permission`, `UserOrganization`, `Invite`, `StockDet`, `SalePayment`, `AccountsReceivable`, `ProductsExchangeRates`, `Currency`, `ExchangeRate`, `ExchangeRateDay`, `License`, `Module` | Datos relacionales o históricos que se eliminan con el padre |

→ Solo 3 modelos requieren `deletedAt`: Plan, PagoMovilConfig, PagoMovilTransaction

#### Fase 2: Middleware de Prisma

```typescript
// backend/src/shared/prisma/prisma.service.ts
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args.data = { deletedAt: new Date() };
  }
  return next(params);
});
```

**Restricción:** Solo aplicar a modelos con `deletedAt`. Si no lo tienen, dejar el DELETE físico.

#### Fase 3: Queries

3. Agregar `where: { deletedAt: null }` en queries que listan datos (productos, clientes, etc.)
4. Verificar que el middleware no rompa operaciones de DELETE legítimo (RefreshToken, SyncConflict)

#### Archivos estimados: ~10

| Capa | Archivos |
|---|---|
| Prisma schema | 1 |
| Migración | 1 |
| PrismaService (middleware) | 1 |
| Backend services (filtros deletedAt) | ~5 |
| Backend DTOs | ~2 |

---

## 3. Frontend Unit Tests

### Diagnóstico

**0 tests** en `frontend/src/`. La spec (`testing.md`) pide:
- Cobertura ≥ 80% líneas
- Vitest + React Testing Library
- MSW para mocking de API

### Plan — Tests mínimos por feature crítica

| Feature | Tests | Archivos |
|---|---|---|
| **POS** | `usePos` hook, `CartPanel` renderizado, `ProductCard` click, `ProductGrid` filtrado, lógica de store Zustand | `use-pos.test.ts`, `cart-panel.test.tsx`, `product-card.test.tsx`, `product-grid.test.tsx`, `pos-store.test.ts` |
| **Auth** | `useAuth` hook, `LoginForm` validación, `PinUnlock` intentos | `use-auth.test.ts`, `login-form.test.tsx`, `pin-unlock.test.tsx` |
| **Products** | `useOptimisticCrud` hook, `ProductsPage` renderizado | `use-optimistic-crud.test.ts`, `products-page.test.tsx` |
| **Dashboard** | `DashboardBento` KPIs, `SubscriptionBanner` estados | `dashboard-bento.test.tsx`, `subscription-banner.test.tsx` |

#### Setup requerido

```bash
pnpm --filter frontend add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

#### Archivos estimados: ~20

| Tipo | Archivos |
|---|---|
| Config (vitest, setup, tsconfig) | 3 |
| MSW handlers | 4 |
| Test utilities/fixtures | 2 |
| Hook tests | 4 |
| Component tests | 6 |
| Store test | 1 |

---

## 4. Backend Unit Tests

### Diagnóstico

**5 specs** existentes en `backend/src/`:
- `subscription-lifecycle.service.spec.ts`
- `purchase-orders.service.spec.ts`
- `audit-log.service.spec.ts`
- `sales.service.spec.ts`
- `products.service.spec.ts`

Faltan tests para ~20 módulos restantes.

### Plan — Tests para módulos sin cobertura

| Módulo | Prioridad | Razón |
|---|---|---|
| **auth.service** | Crítica | Login, registro, refresh tokens, JWT |
| **sync.service** | Crítica | Push/pull, conflictos, integridad de datos |
| **customers.service** | Alta | CRUD con RIF único |
| **categories.service** | Media | CRUD con jerarquía de categorías |
| **brands.service** | Media | CRUD simple |
| **taxes.service** | Media | Cálculo de impuestos |
| **dashboard.service** | Media | KPIs, analytics |
| **stocks.service** | Media | Movimientos de inventario |
| **suppliers.service** | Baja | CRUD simple |
| **companies.service** | Baja | CRUD con withholding |

#### Estructura por módulo

```
backend/src/modules/{module}/__tests__/
├── {module}.service.spec.ts
└── fixtures/
    └── {module}.fixture.ts
```

#### Archivos estimados: ~25

| Tipo | Archivos |
|---|---|
| Service specs | ~12 |
| Controller specs (críticos) | ~4 |
| Fixtures | ~6 |
| Mocks | ~3 |

---

## Orden de Ejecución Recomendado

```
Fase 1 (Semana 1-2): Calidad de datos
  1. Decimal(18,4) para montos    ← Crítico, integridad financiera
  2. Soft delete consistente       ← Protección de datos

Fase 2 (Semana 2-3): Backend tests
  3. auth.service.spec.ts         ← Login/registro
  4. sync.service.spec.ts         ← Push/pull, conflictos
  5. customers.service.spec.ts

Fase 3 (Semana 3-4): Frontend tests
  6. Setup vitest + MSW
  7. usePos + pos-store tests
  8. Auth + Products tests
```

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Decimal(18,4) rompe cálculos en frontend (toFixed, etc.) | Prisma expone Decimal como `number` en JS — el frontend no debería romperse |
| Migración Decimal → datos existentes corruptos | Hacer backup de BD antes de migrar. Testear en staging primero |
| Middleware soft delete intercepta DELETE legítimo | Solo interceptar si el modelo tiene `deletedAt` en schema |
| Tests frágiles con MSW | Usar handlers modulares y fixtures reusables |

---

*Referencia: [architecture.md](../system/architecture.md) | [database.md](../system/database.md) | [testing.md](../system/testing.md) | [security.md](../system/security.md)*
