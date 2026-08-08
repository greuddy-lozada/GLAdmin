# Feature: Products

> **status:** `current`  
> **owner:** inventario  
> **last-verified:** 2026-08-08  
> **code:** `backend/src/modules/products/` · `frontend/src/features/products/`

Contrato del módulo de catálogo. Si el código y esta spec divergen, **actualizar esta spec en el mismo PR** que cambia el comportamiento.

---

## 1. Purpose / Non-goals

### Purpose

Maestro de productos (SKU/código + nombre + precios multi-moneda + tax/brand/category) para que el POS y el inventario operen sobre un catálogo consistente por organización.

### Non-goals

- No es dueño del movimiento de stock (eso es `stocks` / `batches`).
- No emite ventas ni cobros (eso es `sales` / POS / `pago-movil`).
- No es facturación fiscal SENIAT (fuera de scope — ver product-strategy Later).
- Brands no tienen página de nav dedicada hoy; se crean inline desde el form de producto o vía API `/brands`.

---

## 2. Domain model

### Prisma `Product` (`products`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `code` | string | Código / SKU — indexado |
| `name` | string | Nombre visible |
| `price` | Decimal(18,4) | PVP en VES |
| `dollarPrice` | Decimal(18,4)? | PVP en USD |
| `baseCost` | Decimal(18,4)? | Costo base USD |
| `margin` | Float | Default `20` (%) |
| `totalExistence` | Int | Denormalizado; stock operativo vive en `stocks` |
| `idTax` / `idBrand` / `idCategory` | UUID? | FKs opcionales |
| `observation` / `image` | string? | Metadata |
| `version` | Int | Optimistic locking |
| `available` | Boolean | Default `true` — listados filtran `available: true` |
| `organizationId` | UUID | Tenant — obligatorio |
| `createdAt` / `updatedAt` / `deletedAt` | DateTime | Soft-delete Prisma vía `deletedAt` |

Frontend model: `frontend/src/features/products/models/product.model.ts` (Zod).  
Backend DTO: `CreateProductDto` / `UpdateProductDto`.

---

## 3. Business rules

### Multi-tenancy

- Toda escritura asocia `organizationId` del contexto tenant.
- Lecturas se filtran por organización (Prisma extension + `ContextService`).
- Nunca listar/mutar productos de otra org.

### Pricing (PVP)

Fórmulas canónicas (frontend UI + backend `enrichWithPvp`):

```
PVP_USD = baseCost × (1 + margin / 100)
PVP_VES = PVP_USD × rateBcvUsd   // última ExchangeRateDay de la org
```

| Regla | Comportamiento |
|---|---|
| Si hay `baseCost` + `margin` y **no** se envía `dollarPrice` explícito | Backend calcula `dollarPrice` |
| Si falta `price` y hay `dollarPrice` > 0 | Backend intenta rellenar `price` con tasa BCV; fallo de tasa **no** bloquea el CUD |
| Override manual de PVP USD | UI: toggle `pvpOverride`; envía `dollarPrice` explícito |
| Margen default | `20` |

### Availability vs soft-delete

| Acción | Comportamiento actual |
|---|---|
| `DELETE /api/products/:id` (service `remove`) | Setea `available: false` (desactiva). **No** setea `deletedAt` |
| `prisma.product.delete` (si se usara) | Extension Prisma → `deletedAt = now()` |
| Listados (`findAll`, `findAllWithStock`) | Solo `available: true` (+ `deletedAt: null` vía extension) |

Preferir desactivación vía API pública. No hard-delete filas con historial en `sale_details` / `purchase_order_details` / `stocks`.

### Stock

- `GET ?includeStock=true` suma `stocks.existence` → campo `stock` en response.
- El form de productos **no** edita stock; stock se gestiona en Inventario / recepción de pedidos.

---

## 4. API contract

Base: `/api/products`  
Plan: `@PlanLevel('starter')` en el controller.

| Método | Ruta | Min org level | Notas |
|---|---|---|---|
| `POST` | `/` | manager (60) | Create |
| `GET` | `/` | employee (40) | Paginated; `search` en name/code; cache 5 min si no hay search |
| `GET` | `/?includeStock=true` | employee (40) | Incluye stock agregado |
| `GET` | `/:id` | employee (40) | UUID |
| `PATCH` | `/:id` | manager (60) | Partial update |
| `DELETE` | `/:id` | master (100) | Soft-deactivate (`available: false`) |

Paginación: `page` default 1, `limit` default 20 (máx según `PaginationQueryDto`).

### Cache

- Key prefix: `products:list:{orgId}:`
- TTL: 300s
- Invalidar en create / update / remove

### Related endpoints (catálogo)

| Recurso | Uso desde Products UI |
|---|---|
| `GET/POST /taxes` | Select de impuesto |
| `GET/POST /brands` | Select + crear marca inline |
| `GET /categories` | Select de categoría |
| `GET` latest exchange rate day | Tasa BCV para PVP VES |

---

## 5. UI flows

| Pieza | Path |
|---|---|
| Page route | `frontend/src/app/(dashboard)/products/page.tsx` |
| Feature page | `components/products-page.tsx` |
| Hook | `hooks/use-products.ts` → `useOptimisticCrud` |
| Service | `services/product.service.ts` (singular) |
| Nav | `navigation.config.ts` → `/products`, `minLevel: 40`, `requiredFeature: 'products'` |

### UX rules

- **No** renderizar `<h1>` — el layout dashboard ya muestra el título.
- Create/Edit: `SlideForm`; Delete: `ConfirmDialog`.
- Create button: `RoleGuard minLevel={60}`.
- Edit: `hasMinLevel(role, 60)`; Delete: `hasMinLevel(role, 100)`.
- Success: `sileo.success` + i18n `products.{created,updated,deleted}`.
- Errors: inline `<Alert variant="destructive">`, no toast de error.
- Strings: keys bajo `products.*` en `es.json` / `en.json` (mantener sync).

### Columns

name · PVP USD · PVP VES · stock · tax · brand · category · available

---

## 6. Cross-module

| Módulo | Relación |
|---|---|
| `categories` / `brands` / `taxes` | FK opcionales; brands creables inline |
| `stocks` / `batches` | Existencia y lotes |
| POS / sync (Dexie) | Catálogo offline; `LocalProduct` en sync engine |
| `sales` / `purchase-orders` | Líneas referencian `id_product` |
| `exchange-rates` | Tasa BCV para VES |
| Plan gating | Feature flag `products`; API requiere plan ≥ starter |

---

## 7. Definition of Done

- [ ] CRUD cumple RBAC y `@PlanLevel('starter')`
- [ ] Precios siguen fórmulas de §3 (con/sin override)
- [ ] Listados solo productos `available: true` de la org actual
- [ ] Cache invalidado en CUD
- [ ] i18n `es` + `en` sincronizados
- [ ] Unit tests `products.service.spec.ts` verdes
- [ ] E2E `e2e/modules/products/` cubre create → edit → delete
- [ ] Esta spec actualizada si cambió contrato o reglas

---

## 8. Anti-patterns

- No llamar `apiClient` desde componentes para el CRUD principal (usar `productService` / hook). *Nota: el form aún carga taxes/brands/categories vía `apiClient` — deuda; ideal mover a services de esos features.*
- No usar `PUT` — solo `PATCH` para updates.
- No hard-delete de productos con historial.
- No inventar módulo `invoices` para ventas — el dominio de venta es `sales`.
- No asumir path `backend/src/features/` — el backend usa `backend/src/modules/`.

---

*Referencia: [architecture.md](../system/architecture.md) · [database.md](../system/database.md) · [security.md](../system/security.md) · [product-strategy.md](../business/product-strategy.md)*
