# Feature: Dashboard (live overview)

> **status:** `current`  
> **owner:** ops / gerencia  
> **last-verified:** 2026-08-08  
> **code:** `backend/src/modules/dashboard/` · `frontend/src/features/dashboard/` · `frontend/src/app/(dashboard)/dashboard/page.tsx`

Contrato del **dashboard en vivo** (role-aware). Sustituye los contadores totales (clientes/proveedores/productos/órdenes) por KPIs del día, feed de ventas, alertas de stock y resumen CXC/CXP.

Diseño validado 2026-08-08: persona mixto · push SSE+Redis · widgets A/B/C/E · layout KPI strip + feed + stock + AR/AP.

### Auth SSE (shipped)

Stream via `fetch` + `ReadableStream` with `Authorization: Bearer` (not browser `EventSource`).

---

## 1. Purpose / Non-goals

### Purpose

Dar a cada rol una vista operativa **útil y en tiempo casi real** al abrir el home del dashboard: cómo va el día, qué se está vendiendo, qué stock urge, y (manager+) salud de cobros/pagos — sin entrar a reportes ni POS.

### Non-goals (v1)

- Widget de caja / cash-register.
- Salud de sync / conflictos offline.
- WebSockets / bi-directional channel.
- Layout personalizable por usuario.
- Multi-sucursal / comparación entre orgs.
- Sustituir el módulo de reportes (CXC/CXP aquí es **resumen**, no aging completo).

---

## 2. Domain model

### Snapshot (`GET /dashboard/overview`)

| Campo | Descripción |
|---|---|
| `connection` | Metadatos UI: timezone org (default `America/Caracas`) |
| `kpis.todaySalesCount` | Ventas del día local |
| `kpis.todayRevenue` | Suma `amount` del día |
| `kpis.avgTicket` | Revenue / count (0 si count=0) |
| `kpis.lowStockCount` | Productos bajo umbral |
| `kpis.vsYesterday` | Deltas relativos count/revenue/ticket (`pct` o `null` si ayer=0) |
| `recentSales[]` | Últimas N (default 20): `id`, `code`, `amount`, `customerName`, `createdAt` |
| `stockAlerts[]` | Productos bajo umbral: `id`, `name`, `totalExistence` |
| `arAp` | **Solo manager+**: `{ receivableTotal, receivableOverdue, payableTotal, payableDue7d }` — omitido para employee |

### Stream events (`GET /dashboard/stream`)

| `type` | Payload | Quién lo recibe |
|---|---|---|
| `sale.created` | misma forma que ítem de `recentSales` | todos los roles org |
| `stock.low` | ítem de alerta (dedupe por productId ~5 min) | todos |
| `kpi.patch` | parcial de `kpis` (count/revenue/ticket/vsYesterday/lowStockCount) | todos |
| `heartbeat` | timestamp | todos (keep-alive ~15s) |

AR/AP **no** se empuja en v1; manager refresca overview al reconnect o al abrir (snapshot). Opcional later: `arap.patch`.

### Redis channel

`dashboard:{organizationId}` — JSON `{ type, payload, at }`.  
Publish **nunca** bloquea ni falla la venta/stock write (fail-open + log).

---

## 3. Business rules / invariants

1. **“Hoy”** = día calendario en timezone de la org (default VE `America/Caracas`), no UTC midnight.
2. **Estados de venta en KPIs/feed:** incluir lo que el POS persiste hoy (**DRAFT** inclusive) hasta que ISSUED sea el default; **excluir `ANNULLED`** cuando exista.
3. **Idempotencia UI:** feed keyed por `sale.id` — upsert, no duplicar.
4. **RBAC datos:** employee nunca recibe `arAp` en overview ni eventos AR/AP futuros.
5. **Plan:** `@PlanLevel('free')` (dashboard ya está en free).
6. **Org isolation:** channel y queries siempre scoped a `organizationId` del contexto.

---

## 4. API contract

| Method | Path | RBAC | Plan | Notas |
|---|---|---|---|---|
| `GET` | `/dashboard/overview` | `@MinOrgLevel(employee)` | free | Snapshot completo (AR/AP filtrado) |
| `GET` | `/dashboard/stream` | `@MinOrgLevel(employee)` | free | `text/event-stream`; auth JWT (ver § Auth SSE) |
| `GET` | `/dashboard/stats` | employee | free | **Legacy** — deprecar en UI; mantener 1 release |
| `GET` | `/dashboard/analytics` | employee | free | Legacy PO-centric — no usar en nueva UI |
| `GET` | `/dashboard/sales-analytics` | employee | free | Legacy — absorbido por overview |

### Auth SSE

`EventSource` no envía `Authorization` de forma portable. Opciones aceptadas (elegir una en implementación, documentar aquí al shippear):

1. **Preferida:** stream vía `fetch` + `ReadableStream` con header `Authorization: Bearer …` (mismo client API).
2. Alternativa: ticket de stream de un solo uso (`POST /dashboard/stream-ticket` → `?ticket=` TTL corto).

### Publish hooks (backend)

| Trigger | Events |
|---|---|
| Sale create exitoso (incl. path sync → `SalesService.create`) | `sale.created`, `kpi.patch` |
| Stock/existencia cruza umbral low | `stock.low` (dedupe) |

Fallback si Redis caído: bus in-process (single node). Overview siempre funciona sin Redis.

---

## 5. UI flows

### Layout (Adopted pattern: Dashboard / KPIs — `.spec/UI-UX/patterns.md` §C)

```
[ KPI ×4 + live indicator ]
[ Feed | Stock | CXC/CXP (manager+) ]   ← una sola fila
```

- Sin `<h1>` propio (layout dashboard).
- Skeletons en carga inicial; empty states con CTA (POS / productos).
- Al **reconnect** SSE: refetch `overview` para cerrar huecos. Un deploy tira el stream; el cliente reintenta solo ([deployment.md](../DevOps/deployment.md) §7). El dashboard **sí** se interrumpe; el POS no.
- i18n: claves bajo `dashboard.*` (es/en sync).

### Role chrome

| Rol | Ve |
|---|---|
| `employee` | KPIs + feed + stock |
| `manager` / `executive` | + tarjeta CXC/CXP |

---

## 6. Cross-module

| Módulo | Relación |
|---|---|
| `sales` / `sync` | Fuente de `sale.created`; cobro POS no usa `POST /sales` |
| `stocks` / products | Umbral low stock (reusar `stockService.getAlerts` / misma regla) |
| `reports` | Aging detallado; dashboard solo totales/vencido/7d |
| Redis `CacheService` / ioredis | Pub/sub fan-out (puede extender servicio o módulo `DashboardEvents`) |

---

## 7. Definition of Done

- [x] `GET /dashboard/overview` con KPIs del día + vs ayer, feed, alerts, AR/AP role-filtered
- [x] `GET /dashboard/stream` SSE + Redis channel por org + heartbeat
- [x] Publish fail-open desde sale create y stock low
- [x] Frontend: layout nuevo; React Query snapshot + apply SSE patches; reconnect+refetch
- [x] Employee no ve ni recibe AR/AP
- [x] i18n es/en
- [x] Unit: KPI windows con clock fijo (`dashboard-day.util.spec.ts`)
- [ ] Integration o manual: venta POS aparece en otro browser sin refresh
- [x] Feature spec status → `current` al merge
- [x] Actualizar `.spec/README.md` / features index

---

## 8. Anti-patterns

- No volver a mostrar lifetime counts (clientes/proveedores/productos) como KPIs primarios.
- No bloquear `SalesService.create` si publish falla.
- No filtrar AR/AP solo en el cliente.
- No usar WebSocket “por si acaso” en v1.
- No inventar widget de caja aquí — va a feature `cash-register` cuando exista.

---

## 9. Legacy → target

| Hoy (código) | Target |
|---|---|
| Stat cards: customers, suppliers, products, orders | KPI strip del día |
| Bento: recent POs, stock alerts (poll 30s), monthly sales | Live feed + stock (SSE) + AR/AP |
| `getAnalytics` centrado en purchase orders | Overview centrado en **sales** |

---

*Índice: [README.md](README.md) · Sales: [sales.md](sales.md) · Sync: [sync.md](sync.md) · Reports: [reports.md](reports.md) · Deploy: [deployment.md](../DevOps/deployment.md)*
