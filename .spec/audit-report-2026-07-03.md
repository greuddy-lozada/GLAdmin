# Audit Report — Cuadra v0.x

> **Fecha:** 2026-07-03  
> **Alcance:** Backend (NestJS + Prisma) + Frontend (Next.js App Router)  
> **Reglas auditadas:** `.spec/system/*.md`, `.spec/UI-UX/design-system.md`, `.spec/DevOps/*.md`, `.spec/AGENTS.md`  
> **Métricas rápidas:** `pnpm typecheck` ✅ 0 errores | `pnpm lint` ✅ 0 warnings | Tests: 1 archivo (audit-log)

---

## Resumen Ejecutivo

| Área | Hallazgos Críticos | Hallazgos Altos | Hallazgos Medios |
|---|---|---|---|
| Database | 5 | 2 | 1 |
| Security | 7 | 5 | 5 |
| API Conventions | 0 | 4 | 0 |
| Architecture | 0 | 3 | 3 |
| Performance | 1 | 0 | 2 |
| UI/UX | 0 | 1 | 2 |
| Testing | 1 | 0 | 0 |
| i18n | 0 | 0 | 0 |
| Git Hygiene | 0 | 3 | 2 |
| **TOTAL** | **14** | **18** | **15** |

---

## 1. Database — 8 hallazgos

### 🔴 Críticos

| ID | Regla violada | Descripción | Ubicación |
|---|---|---|---|
| DB-01 | UUIDs como PKs | **0 de 38 modelos** usan UUID. Todos usan `Int @id @default(autoincrement())`. | `backend/prisma/schema.prisma` (todo el archivo) |
| DB-02 | snake_case para tablas | **1 de 38 modelos** tiene `@@map()`. Los otros 37 generan nombres PascalCase. | `backend/prisma/schema.prisma` |
| DB-03 | snake_case para columnas | **0 columnas** usan `@map()`. Todas son camelCase. | `backend/prisma/schema.prisma` |
| DB-04 | Soft delete (`deleted_at`) | **12 modelos de negocio/financieros** carecen de soft delete: `Sale`, `PurchaseOrder`, `AccountsPayable`, `AccountsReceivable`, `WithholdingRecord`, `SalePayment`, `SubscriptionPayment`, `PagoMovilTransaction`, `Tax`, `Batch`, `StockDet`, `Company` | `backend/prisma/schema.prisma` |
| DB-05 | Inmutabilidad financiera | `PurchaseOrder.status` y `Sale.status` son `Int?` (nullable int) sin enum. No existen columnas `annulled_at` ni `annulment_reason`. | `backend/prisma/schema.prisma` |

### 🟠 Altos

| ID | Descripción |
|---|---|
| DB-06 | ~35 FK indexes faltantes. `PurchaseOrderDet.idPurchaseOrder`, `SalesDet.idSale`, `StockDet.idStock` y otros 32 FKs sin índice. |
| DB-07 | El proyecto usa **SQLite** pero la spec asume **PostgreSQL**. Tipos como `@db.Uuid`, `@db.Decimal`, `@db.JsonB` no aplican. |

### 🟡 Medio

| ID | Descripción |
|---|---|
| DB-08 | Soft delete inconsistente: algunos modelos usan `available`, otros `isActive`, otros nada. Ninguno usa `deleted_at` (DateTime) como pide la spec. |

---

## 2. Security — 17 hallazgos

### 🔴 Críticos

| ID | Regla violada | Descripción | Ubicación |
|---|---|---|---|
| SEC-01 | **REGLA DE ORO** — Inmutabilidad Contable | `sales.service.ts:update()` permite modificar cualquier Sale sin verificar status. No existe `if (status === 'issued') throw ForbiddenException`. | `backend/src/modules/sales/sales.service.ts:133-156` |
| SEC-02 | **REGLA DE ORO** — Inmutabilidad Contable | `purchase-orders.service.ts:update()` permite modificar cualquier PurchaseOrder sin verificar status. Montos, IVA, proveedor — todo mutable. | `backend/src/modules/purchase-orders/purchase-orders.service.ts:149-249` |
| SEC-03 | **REGLA DE ORO** — Endpoint prohibido | `PATCH /api/sales/:id` y `PATCH /api/purchase-orders/:id` existen sin restricción de status. La spec dice: "No existe endpoint PATCH para facturas con status='issued'". | `backend/src/modules/sales/sales.controller.ts:43`, `purchase-orders.controller.ts` |
| SEC-04 | Audit logging | Solo se loguea login/logout. **Ninguna** operación financiera (crear venta, anular, modificar PO, recibir pago) se audita. La spec requiere log para: user creation/deletion, role changes, payment operations, data exports. | `backend/src/modules/audit-log/audit-log.service.ts` (solo llamado desde auth) |
| SEC-05 | Multi-tenancy data leak | `purchase-orders.service.ts:findAll()` no filtra por `organizationId`. Retorna órdenes de compra de TODAS las organizaciones. | `backend/src/modules/purchase-orders/purchase-orders.service.ts:124-135` |
| SEC-06 | Role mismatch | La spec define `superadmin, admin, accountant, cashier, viewer`. El código usa `master, executive, manager, employee`. Sistemas incompatibles. | `backend/src/common/decorators/min-level.decorator.ts:4-8` |
| SEC-07 | DTOs de Update exponen campos financieros | `UpdateSaleDto` (via `PartialType(CreateSaleDto)`) permite modificar `amount`, `amountUsd`, `totalTax`, `exchangeRate`, `withholdingAmount`. La spec prohíbe exponer estos campos en DTOs de Update. | `backend/src/modules/sales/dto/update-sale.dto.ts:4` |

### 🟠 Altos

| ID | Descripción |
|---|---|
| SEC-08 | JWT Access Token expira en **7 días**. La spec exige **15 minutos**. (`app.module.ts:70`) |
| SEC-09 | bcrypt salt rounds = **10**. La spec exige **12**. (`auth.service.ts:315`) |
| SEC-10 | PII (email) se loguea en metadata de auditoría: `{ email: dto.email }`. (`auth.service.ts:64,78`) |
| SEC-11 | `@Roles()` ausente en `POST /api/auth/select-org` y `POST /api/auth/logout` — cualquier rol autenticado puede acceder. |
| SEC-12 | Purchase orders: `findAll` sin `organizationId` = data leak multi-tenant (duplicado de SEC-05). |

### 🟡 Medios

| ID | Descripción |
|---|---|
| SEC-13 | Rate limiting global = 100 req/min. La spec exige límites por endpoint: auth 5/min, reports 10/min, invoices 30/min. Ninguno implementado. |
| SEC-14 | `@SkipThrottle()` en AuthController deshabilita throttle para logout y select-org (sin protección alternativa). |
| SEC-15 | `CreateSaleDto`: campos `amount`, `amountUsd`, `exchangeRate` sin `@Min(0)` — permiten valores negativos. `quantity` sin `@Min(1)`. |
| SEC-16 | `CreatePurchaseOrderDto`: `idSupplier` usa `@IsNumber()` en vez de `@IsInt()`. Montos sin `@Min(0)`. |
| SEC-17 | Helmet: CSP deshabilitado (`contentSecurityPolicy: false`), HSTS ausente. |

---

## 3. API Conventions — 4 hallazgos

### 🟠 Altos

| ID | Regla violada | Descripción | Ubicación |
|---|---|---|---|
| API-01 | Response format | `TransformInterceptor` devuelve `{ data, message, statusCode }`. La spec exige `{ data, meta?, error? }`. Campos `message` y `statusCode` no existen en el contrato. | `backend/src/common/interceptors/transform.interceptor.ts:12-15` |
| API-02 | Error format | `HttpExceptionFilter` devuelve `{ data: null, message, errors, statusCode }`. La spec exige `{ error: { code, message, details? } }`. Sin envelope `error`, sin `code`. | `backend/src/common/filters/http-exception.filter.ts:57-62` |
| API-03 | Pagination | `PaginationQueryDto` no tiene `sort` ni `order`. Response de paginación no incluye `totalPages`. Campos `total`, `page`, `limit` van en top-level en vez de `meta`. | `backend/src/common/dto/pagination-query.dto.ts` |
| API-04 | Error codes | **0 error codes** en todo el código. Los servicios lanzan `throw new NotFoundException('texto plano')`. La spec exige formato `{MODULE}_{NÚMERO}` (ej: `SALE_001`). | Todo el backend |

---

## 4. Architecture — 6 hallazgos

### 🟠 Altos

| ID | Descripción |
|---|---|
| ARC-01 | `admin/subscription-payments` cruza features: importa hooks y services de `features/billing/`. Violación de Vertical Slicing. |
| ARC-02 | `features/dashboard/hooks/use-dashboard-analytics.ts` llama a `apiClient` directamente — no hay capa de servicio. |
| ARC-03 | `features/pos/pos-page.tsx` está en la raíz del feature en vez de `components/pos-page.tsx`. |

### 🟡 Medios

| ID | Descripción |
|---|---|
| ARC-04 | 6 features no tienen la estructura completa de 4 archivos (`admin/subscription-payments`, `auth`, `dashboard`, `pos`, `shortcuts`, `sync`). |
| ARC-05 | `features/sync/conflicts-page.tsx` está en la raíz del feature en vez de `components/`. |
| ARC-06 | Backend usa `modules/` como directorio en vez del `features/` que pide la spec. |

---

## 5. Performance — 3 hallazgos

### 🔴 Crítico

| ID | Descripción | Ubicación |
|---|---|---|
| PERF-01 | `purchase-orders.service.ts:receive()` genera **4 queries por línea recibida** dentro de un for-loop. Recibir 10 líneas = 40 queries. | `backend/src/modules/purchase-orders/purchase-orders.service.ts:258-315` |

### 🟡 Medios

| ID | Descripción |
|---|---|
| PERF-02 | `sales.service.ts:create()` y `remove()` ejecutan `updateMany` + `recalcTotalExistence` dentro de for-loop (2 queries por item). El recalc puede diferirse. |
| PERF-03 | `sales.service.ts:findOne()` no incluye `payments` en el `include` — N+1 si el caller necesita payments. |

### ✅ Cumplen

- `products.service.ts` — `include` completo en todos los métodos
- `stocks.service.ts` — `include` completo
- `customers.service.ts` — sin relaciones, sin N+1
- `suppliers.service.ts` — sin relaciones, sin N+1

---

## 6. UI/UX — 3 hallazgos

### 🟠 Alto

| ID | Descripción |
|---|---|
| UI-01 | **11 icon buttons** sin `aria-label`: slide-form (close), data-table (edit/delete), login (panel toggle), y 7 botones de "remove proof" en customer/supplier/POS forms. |

### 🟡 Medios

| ID | Descripción |
|---|---|
| UI-02 | 5 páginas/componentes muestran texto o spinner en vez de skeletons durante carga: `pos-page`, `shortcuts-page`, `conflicts-page`, `dashboard-bento`, `stock-alerts-panel`. |
| UI-03 | Ningún formulario muestra errores inline debajo del campo individual. Todos usan un solo `Alert` superior con error global. |

### ✅ Cumplen

- Cero `<h1>` duplicados en feature pages
- Cero `<select>` nativos — todos usan shadcn `Select`
- `DataTable` y `SlideForm` muestran skeletons correctamente
- `EmptyState` se usa en DataTables (excepto sync conflicts y stock alerts)

---

## 7. Testing — 1 hallazgo

### 🔴 Crítico

| ID | Descripción |
|---|---|
| TST-01 | **1 solo archivo de test** en todo el proyecto (`audit-log.service.spec.ts`). La spec exige ≥80% cobertura de líneas, tests unitarios por feature, tests E2E para flujos críticos (login, CRUD producto, factura completa, POS). **0 E2E tests.** El frontend no tiene script `test` en `package.json`. |

---

## 8. i18n — 0 hallazgos

✅ `es.json` y `en.json` están perfectamente sincronizados (916 líneas, misma estructura, mismas keys). Cumple al 100%.

---

## 9. Git Hygiene — 5 hallazgos

### 🟠 Altos

| ID | Descripción |
|---|---|
| GIT-01 | **Sin Husky** — no hay `.husky/` ni git hooks (pre-commit, commit-msg). |
| GIT-02 | **Sin commitlint** — conventional commits son voluntarios, no forzados por tooling. |
| GIT-03 | `frontend/.env.local.example` no está tracked en git — el `.gitignore` usa `!*/.env.example` que no matchea `.env.local.example`. |

### 🟡 Medios

| ID | Descripción |
|---|---|
| GIT-04 | Branch naming no sigue convención: rama actual es `refactor` en vez de `refactor/descripcion`. No hay prefijos `feat/`, `fix/`, `chore/`. |
| GIT-05 | Solo existen ramas `master` y `refactor` — no hay `develop` como pide la spec de git hygiene. |

### ✅ Cumplen

- Los 30 commits recientes siguen conventional commits (feat, refactor, docs)
- `.gitignore` cubre bien secrets, builds, deps

---

## 10. Lo que SÍ está bien

| Área | Detalle |
|---|---|
| TypeScript | `pnpm typecheck` pasa con **0 errores** en backend y frontend |
| ESLint | `pnpm lint` pasa con **0 warnings** en ambos workspaces |
| i18n | `es.json` ↔ `en.json` sincronizados , misma estructura |
| Convenciones de componentes | `SlideForm`, `ConfirmDialog`, `DataTable` bien implementados y reusados |
| Servicios frontend | Patrón consistente de 5 métodos CRUD via `apiClient` en 18 features |
| No `<h1>` duplicados | Cero h1 en feature pages — el dashboard layout maneja títulos |
| No `<select>` nativos | 100% shadcn `Select` |
| Conventional commits | Todos los commits recientes siguen el formato |
| PATCH (no PUT) | Todos los controladores usan `@Patch()` para updates |
| Soft delete parcial | `products.service.ts` y modelos con `available`/`isActive` usan soft delete |

---

## Priorización Recomendada

### 🔥 Bloqueantes (fix inmediato — 7 items)

1. **SEC-05** — Data leak multi-tenant en purchase orders `findAll` (agregar `organizationId` al where)
2. **SEC-01** — Agregar guard de status en `sales.service.ts:update()` 
3. **SEC-02** — Agregar guard de status en `purchase-orders.service.ts:update()`
4. **SEC-03** — Restringir endpoints PATCH de sales y purchase-orders por status
5. **PERF-01** — Refactorizar `purchase-orders.service.ts:receive()` para batch queries
6. **SEC-07** — Eliminar campos financieros de `UpdateSaleDto` y `UpdatePurchaseOrderDto`
7. **SEC-08** — Reducir JWT access token expiry de 7d a 15min

### ⚡ Alta prioridad (siguiente sprint — 6 items)

8. **DB-01, DB-02, DB-03** — Migrar PKs a UUID y nombres a snake_case (requiere migración grande + data migration script)
9. **SEC-04** — Agregar audit logging a operaciones financieras (crear venta, anular, modificar PO)
10. **API-01, API-02** — Corregir formato de response y error en interceptor/filter
11. **API-04** — Implementar sistema de error codes `{MODULE}_{NÚMERO}`
12. **TST-01** — Agregar tests unitarios y E2E (empezar por flujos críticos: login, POS, factura)
13. **DB-04** — Agregar soft delete a los 12 modelos financieros faltantes

### 📋 Backlog (planificar — resto)

14. **SEC-13** — Rate limiting por endpoint
15. **API-03** — Completar pagination DTO con sort/order/totalPages
16. **UI-01** — Agregar aria-labels a 11 icon buttons
17. **SEC-06** — Migrar roles del sistema `master/executive/manager/employee` a `admin/accountant/cashier/viewer`
18. **PERF-02** — Diferir `recalcTotalExistence` en sales.service.ts
19. **ARC-01** — Eliminar cross-feature imports en admin subscription-payments
20. **GIT-01** — Configurar Husky + commitlint
21. **DB-05** — Crear enums `InvoiceStatus`, `PurchaseOrderStatus` en Prisma schema
22. **DB-07** — Migrar de SQLite a PostgreSQL

---

*Generado automáticamente contra las reglas de `.spec/`. Archivos de reglas: architecture.md, security.md, database.md, api-conventions.md, testing.md, performance.md, design-system.md, git-hygiene.md, AGENTS.md*
