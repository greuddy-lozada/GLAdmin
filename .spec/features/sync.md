# Feature: Sync / Offline

> **status:** `current`  
> **owner:** plataforma  
> **last-verified:** 2026-08-08  
> **code:** `backend/src/modules/sync/` · `frontend/src/lib/sync/` · `frontend/src/features/sync/`

Contrato offline-first (Dexie + push/pull). Diferenciador de producto — no reinventar.

---

## 1. Purpose / Non-goals

### Purpose

Mantener catálogo usable sin red y subir ventas creadas en caja cuando vuelve la conectividad; exponer conflictos (ej. oversold).

### Non-goals

- No es CRDT genérico multi-master.
- Resolve de conflictos hoy es **metadata** (marca estado); no reescribe filas automáticamente.
- Parked orders / shortcut bindings: **solo locales**.

---

## 2. Backend API

Base: `/api/sync`  
RBAC: `@MinOrgLevel(employee)`  
Throttle: 120/min  
**Sin** `@PlanLevel` (accesible si hay sesión org) — implica que create de sales vía sync **no** pasa por `@PlanLevel('professional')` del controller de sales (gap de gating documentado).

| Método | Ruta | Comportamiento |
|---|---|---|
| `GET` | `/pull?since=` | Delta pull, batch 500; cursor avanza si `!hasMore` |
| `POST` | `/push` | Aplica mutaciones encoladas |
| `GET` | `/conflicts` | Lista pendientes |
| `PATCH` | `/conflicts/:id/resolve` | Set status + `resolvedAt` only |
| `HEAD` | `/health` | 200 |

### Pull entities

`products` (+ stock), `customers`, `exchangeRates`, `exchangeRateDays`, `suppliers`, `companies`, `taxes`, `brands`, `categories`, `cashRegisters`.

### Push rules

- Implementado de verdad: `table === 'sales' && operation === 'create'`.
- Si stock insuficiente vs ventas desde `localTimestamp` → conflicto `oversold` (`SyncConflict` pending); no crea venta.
- Si OK → `SalesService.create(...)` con **payments** mapeados desde el payload Dexie.
- Otras tablas en push: accept no-op (no mutan servidor).

Sale create puede abrir CXC si hay saldo a crédito ([accounts-receivable.md](accounts-receivable.md)).

---

## 3. Frontend Dexie

DB versioned in `frontend/src/lib/sync/db.ts` (v10+). Tables include:

`products`, `customers`, `sales`, `stockCache`, `syncQueue`, `syncMetadata`, `suppliers`, `companies`, `taxes`, `brands`, `categories`, `cashRegisters`, `exchangeRates`, `exchangeRateDays`, `parkedOrders`, `shortcutBindings`.

### Engine

- Leader election via `BroadcastChannel`
- Pull / push loop; retries max 5; backoff ~15–30s
- Started from auth provider when session válida
- On `networkStatus` back online → `forceSync()` (pull + push queued sales)
- Visibility regain → pull + push if tab is leader

### Offline session resume (refresh without network)

If `GET /auth/me` fails with a **network-like** error (not 401/403) and `user` + `currentOrg` exist in localStorage:

1. Keep tokens; restore user + org snapshot.
2. If PIN exists in Dexie → show PIN unlock; otherwise continue soft-offline.
3. Start SyncEngine so the queue can push when connectivity returns.

Do **not** wipe the session on network failure alone — that strands cashiers on `/login` while Dexie still has catalog and pending sales.

---

## 4. Invariants

1. Ventas de caja se crean primero en Dexie + queue; el servidor es eventual.
2. Conflictos oversold no deben crear stock negativo silencioso en server.
3. Pull es por org (tenant context).
4. Resolve no implica “aceptar datos locales” automáticamente — solo status.

---

## 5. UI

- Conflictos: `features/sync` / settings sync conflicts (`minLevel` manager en nav).
- Empty / error states según [patterns.md](../UI-UX/patterns.md).

---

## 6. Definition of Done

- [ ] Pull idempotente por cursor
- [ ] Push sales create + oversold conflict path testeado
- [ ] Multi-tab: un leader
- [ ] Spec actualizada si se añaden tablas al push

---

## 7. Anti-patterns

- No llamar APIs REST de catálogo como única fuente en POS online (rompería parity offline).
- No tratar `resolve` como merge de datos sin implementar merge.
- No encolar updates genéricos esperando que el server los aplique (hoy no-op).
- No documentar sync como “todo el dominio bidireccional”.

---

*Refs: [pos.md](pos.md) · [sales.md](sales.md) · [multi-tenancy.md](../system/multi-tenancy.md)*
