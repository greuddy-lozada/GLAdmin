# UUID Migration Plan — Plan Detallado

> **status:** `obsolete` (migración aplicada)  
> **Estado:** ✅ Completado  
> **Fecha plan:** Julio 2026  
> **Fecha fin:** Julio 2026  
> **Reemplaza:** `database-migration-plan.md` (obsoleto — asumía SQLite)  

> Agentes: no re-ejecutar. UUIDs ya están en schema.
---

## Resumen Ejecutivo

Migrar todos los IDs de `Int @default(autoincrement())` a `String @id @default(uuid())` con tipo nativo `@db.Uuid` de PostgreSQL. 38 modelos, ~200 archivos de código, sistema de sync offline Dexie.

| Fase | Descripción | Archivos | Duración est. | Riesgo |
|---|---|---|---|---|
| 0 | Preparación (backup, branch, entorno) | 1 | 30 min | Bajo |
| 1 | Schema Prisma (38 modelos + FKs) | 1 | 2 h | Alto |
| 2 | DB migration + seed | 2 | 1 h | Alto |
| 3 | Backend — Controllers | 22 | 1.5 h | Medio |
| 4 | Backend — DTOs | 13 | 1 h | Medio |
| 5 | Backend — Services + Core | 28 | 3 h | Medio |
| 6 | Frontend — Models + Services | 41 | 2 h | Medio |
| 7 | Frontend — Hooks (useOptimisticCrud + callers) | 18 | 1.5 h | Medio |
| 8 | Frontend — Sync engine + Dexie | 5 | 2 h | Alto |
| 9 | Frontend — DataTable + componentes | 3 | 30 min | Bajo |
| 10 | E2E tests — Builders + tasks | 4 | 1 h | Bajo |
| 11 | Verificación (typecheck, lint, tests) | — | 1 h | — |
| **Total** | | **~200 archivos** | **~16 h (2-3 días)** | |

> **Nota:** El plan asume que NO hay datos de producción que preservar. Si hay staging/prod con datos reales, se requiere un script de data migration adicional (ver §Apéndice A).

---

## Fase 0 — Preparación

### 0.1 Entorno
- [ ] PostgreSQL corriendo (Podman: `podman start cuadra-postgres`)
- [ ] `pnpm install` ejecutado, dependencias al día
- [ ] Base de datos limpia (`prisma migrate reset --force`)

### 0.2 Backup
- [ ] Si hay datos en staging/prod: `pg_dump` completo antes de empezar
- [ ] Rama git dedicada: `git checkout -b feat/uuid-migration`

### 0.3 Verificación pre-migración
- [ ] `pnpm typecheck` — 0 errores
- [ ] `pnpm lint` — 0 errores  
- [ ] `pnpm test` (backend) — 32/32 tests pasan

---

## Fase 1 — Schema Prisma

### 1.1 Cambios en `backend/prisma/schema.prisma`

**Regla:** Todo `Int @id @default(autoincrement())` → `String @id @default(uuid()) @db.Uuid`.  
Toda FK que referencia un PK migrado: `Int` → `String @db.Uuid`.

**Modelos a migrar (38):**

| # | Modelo | PK actual | Nueva PK | FKs a cambiar |
|---|--------|-----------|----------|---------------|
| 1 | Role | `id Int` | `id String @db.Uuid` | `roleId` en User, UserOrganization, Invite |
| 2 | User | `id Int` | `id String @db.Uuid` | `userId` en RefreshToken, UserOrganization, Invite(invitedBy), PagoMovilTransaction, SubscriptionPayment(reviewedBy); `currentOrganizationId` |
| 3 | RefreshToken | `id Int` | `id String @db.Uuid` | — |
| 4 | Permission | `id Int` | `id String @db.Uuid` | — |
| 5 | Organization | `id Int` | `id String @db.Uuid` | `organizationId` en 32+ modelos |
| 6 | Plan | `id Int` | `id String @db.Uuid` | `planId` en Organization, SubscriptionPayment |
| 7 | SubscriptionPayment | `id Int` | `id String @db.Uuid` | — |
| 8 | UserOrganization | PK compuesta | `userId String + organizationId String` | — |
| 9 | Invite | `id Int` | `id String @db.Uuid` | — |
| 10 | PagoMovilConfig | `id Int` | `id String @db.Uuid` | — |
| 11 | PagoMovilTransaction | `id Int` | `id String @db.Uuid` | — |
| 12 | Customer | `id Int` | `id String @db.Uuid` | `idCustomer` en Sale |
| 13 | Supplier | `id Int` | `id String @db.Uuid` | `idSupplier` en Stock, PurchaseOrder, WithholdingRecord |
| 14 | Company | `id Int` | `id String @db.Uuid` | `idCompany` en License |
| 15 | License | `id Int` | `id String @db.Uuid` | — |
| 16 | Currency | `id Int` | `id String @db.Uuid` | `currencyId` en ExchangeRate |
| 17 | ExchangeRate | `id Int` | `id String @db.Uuid` | `exchangeRateId` y `officialExchangeRateId` en PurchaseOrder, Sale; `idExchangeRate` en ProductsExchangeRates |
| 18 | ExchangeRateDay | `id Int` | `id String @db.Uuid` | `exchangeRateDayId` en PurchaseOrder |
| 19 | Module | `id Int` | `id String @db.Uuid` | — |
| 20 | Tax | `id Int` | `id String @db.Uuid` | `idTax` en Product |
| 21 | Brand | `id Int` | `id String @db.Uuid` | `idBrand` en Product |
| 22 | Category | `id Int` | `id String @db.Uuid` | `idCategory` en Product; `idParent` (self-ref) |
| 23 | Product | `id Int` | `id String @db.Uuid` | `idProduct` en Stock, PurchaseOrderDet, SalesDet, ProductsExchangeRates |
| 24 | Batch | `id Int` | `id String @db.Uuid` | `idBatch` en Stock |
| 25 | Stock | `id Int` | `id String @db.Uuid` | `idStock` en StockDet; `idProduct`, `idSupplier`, `idBatch`, `idPurchaseOrder` (FKs) |
| 26 | StockDet | `id Int` | `id String @db.Uuid` | — |
| 27 | PurchaseOrder | `id Int` | `id String @db.Uuid` | `idPurchaseOrder` en PurchaseOrderDet, AccountsPayable, WithholdingRecord, Stock |
| 28 | PurchaseOrderDet | `id Int` | `id String @db.Uuid` | — |
| 29 | AccountsPayable | `id Int` | `id String @db.Uuid` | — |
| 30 | WithholdingRecord | `id Int` | `id String @db.Uuid` | — |
| 31 | Sale | `id Int` | `id String @db.Uuid` | `idSale` en SalesDet, SalePayment, AccountsReceivable |
| 32 | SalesDet | `id Int` | `id String @db.Uuid` | — |
| 33 | SalePayment | `id Int` | `id String @db.Uuid` | `saleId` |
| 34 | AccountsReceivable | `id Int` | `id String @db.Uuid` | `idSale` |
| 35 | ProductsExchangeRates | `id Int` | `id String @db.Uuid` | — |
| 36 | SyncCursor | `id Int` | `id String @db.Uuid` | — |
| 37 | SyncConflict | `id Int` | `id String @db.Uuid` | `resolvedBy` |
| 38 | AuditLog | `id Int` | `id String @db.Uuid` | `userId` |

**Campos que NO cambian (se mantienen `Int`):**
- `version` (contador de versión)
- `percentage` (porcentajes)
- `quantity`, `existence`, `totalExistence`, `receivedQuantity` (cantidades)
- `maxUsers` (límite numérico)
- `type` (enum numérico en StockDet)
- `paymentMethod`, `status` (enums representados como Int)

### 1.2 Formato de cada cambio

```prisma
// Antes:
model Product {
  id              Int      @id @default(autoincrement()) @map("id")
  idTax           Int?     @map("id_tax")
  idBrand         Int?     @map("id_brand")
  idCategory      Int?     @map("id_category")
  organizationId  Int      @map("organization_id")
  // ...
}

// Después:
model Product {
  id              String   @id @default(uuid()) @db.Uuid @map("id")
  idTax           String?  @db.Uuid @map("id_tax")
  idBrand         String?  @db.Uuid @map("id_brand")
  idCategory      String?  @db.Uuid @map("id_category")
  organizationId  String   @db.Uuid @map("organization_id")
  // ...
}
```

### 1.3 UserOrganization — PK compuesta

```prisma
// Antes:
model UserOrganization {
  userId         Int @map("user_id")
  organizationId Int @map("organization_id")
  roleId         Int @map("role_id")
  @@id([userId, organizationId])
}

// Después:
model UserOrganization {
  userId         String @db.Uuid @map("user_id")
  organizationId String @db.Uuid @map("organization_id")
  roleId         String @db.Uuid @map("role_id")
  @@id([userId, organizationId])
}
```

---

## Fase 2 — DB Migration + Seed

### 2.1 Estrategia de migración

Dado que no hay datos de producción que preservar (solo seed data), usar `prisma db push --force-reset`:

```bash
cd backend
npx prisma db push --force-reset
npx prisma db seed
```

Esto elimina y recrea todas las tablas con los nuevos tipos UUID.

> **Si hubiera datos de producción:** Ver §Apéndice A al final.

### 2.2 Actualización del seed (`backend/prisma/seed.ts`)

**Problema:** El seed actual usa `upsert` con `where: { id: 1 }`, `where: { id: 2 }`, etc. Con `@default(uuid())`, Prisma genera UUIDs automáticamente en `create`, pero `upsert` con ID hardcodeado ya no funciona.

**Solución:** Eliminar todos los `id` hardcodeados de los `create` blocks y cambiar los `where` de los `upsert` para usar campos únicos (name, slug, code, etc.) en lugar de IDs.

**Ejemplo — Antes:**
```typescript
await prisma.role.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1, name: 'Master', slug: 'master' },
});
```

**Ejemplo — Después:**
```typescript
const masterRole = await prisma.role.upsert({
  where: { slug: 'master' },
  update: {},
  create: { name: 'Master', slug: 'master' },
});
```

**Cambios necesarios en el seed (14 secciones con IDs hardcodeados):**

| Entidad | where antiguo | where nuevo |
|---------|--------------|-------------|
| Roles (4) | `{ id: 1..4 }` | `{ slug: 'master'/'executive'/'manager'/'employee' }` |
| Admin user | `{ id: 1 }` | `{ email: 'admin@cuadra.app' }` |
| Currencies (3) | `{ id: 1..3 }` | `{ code: 'VED'/'USD'/'EUR' }` |
| Plans (4) | `{ name: 'free'/... }` | Ya usa `name` — solo quitar `id` del `create` |
| Organization | `{ id: 1 }` | `{ slug: 'default' }` |
| ExchangeRates (2) | `{ id: 1..2 }` | Cambiar a `create` simple (sin `id`) o usar combinación única |
| Taxes (3) | `{ id: 1..3 }` | Usar `name` + `organizationId` como unique |
| Categories (12) | `{ id: 1..12 }` | Usar `name` + `organizationId`; referencias `idParent` deben usar el objeto retornado |
| Customers (2) | `{ id: 1..2 }` | Usar `idCardNumber` + `organizationId` |
| Suppliers (2) | `{ id: 1..2 }` | Usar `taxId` + `organizationId` |
| Company | `{ id: 1 }` | Usar `taxId` + `organizationId` |
| Products (10) | `{ id: 1..10 }` | Usar `code` |
| Batches (2) | `{ id: 1..2 }` | Usar `code` + `organizationId` |
| Stocks (8) | `{ id: 1..8 }` | Usar `idProduct` + `idSupplier` o `create` simple |
| PurchaseOrders (2) | `{ id: 1..2 }` | Usar `code` |
| PODetails (4) | `{ id: 1..4 }` | `create` directo dentro del PO |
| AccountsPayable | `{ id: 1 }` | `create` directo |

**Categorías con `idParent`:** Al quitar IDs hardcodeados, las relaciones padre-hijo deben establecerse mediante referencias a objetos retornados. Ejemplo:

```typescript
const electronica = await prisma.category.upsert({
  where: { name_organizationId: { name: 'Electrónicos', organizationId: org.id } },
  update: {},
  create: { name: 'Electrónicos', description: '...', organizationId: org.id },
});

await prisma.category.upsert({
  where: { name_organizationId: { name: 'Computación', organizationId: org.id } },
  update: {},
  create: { name: 'Computación', idParent: electronica.id, organizationId: org.id },
});
```

**Nota:** Esto requiere agregar `@@unique([name, organizationId])` al modelo `Category` en el schema, o usar `findFirst` + `upsert` con lógica condicional.

---

## Fase 3 — Backend Controllers (22 archivos)

### 3.1 Regla

- `@Param('id', ParseIntPipe) id: number` → `@Param('id') id: string`
- `@Param('userId', ParseIntPipe) userId: number` → `@Param('userId') userId: string`
- `@Param('roleId', ParseIntPipe) roleId: number` → `@Param('roleId') roleId: string`
- Si hay `@Body('roleId', ParseIntPipe)` → quitar `ParseIntPipe`, mantener `@Body('roleId')`

### 3.2 Archivos

| # | Archivo | Métodos afectados |
|---|---------|-------------------|
| 1 | `products.controller.ts` | findOne, update, remove |
| 2 | `categories.controller.ts` | findOne, update, remove |
| 3 | `brands.controller.ts` | findOne, update, remove |
| 4 | `customers.controller.ts` | findOne, update, remove |
| 5 | `suppliers.controller.ts` | findOne, update, remove |
| 6 | `companies.controller.ts` | findOne, update, remove |
| 7 | `taxes.controller.ts` | findOne, update, remove |
| 8 | `batches.controller.ts` | findOne, update, remove |
| 9 | `stocks.controller.ts` | findOne, update, remove |
| 10 | `sales.controller.ts` | findOne, update, remove |
| 11 | `purchase-orders.controller.ts` | findOne, update, receive, remove |
| 12 | `users.controller.ts` | findById, update, delete |
| 13 | `roles.controller.ts` | findOne |
| 14 | `currencies.controller.ts` | findOne |
| 15 | `exchange-rates.controller.ts` | findOne, update, remove |
| 16 | `admin/admin-users.controller.ts` | findOne, update, remove |
| 17 | `admin/admin-plans.controller.ts` | findOne, update, remove |
| 18 | `admin/admin-orgs.controller.ts` | findOne, update, remove, assignUser, removeUser, changeRole |
| 19 | `admin/admin-invites.controller.ts` | remove |
| 20 | `pago-movil/pago-movil-transaction.controller.ts` | findOne, review |
| 21 | `subscriptions/subscription-payment.controller.ts` | review |
| 22 | `sync/sync.controller.ts` | resolveConflict + `page`/`limit` query params (`parseInt`) |

### 3.3 Validación adicional en controllers

Donde antes `ParseIntPipe` validaba que el parámetro fuera numérico, ahora se debe validar que sea un UUID válido. Opciones:

**A)** Usar `ParseUUIDPipe` de NestJS: `@Param('id', ParseUUIDPipe) id: string`  
**B)** No usar pipe — el `findUnique` de Prisma retornará null si el ID no es válido, y el servicio lanzará `NotFoundException`.

**Recomendación:** Usar `ParseUUIDPipe` en controllers para validación temprana (400 Bad Request vs 404 Not Found).

```typescript
// Antes
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) { ... }

// Después
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) { ... }
```

---

## Fase 4 — Backend DTOs (13 archivos)

### 4.1 Regla

- `@IsInt()` en campos ID → `@IsUUID()` o `@IsString()`
- `@IsNumber()` en campos ID → `@IsUUID()`
- **No cambiar** `@IsInt()` en campos no-ID: `quantity`, `version`, `maxUsers`, `type`

### 4.2 Archivos

| # | Archivo | Campos a cambiar |
|---|---------|-----------------|
| 1 | `sales/dto/create-sale.dto.ts` | `productId` (L15), `idCustomer` (L93) — `@IsInt()` → `@IsUUID()` |
| 2 | `sales/dto/update-sale.dto.ts` | `idCustomer` (L17) — `@IsInt()` → `@IsUUID()` |
| 3 | `purchase-orders/dto/create-purchase-order.dto.ts` | `idSupplier`, `exchangeRateId`, `exchangeRateDayId`, `officialExchangeRateId` → `@IsUUID()`; detail `idProduct` → `@IsUUID()` |
| 4 | `purchase-orders/dto/update-purchase-order.dto.ts` | `idSupplier` (L12) → `@IsUUID()` |
| 5 | `purchase-orders/dto/receive-purchase-order.dto.ts` | detail `id` (L11, referencia al PurchaseOrderDet) → `@IsUUID()` |
| 6 | `payments/create-checkout-session.dto.ts` | `planId`, `organizationId` — `@IsInt()` → `@IsUUID()` |
| 7 | `admin/dto/create-invite.dto.ts` | `organizationId`, `roleId` — `@IsInt()` → `@IsUUID()` |
| 8 | `admin/dto/create-org.dto.ts` | `planId` (L12) — `@IsInt()` → `@IsUUID()` |
| 9 | `admin/dto/update-user.dto.ts` | `roleId` (L9) — `@IsInt()` → `@IsUUID()` |
| 10 | `admin/dto/assign-user-org.dto.ts` | `userId`, `roleId` — `@IsInt()` → `@IsUUID()` |
| 11 | `sync/dto/push-mutation.dto.ts` | `recordId` (L20) — `@IsInt()` → `@IsUUID()` (opcional, puede ser número de sync local) |
| 12 | `subscriptions/subscription-payment.dto.ts` | `planId` — `@IsNumber()` → `@IsUUID()` |
| 13 | `products/dto/create-product.dto.ts` | `idTax`, `idBrand`, `idCategory` — `@IsNumber()` → `@IsUUID()` |

### 4.3 Import update

Agregar `import { IsUUID } from 'class-validator';` donde se use.

---

## Fase 5 — Backend Services + Core (28 archivos)

### 5.1 Regla

- Todo `id: number` en parámetros → `id: string`
- Todo `organizationId: number` → `string`
- Interfaces internas con `id: number` → `id: string`
- `Number(id)` o `parseInt(id)` → eliminar conversión
- `getOrgId(): number` → `getOrgId(): string`

### 5.2 Archivos de servicio (24 archivos, 71+ métodos)

| # | Archivo | Métodos |
|---|---------|---------|
| 1 | `products/products.service.ts` | findOne(id), update(id), remove(id), interfaces ProductWithStock (id, organizationId) |
| 2 | `categories/categories.service.ts` | findOne(id), update(id), remove(id) |
| 3 | `brands/brands.service.ts` | findOne(id), update(id), remove(id) |
| 4 | `customers/customers.service.ts` | findOne(id), update(id), remove(id) |
| 5 | `suppliers/suppliers.service.ts` | findOne(id), update(id), remove(id) |
| 6 | `companies/companies.service.ts` | findOne(id), update(id), remove(id) |
| 7 | `taxes/taxes.service.ts` | findOne(id), update(id), remove(id) |
| 8 | `batches/batches.service.ts` | findOne(id), update(id), remove(id) |
| 9 | `stocks/stocks.service.ts` | findOne(id), update(id), remove(id) |
| 10 | `sales/sales.service.ts` | findOne(id), update(id), remove(id) |
| 11 | `purchase-orders/purchase-orders.service.ts` | findOne(id), update(id), receive(id), remove(id), recalcTotalExistence(productId) |
| 12 | `users/users.service.ts` | findById(id), update(id), delete(id) |
| 13 | `roles/roles.service.ts` | findOne(id) |
| 14 | `currencies/currencies.service.ts` | findOne(id) |
| 15 | `exchange-rates/exchange-rates.service.ts` | findOne(id), update(id), remove(id) |
| 16 | `admin/admin.service.ts` | findOneOrg(id), updateOrg(id), removeOrg(id), findOneUser(id), updateUser(id), deactivateUser(id), findOnePlan(id), updatePlan(id), removePlan(id), removeInvite(id) |
| 17 | `sync/sync.service.ts` | resolveConflict(id), interfaces SyncProductWithStock, SaleWithDetails |
| 18 | `auth/auth.service.ts` | selectOrg(userId, organizationId), me(), logout(), changePassword(), getUserOrgs(), getUserFromToken() |
| 19 | `pago-movil/pago-movil.service.ts` | getTransaction(id), review(id) |
| 20 | `subscriptions/subscription-payment.service.ts` | findAll(status?), findAllAdmin(status?), create(dto, userId), review(id, dto, reviewedBy) |
| 21 | `payments/payments.service.ts` | createCheckoutSession(planId, organizationId) |
| 22 | `subscriptions/subscription-lifecycle.service.ts` | evaluateSubscription(organizationId), evaluateAllActive() |
| 23 | `dashboard/dashboard.service.ts` | getStats(), getAnalytics(), getSalesAnalytics() + interfaces internas |
| 24 | `audit-log/audit-log.service.ts` | log(params) — organizationId param |

### 5.3 Archivos core (4 archivos)

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `tenant/context.service.ts` | `TenantContext.organizationId: number` → `string` |
| 2 | `shared/interfaces/repository.interface.ts` | `findById(id: number)` → `(id: string)`, `update(id: number)` → `(id: string)`, `delete(id: number)` → `(id: string)` |
| 3 | `users/entities/user.entity.ts` | `id: number` → `id: string`, `idRole: number` → `idRole: string` |
| 4 | `auth/entities/auth-token.entity.ts` | `id: number` → `id: string`, `userId: number` → `userId: string` |

### 5.4 Archivos de auth con tipos internos

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `auth/auth.factory.ts` | `orgId: number` → `string` en createUserOrganization; interfaces internas |
| 2 | `auth/dto/login-response.dto.ts` | `user.id: number` → `string`, `role.id: number` → `string` |
| 3 | `users/dto/user-response.dto.ts` | `id: number` → `string`, `idRole: number` → `string` |

### 5.5 Guards

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `common/guards/auth.guard.ts` | `payload.sub` se usa como `number` en queries Prisma → pasa a `string`. Si el JWT payload tiene `sub` como número, debe cambiarse a string en el JWT service. |

### 5.6 JWT Payload

**Importante:** El JWT actual probablemente guarda `sub: user.id` donde `user.id` es `number`. Al migrar a UUID, `sub` será string. Esto es transparente para JWT (el payload acepta strings). Verificar `auth.service.ts` donde se genera el token:

```typescript
// Antes
const payload = { sub: user.id, email: user.email };
// Después — igual, pero user.id ahora es string. Ningún cambio necesario.
```

---

## Fase 6 — Frontend Models + Services (41 archivos)

### 6.1 Models (23 archivos)

**Regla:** `id: number` → `id: string` en todas las interfaces de modelo.

| # | Archivo | Interfaces |
|---|---------|-----------|
| 1 | `products/models/product.model.ts` | Product, CreateProductRequest, UpdateProductRequest |
| 2 | `categories/models/category.model.ts` | Category |
| 3 | `brands/models/brand.model.ts` | Brand |
| 4 | `customers/models/customer.model.ts` | Customer |
| 5 | `suppliers/models/supplier.model.ts` | Supplier |
| 6 | `companies/models/company.model.ts` | Company |
| 7 | `taxes/models/tax.model.ts` | Tax |
| 8 | `batches/models/batch.model.ts` | Batch |
| 9 | `stocks/models/stock.model.ts` | Stock |
| 10 | `purchase-orders/models/purchase-order.model.ts` | PurchaseOrder, PurchaseOrderDetail |
| 11 | `users/models/user.model.ts` | User |
| 12 | `roles/models/role.model.ts` | Role |
| 13 | `exchange-rates/models/exchange-rate.model.ts` | ExchangeRateDay |
| 14 | `auth/models/auth.model.ts` | AuthUser, Organization, LoginResponse |
| 15 | `admin/users/models/admin-user.model.ts` | AdminUser |
| 16 | `admin/plans/models/admin-plan.model.ts` | AdminPlan |
| 17 | `admin/organizations/models/admin-org.model.ts` | AdminOrg |
| 18 | `admin/invites/models/admin-invite.model.ts` | AdminInvite |
| 19 | `dashboard/models/dashboard-analytics.model.ts` | RecentOrder, SaleSummary, etc. |
| 20 | `billing/models/billing.model.ts` | Plan, SubscriptionPayment |
| 21 | `billing/models/subscription-payment.model.ts` | SubscriptionPayment |
| 22 | `settings/payments/models/pago-movil-transaction.model.ts` | PagoMovilTransaction |
| 23 | `settings/payments/models/pago-movil-config.model.ts` | PagoMovilConfig |

### 6.2 Services (18 archivos)

**Regla:** `getById(id: number)` → `getById(id: string)`, `update(id: number, ...)` → `update(id: string, ...)`, `delete(id: number)` → `delete(id: string)`.

| # | Archivo |
|---|---------|
| 1 | `products/services/product.service.ts` |
| 2 | `categories/services/category.service.ts` |
| 3 | `brands/services/brand.service.ts` |
| 4 | `customers/services/customer.service.ts` |
| 5 | `suppliers/services/supplier.service.ts` |
| 6 | `companies/services/company.service.ts` |
| 7 | `taxes/services/tax.service.ts` |
| 8 | `batches/services/batch.service.ts` |
| 9 | `stocks/services/stock.service.ts` |
| 10 | `purchase-orders/services/purchase-order.service.ts` |
| 11 | `users/services/user.service.ts` |
| 12 | `exchange-rates/services/exchange-rate.service.ts` |
| 13 | `admin/users/services/admin-user.service.ts` |
| 14 | `admin/plans/services/admin-plan.service.ts` |
| 15 | `admin/organizations/services/admin-org.service.ts` |
| 16 | `admin/invites/services/admin-invite.service.ts` |
| 17 | `billing/services/subscription-payment.service.ts` |
| 18 | `settings/payments/services/pago-movil-transaction.service.ts` |

---

## Fase 7 — Frontend Hooks (18 archivos)

### 7.1 `useOptimisticCrud` — Cambios core

**Archivo:** `frontend/src/hooks/use-optimistic-crud.ts`

| Línea | Cambio |
|-------|--------|
| 7 | `updateFn: (id: number, data: UpdateDTO)` → `(id: string, data: UpdateDTO)` |
| 8 | `deleteFn: (id: number)` → `(id: string)` |
| 9 | `getTempId?: () => number` → `() => string` |
| 10 | `buildOptimistic?: (data: CreateDTO, tempId: number)` → `(data: CreateDTO, tempId: string)` |
| 14 | `defaultGetTempId = () => -Date.now()` → `() => 'temp-' + crypto.randomUUID()` |
| 16 | `defaultBuildOptimistic<CreateDTO>(data: CreateDTO, tempId: number)` → `tempId: string` |
| 20 | `defaultMerge<T extends { id: number }>` → `<T extends { id: string }>` |
| 24 | `useOptimisticCrud<T extends { id: number }>` → `<T extends { id: string }>` |
| 58 | `{ id: number; data: UpdateDTO }` → `{ id: string; data: UpdateDTO }` |
| 80 | `mutationFn: (id: number)` → `(id: string)` |

### 7.2 Callers de `useOptimisticCrud` (17 archivos)

Cada hook tiene un `buildOptimistic` que recibe `tempId: number` y lo asigna como `id: tempId`. Cambiar `tempId: number` → `tempId: string` en todos.

| # | Hook | Archivo |
|---|------|---------|
| 1 | `useProducts` | `products/hooks/use-products.ts` |
| 2 | `useCategories` | `categories/hooks/use-categories.ts` |
| 3 | `useBrands` | `brands/hooks/use-brands.ts` |
| 4 | `useCustomers` | `customers/hooks/use-customers.ts` |
| 5 | `useSuppliers` | `suppliers/hooks/use-suppliers.ts` |
| 6 | `useCompanies` | `companies/hooks/use-companies.ts` |
| 7 | `useTaxes` | `taxes/hooks/use-taxes.ts` |
| 8 | `useBatches` | `batches/hooks/use-batches.ts` |
| 9 | `useStocks` | `stocks/hooks/use-stocks.ts` |
| 10 | `usePurchaseOrders` | `purchase-orders/hooks/use-purchase-orders.ts` |
| 11 | `useUsers` | `users/hooks/use-users.ts` |
| 12 | `useExchangeRates` | `exchange-rates/hooks/use-exchange-rates.ts` |
| 13 | `useAdminUsers` | `admin/users/hooks/use-admin-users.ts` |
| 14 | `useAdminPlans` | `admin/plans/hooks/use-admin-plans.ts` |
| 15 | `useAdminOrgs` | `admin/organizations/hooks/use-admin-orgs.ts` |
| 16 | `useAdminInvites` | `admin/invites/hooks/use-admin-invites.ts` |
| 17 | `usePagoMovilTransactions` | `settings/payments/hooks/use-pago-movil-transactions.ts` |

### 7.3 Otros hooks con referencias a IDs

Buscar y actualizar cualquier hook en `frontend/src/features/*/hooks/` que tenga `id: number` en parámetros, estados o llamadas a servicio.

---

## Fase 8 — Sync Engine + Dexie (5 archivos)

### 8.1 Dexie local DB (`frontend/src/lib/sync/db.ts`)

#### Interfaces locales — cambiar `number` → `string`:

| Interface | Campos FK |
|-----------|----------|
| `LocalProduct` | `id`, `organizationId`, `taxId`, `brandId`, `categoryId` |
| `LocalCustomer` | `id`, `organizationId` |
| `LocalSupplier` | `id`, `organizationId` |
| `LocalCompany` | `id`, `organizationId` |
| `LocalTax` | `id`, `organizationId` |
| `LocalBrand` | `id`, `organizationId` |
| `LocalCategory` | `id`, `organizationId`, `idParent` |
| `LocalExchangeRate` | `id` |
| `LocalExchangeRateDay` | `id` |
| `ParkedOrder` | `productId`, `customerId` |
| `StockCacheItem` | `productId` |
| `SyncQueueItem` | `recordId` |

#### Schema Dexie — Nueva versión 9:

```typescript
// Versión 9: UUID migration — cambia IDs de number a string
// Todas las tablas con 'id' como clave primaria se recrean
// Las tablas con '++id' (auto-increment) no cambian
localDb.version(9).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
  brands: 'id, updatedAt, organizationId',
  categories: 'id, updatedAt, organizationId',
  exchangeRates: 'id, updatedAt',
  exchangeRateDays: 'id, updatedAt',
  parkedOrders: '++id, createdAt',
  shortcutBindings: '++id',
}).upgrade(async (tx) => {
  // Limpiar datos existentes con IDs numéricos — forzar re-sync
  await tx.table('products').clear();
  await tx.table('customers').clear();
  await tx.table('suppliers').clear();
  await tx.table('companies').clear();
  await tx.table('taxes').clear();
  await tx.table('brands').clear();
  await tx.table('categories').clear();
  await tx.table('exchangeRates').clear();
  await tx.table('exchangeRateDays').clear();
  await tx.table('stockCache').clear();
  await tx.table('parkedOrders').clear();
  await tx.table('syncQueue').clear();
  await tx.table('syncMetadata').clear();
  // NO limpiar shortcutBindings (configuración de usuario)
});
```

**Nota:** El `clear()` en el upgrade es intencional. Los datos offline con IDs numéricos no son compatibles con los nuevos UUIDs del servidor. Al limpiar, se fuerza un re-sync completo la próxima vez que el usuario se conecte.

### 8.2 Sync types (`frontend/src/lib/sync/types.ts`)

| Interface/Campo | Cambio |
|----------------|--------|
| `SyncConflict.id` | `number` → `string` |
| `SyncConflict.recordId` | `number?` → `string?` |
| `SyncConflict.resolvedBy` | `number?` → `string?` |
| `PullResponse.data.products[].id` | `number` → `string` |
| `PullResponse.data.products[].idTax/idBrand/idCategory` | `number?` → `string?` |
| `PullResponse.data.customers[].id` | `number` → `string` |
| `PullResponse.data.exchangeRates[].id` | `number` → `string` |
| `PullResponse.data.exchangeRateDays[].id` | `number` → `string` |
| `PullResponse.data.suppliers[].id` | `number` → `string` |
| `PullResponse.data.companies[].id` | `number` → `string` |
| `PullResponse.data.taxes[].id` | `number` → `string` |
| `PullResponse.data.brands[].id` | `number` → `string` |
| `PullResponse.data.categories[].id` | `number` → `string` |
| `PullResponse.data.categories[].idParent` | `number?` → `string?` |
| `PushMutation.recordId` | `number?` → `string?` |
| `PushResponse.data.accepted` | `number[]` → `string[]` |
| `PushResponse.data.conflicts[].recordId` | `number?` → `string?` |

### 8.3 Sync engine (`frontend/src/lib/sync/sync-engine.ts`)

**Cambios puntuales:**

1. `getStoredOrgId()` — quitar `parseInt`, retornar string directo
2. Las asignaciones de `id: product.id`, `id: customer.id`, etc. en el pull — sin cambios (el valor viene del servidor como string, se pasa a Dexie como string)
3. `syncQueue.markComplete(item.id)` y `markFailed(item.id)` — `item.id` es auto-increment de Dexie (`number`), **sin cambios** (no es ID de servidor)

### 8.4 Conflict resolver (`frontend/src/lib/sync/conflict-resolver.ts`)

- `resolveConflict(id: number, ...)` → `(id: string, ...)`

### 8.5 `getStoredOrgId()` helper

Buscar dónde se define `getStoredOrgId` (probablemente en `sync-engine.ts` o `db.ts`). Cambiar el retorno de `number` a `string` y eliminar `parseInt`.

---

## Fase 9 — DataTable + Componentes Compartidos (3 archivos)

### 9.1 DataTable (`frontend/src/components/ui/data-table.tsx`)

```typescript
// Antes
export function DataTable<T extends { id: number }>({ ... }: DataTableProps<T>)

// Después
export function DataTable<T extends { id: string | number }>({ ... }: DataTableProps<T>)
```

**Nota:** Usar `string | number` en lugar de solo `string` evita que los `++id` de Dexie (números) rompan el DataTable. Los IDs de servidor serán string, los IDs locales de Dexie (`syncQueue`, `sales`, `parkedOrders`) seguirán siendo number.

### 9.2 Otros componentes genéricos

Buscar `extends { id: number }` en componentes compartidos bajo `frontend/src/components/` y `frontend/src/features/`. Cambiar a `string | number` si aplica.

---

## Fase 10 — E2E Tests (4 archivos)

### 10.1 Builders

**`e2e/shared/builders/product.builder.ts`:**
- `ProductData.categoryId?: number` → `string?`
- `ProductData.brandId?: number` → `string?`
- `ProductData.taxId?: number` → `string?`
- `withCategory(id: number)` → `(id: string)`
- `withBrand(id: number)` → `(id: string)`
- `withTax(id: number)` → `(id: string)`

### 10.2 Tasks

Verificar `e2e/modules/*/` tasks que usen IDs numéricos en assertions o selectores. La mayoría de los E2E tests usan selectores por texto (nombres, labels), no por ID. Impacto mínimo esperado.

### 10.3 Test de auth state

El archivo `e2e/.auth/user.json` (si existe) puede contener IDs de organización o usuario numéricos. Se regenera al ejecutar `LoginPage.login()`. No requiere cambios manuales.

---

## Fase 11 — Verificación

### 11.1 Typecheck

```bash
pnpm typecheck
```

Esperado: 0 errores. Si hay errores, iterar por archivo.

### 11.2 Lint

```bash
pnpm lint
```

Esperado: 0 errores.

### 11.3 Backend tests

```bash
pnpm --filter backend test
```

Esperado: 32/32 tests pasan. Posibles fallos:
- Tests que usan IDs numéricos hardcodeados → actualizar a UUIDs de seed
- Tests de `ParseIntPipe` → adaptar a `ParseUUIDPipe`

### 11.4 E2E tests

```bash
# Requiere backend corriendo
pnpm --filter backend dev &
pnpm --filter e2e test
```

### 11.5 Smoke test manual

- [ ] Login con `glozada` / `000000`
- [ ] Navegar a Productos — lista cargada
- [ ] Crear producto — éxito
- [ ] Editar producto — éxito
- [ ] Eliminar producto — éxito
- [ ] POS — buscar y agregar producto
- [ ] Dashboard — KPIs y gráficas cargan

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Fase 8 (Dexie) rompe sync offline | Alta | Alto | `clear()` en upgrade fuerza re-sync limpio. Probar con browser DevTools → Application → IndexedDB → Clear |
| Seed no compila después de quitar IDs hardcodeados | Alta | Medio | Probar `prisma db seed` inmediatamente después de Fase 2 |
| `useOptimisticCrud` genéricos causan errores en cascada | Alta | Medio | Hacer el cambio del hook core PRIMERO, luego actualizar callers |
| `ParseUUIDPipe` rechaza IDs no-UUID de sync queue | Baja | Bajo | Sync queue usa `++id` auto-increment local (number), no pasa por controllers REST |
| JWT `sub` cambia de número a string | Baja | Alto | Verificar `auth.guard.ts` — el guard usa `payload.sub` en queries Prisma. Si el token viejo tiene `sub: 1` (número) y el nuevo `sub: "uuid"`, tokens existentes quedan inválidos tras la migración → **todos los usuarios deben re-login** |
| Category `idParent` se rompe en seed | Media | Medio | Agregar `@@unique([name, organizationId])` a Category o usar `findFirst` |

---

## Apéndice A — Migración con datos de producción

Si hay datos reales que preservar (staging/prod), NO usar `db push --force-reset`. En su lugar:

1. Agregar columna `uuid UUID DEFAULT gen_random_uuid()` a cada tabla
2. Poblar las columnas uuid (se auto-pueblan con el default)
3. Para cada FK: agregar nueva columna `new_fk UUID`, poblarla con JOIN a la tabla referenciada
4. Cambiar código para usar las nuevas columnas uuid
5. Hacer deploy del código actualizado
6. Dropear columnas INT viejas y renombrar uuid → nombre original

Este proceso toma 2-3x más tiempo y requiere un script de migración manual extenso (~500 líneas SQL). Solo justificado si hay datos de producción.

---

## Apéndice B — Rollback

Una vez aplicada la migración UUID y desplegado el código, **no hay rollback sencillo**. Las PKs cambiaron de tipo, los datos se regeneraron, los tokens JWT cambiaron. 

Si se requiere rollback:
1. Revertir código al commit pre-migración
2. `prisma db push --force-reset` (pierde todos los datos)
3. `prisma db seed` (regenera con IDs numéricos)

**No hay pérdida de datos reales si solo hay seed data.**

---

*Referencia cruzada: [architecture.md](../system/architecture.md) | [database.md](../system/database.md) | [testing.md](../system/testing.md) | [deployment.md](../DevOps/deployment.md)*
