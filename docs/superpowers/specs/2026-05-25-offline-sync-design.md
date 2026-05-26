# Offline-First POS + Data Sync

**Goal:** Keep the app fully functional during network outages, with automatic background sync when connectivity returns. The POS (Point of Sale) module is the primary offline consumer, but the sync infrastructure is reusable by every module.

**Context:** Venezuela — unstable internet. Days of good connectivity followed by days of network issues.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js App)                                       │
│                                                               │
│  ┌──────────┐   ┌──────────┐   ┌───────────────────────────┐ │
│  │ PWA      │   │ Local DB │   │ Sync Engine               │ │
│  │ Service  │──▶│(Dexie.js)│   │ ┌────────┐ ┌───────────┐  │ │
│  │ Worker   │   │          │   │ │ Queue  │ │ Network   │  │ │
│  │          │   │ products │   │ │ Manager│ │ Detector  │  │ │
│  │ Cache    │   │ customers│   │ └────────┘ └───────────┘  │ │
│  │ GET /api │   │ sales    │   │ ┌────────┐ ┌───────────┐  │ │
│  │ Static   │   │ queue    │   │ │ Puller │ │ Pusher    │  │ │
│  │ Assets   │   │ stock    │   │ └────────┘ └───────────┘  │ │
│  └──────────┘   └──────────┘   └───────────────────────────┘ │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │ fetch (online) / IndexedDB (offline)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Proxy (rewrites /api/* → localhost:4000)            │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  NestJS Backend                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────────────┐ │
│  │ Sync     │   │ Sales    │   │ Existing Modules         │ │
│  │ Module   │   │ Module   │   │ (Products, Customers...) │ │
│  │          │   │          │   │                          │ │
│  │ /pull    │   │ CRUD     │   │ All expose updatedAt     │ │
│  │ /push    │   │ Conflict │   │ for incremental sync     │ │
│  │ /conflict│   │ Review   │   │                          │ │
│  └──────────┘   └──────────┘   └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Four architectural layers

| Layer | Technology | Role |
|-------|-----------|------|
| **Service Worker** | `@serwist/next` | Cache GET responses, enable installable PWA, offline fallback |
| **Local DB** | IndexedDB via Dexie.js | Full offline data store — products, customers, sales queue, stock cache |
| **Sync Engine** | Custom JS class | Orchestrates push/pull, queue management, conflict detection, auto-sync interval |
| **Backend Sync API** | NestJS + Prisma | Processes mutation batches, detects conflicts, returns incremental changes |

### Design principles

1. **Model-agnostic infrastructure** — The sync layer works for any table. Modules register themselves with ~2-3 lines of config each.
2. **No circular dependencies** — Sync engine imports queue + db. Queue imports db. Hooks import engine. Events flow one way.
3. **Observer pattern for UI** — Engine emits events (`sync-start`, `sync-complete`, `sync-error`, `conflict-detected`). UI subscribes via hooks.
4. **Queue pattern for mutations** — Mutations enqueued synchronously, processed in batches asynchronously.
5. **Full offline operation** — POS creates sales, decrements stock, looks up products/customers without any network call.

---

## 1. Local Data Model (IndexedDB via Dexie.js)

### Stores

Stored client-side per terminal, scoped to the current organization.

| Store | Indexes | Contents | Sync direction |
|-------|---------|----------|---------------|
| **products** | `id`, `updatedAt`, `name` | All products with prices, tax info | Pull from server |
| **customers** | `id`, `updatedAt`, `taxId` | All customers | Bidirectional |
| **syncQueue** | `localTimestamp`, `status` | Pending mutations `{ operation, table, recordId, data, stockSnapshot, localTimestamp, retryCount, status }` | Push only |
| **stockCache** | `productId` | Last known stock `{ productId, quantity, lastUpdated }` | Pull + local decrement |
| **sales** | `id`, `syncedAt` | Completed sales pending sync | Push only |
| **syncMetadata** | `key` | `{ lastPullAt, lastPushAt, lastSyncStatus }` | Local only |

### Schema definition (`db.ts`)

```ts
// frontend/src/lib/sync/db.ts
import Dexie, { type EntityTable } from 'dexie';

interface LocalProduct {
  id: number; organizationId: number;
  name: string; price: number; priceUsd?: number;
  stock: number; taxId?: number;
  updatedAt: string;
}

interface LocalCustomer {
  id: number; organizationId: number;
  firstName: string; lastName: string;
  taxId?: string; phone?: string;
  updatedAt: string;
}

interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId?: number;
  data: unknown;
  stockSnapshot?: Record<number, number>;
  localTimestamp: string;
  retryCount: number;
  status: 'pending' | 'in-flight' | 'failed';
}

interface StockCacheItem {
  productId: number;
  quantity: number;
  lastUpdated: string;
}

interface LocalSale {
  id?: number;
  localId: string;
  data: unknown;
  syncedAt?: string;
  createdAt: string;
}

export const localDb = new Dexie('GLAdmin') as Dexie & {
  products: EntityTable<LocalProduct, 'id'>;
  customers: EntityTable<LocalCustomer, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  stockCache: EntityTable<StockCacheItem, 'productId'>;
  sales: EntityTable<LocalSale, 'id'>;
  syncMetadata: EntityTable<{ key: string; value: string }, 'key'>;
};

localDb.version(1).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
});
```

### Adding new tables

Every module adds a new store to `db.ts` and a `findMany` to the backend pull query. No other changes needed.

---

## 2. Sync Engine

### File structure

```
frontend/src/lib/sync/
  db.ts                       — Dexie instance + schema
  sync-engine.ts              — Orchestrator (pull, push, interval, events)
  sync-queue.ts               — Queue manager (enqueue, dequeue, retry)
  conflict-resolver.ts         — Formats conflicts for manager review
  network-status.ts            — Online/offline detection
  types.ts                     — Shared types
  hooks/
    use-offline.ts             — isOnline, pendingCount, lastSyncAt, forceSync
    use-sync-status.ts         — sync indicator state
```

### `network-status.ts`

Wraps `navigator.onLine` + periodic backend ping (`HEAD /api/sync/health`) every 30 seconds.

```ts
type NetworkListener = (online: boolean) => void;

class NetworkStatus {
  private listeners: Set<NetworkListener> = new Set();
  private pingInterval?: ReturnType<typeof setInterval>;
  private _online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  get isOnline() { return this._online; }

  onStatusChange(listener: NetworkListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setOnline(online: boolean) {
    if (this._online === online) return;
    this._online = online;
    this.listeners.forEach(fn => fn(online));
  }

  start() {
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
    this.pingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync/health', { method: 'HEAD' });
        this.setOnline(res.ok);
      } catch { this.setOnline(false); }
    }, 30_000);
  }

  stop() { clearInterval(this.pingInterval); }
}

export const networkStatus = new NetworkStatus();
```

### `sync-queue.ts`

```ts
class SyncQueue {
  async enqueue(mutation: Omit<SyncQueueItem, 'id' | 'retryCount' | 'status'>): Promise<number> {
    const id = await localDb.syncQueue.add({
      ...mutation,
      retryCount: 0,
      status: 'pending',
    });
    syncEngine.triggerPush();
    return id;
  }

  async getPending(): Promise<SyncQueueItem[]> {
    return localDb.syncQueue
      .where('status').equals('pending')
      .sortBy('localTimestamp');
  }

  async getFailed(): Promise<SyncQueueItem[]> {
    return localDb.syncQueue
      .where('status').equals('failed')
      .sortBy('localTimestamp');
  }

  async markComplete(id: number) { await localDb.syncQueue.delete(id); }

  async markFailed(id: number) {
    await localDb.syncQueue.update(id, { status: 'failed' });
  }

  async incrementRetry(id: number, retryCount: number) {
    await localDb.syncQueue.update(id, { retryCount });
  }

  async count(): Promise<number> {
    return localDb.syncQueue.where('status').equals('pending').count();
  }
}
```

### `sync-engine.ts`

```ts
type SyncEvent = 'sync-start' | 'sync-complete' | 'sync-error' | 'conflict-detected';
type SyncListener = (payload?: unknown) => void;

class SyncEngine {
  private events: Map<SyncEvent, Set<SyncListener>> = new Map();
  private pullInterval?: ReturnType<typeof setInterval>;
  private pushInFlight = false;
  private pullInFlight = false;
  private _lastSyncAt?: string;

  get lastSyncAt() { return this._lastSyncAt; }

  on(event: SyncEvent, listener: SyncListener) { /* register */ }
  private emit(event: SyncEvent, payload?: unknown) { /* notify */ }

  async pull(): Promise<void> { /* fetch incremental updates from server */ }
  async push(): Promise<void> { /* process pending queue */ }
  triggerPush(): void { /* debounced push call */ }

  start() { /* periodic pull + push every 30s, network listener */ }
  stop() { /* clear intervals */ }

  async forceSync(): Promise<void> { /* immediate pull + push */ }
}
```

### Sync flow details

**Pull (server → client):**
- Periodic background sync every 30s when online
- Immediate pull on app focus (Page Visibility API)
- `GET /sync/pull?since={lastPullAt}` returns all records updated after that timestamp
- Client merges into local DB — last-write-wins by `updatedAt`
- Updates `lastPullAt` in `syncMetadata`

**Push (client → server):**
- Triggered immediately when a mutation is enqueued (debounced 2s)
- Batches pending mutations ordered by `localTimestamp`
- Sends `POST /sync/push` with the batch
- Server processes sequentially:
  1. Validates record structure
  2. For sales: checks stock snapshot against current server stock
  3. If stock OK or not a sale: applies mutation, returns `{ accepted: [ids] }`
  4. If oversold: returns `{ conflicts: [{ localTimestamp, recordId, issue: 'oversold' }] }`
- Accepted mutations are removed from the queue
- Conflicts are flagged — mutation stays in queue with `status: 'failed'`
- Failed mutations retry with exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s, 60s max
- After 7 retries: stays as `failed` for manual review

**Conflict detection (sales):**
```ts
// Server-side during push
const sale = mutation.data;
for (const item of sale.items) {
  const currentStock = await getServerStock(item.productId);
  const salesSince = await getSalesAfter(mutation.localTimestamp, item.productId);
  const consumedSince = salesSince.reduce((sum, s) => sum + s.quantity, 0);
  const available = currentStock - consumedSince;
  if (available < item.quantity) {
    return { conflict: true, productId: item.productId, available, requested: item.quantity };
  }
}
```

---

## 3. Backend Sync API

### Module structure

```
backend/src/modules/sync/
  sync.module.ts
  sync.controller.ts
  sync.service.ts
  dto/
    push-mutation.dto.ts
    resolve-conflict.dto.ts
```

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/sync/pull?since=ISO` | GET | JWT | Returns all records updated after timestamp. Combines products, customers, exchange rates. |
| `/sync/push` | POST | JWT | Accepts mutation batch, processes in order, returns accepted/conflicts/errors |
| `/sync/conflicts` | GET | JWT + Manager | Lists unresolved conflicts for the org |
| `/sync/conflicts/:id/resolve` | PATCH | JWT + Manager | Resolve conflict: server, local, or manual |
| `/sync/health` | HEAD | Public | Returns 200 — used by frontend connectivity ping |

### New Prisma models

```prisma
// Add to schema.prisma

model SyncCursor {
  id              Int      @id @default(autoincrement())
  organizationId  Int      @unique
  lastPullAt      DateTime
  lastPushAt      DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SyncConflict {
  id              Int      @id @default(autoincrement())
  organizationId  Int
  table           String
  recordId        Int?
  localData       String   // JSON of the offline mutation data
  serverData      String   // JSON of current server state at detection time
  localTimestamp  DateTime
  description     String   // e.g. "Oversold product X: requested 5, available 2"
  status          String   @default("pending") // pending | resolved_server | resolved_local | manual
  resolvedBy      Int?
  resolvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id])
}
```

### Pull response format

```json
{
  "data": {
    "products": [{ "id": 1, "name": "...", "updatedAt": "..." }],
    "customers": [{ "id": 1, "firstName": "...", "updatedAt": "..." }],
    "exchangeRates": [{ "id": 1, "rate": 50.5, "updatedAt": "..." }],
    "cursor": { "lastPullAt": "2026-05-25T12:00:00Z" }
  }
}
```

### Extending pull for new modules

Add a new key to the pull response and a new `findMany({ where: { updatedAt: { gt: since }, organizationId } })` in the service. No other changes.

---

## 4. POS Module

### Frontend: `frontend/src/features/pos/`

| File | Purpose |
|------|---------|
| `pos-page.tsx` | Main POS interface — product grid + cart + totals |
| `components/product-grid.tsx` | Touch-friendly grid, search, category filter. Reads from `localDb.products` when offline, fetches from API when online + refreshes cache |
| `components/cart.tsx` | Cart panel — items, quantities, remove, subtotals in VED + USD |
| `components/payment-modal.tsx` | Payment selection: cash, Pago Movil (queued for later review), transfer |
| `hooks/use-pos.ts` | Core POS logic — add/remove items, calculate totals, dual-currency display |
| `hooks/use-offline-sale.ts` | Enqueues sale to local DB + sync queue, decrements `stockCache` |

### Backend: `backend/src/modules/sales/`

Full CRUD module for sales and sale details. Reuses the existing `Sale` and `SalesDet` models.

| Endpoint | Purpose |
|----------|---------|
| `GET /sales` | List sales (org-scoped) |
| `GET /sales/:id` | Sale detail with items |
| `POST /sales` | Create sale (used for realtime + by sync push) |
| `PATCH /sales/:id` | Update sale (void, modify) |
| `GET /products?includeStock=true` | Products with current stock |

### Offline-first sale flow

1. Cashier opens POS — products load from local cache (no loading spinner)
2. Searches products by name — filtered from `localDb.products` instantly
3. Selects customer — from `localDb.customers`
4. Adds items to cart — quantity decrements from `localDb.stockCache` immediately
5. Completes sale — saved to `localDb.sales` + `syncQueue.enqueue()`:
   ```ts
   await syncQueue.enqueue({
     operation: 'create',
     table: 'sales',
     data: saleData,
     stockSnapshot: Object.fromEntries(cartItems.map(i => [i.productId, stockCache[i.productId].quantity])),
     localTimestamp: new Date().toISOString(),
   });
   ```
6. UI shows sale as complete instantly
7. Sync engine pushes when online
8. Server validates stock via snapshot → applies or flags as conflict

---

## 5. PWA Setup

Using `@serwist/next` (App Router compatible, maintained fork of `next-pwa`):

```bash
pnpm add @serwist/next @serwist/sw
```

**`frontend/sw.ts`** — Service worker entry:
```ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: { entries: [{ url: '/offline', matcher: ({ request }) => !request.url.includes('/api/') }] },
});
serwist.addEventListeners();
```

**`frontend/next.config.mjs`**:
```js
import withSerwist from '@serwist/next';

const nextConfig = { /* existing rewrites */ };

export default withSerwist({ swSrc: 'sw.ts', swDest: 'public/sw.js' })(nextConfig);
```

**`frontend/src/app/manifest.ts`** — PWA manifest:
```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GLAdmin POS',
    short_name: 'GLAdmin',
    description: 'Inventory and Point of Sale system',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e3a5f',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  };
}
```

---

## 6. Sync Status UI

A sync indicator component rendered in the dashboard layout (sidebar footer or top bar):

```tsx
// frontend/src/components/sync-indicator.tsx
function SyncIndicator() {
  const { isOnline, pendingCount, lastSyncAt, syncStatus } = useSyncStatus();

  if (!isOnline) return <Badge variant="destructive">Offline</Badge>;
  if (syncStatus === 'syncing') return <Badge variant="secondary">Syncing...</Badge>;
  if (pendingCount > 0) return <Badge>{pendingCount} pending</Badge>;
  if (syncStatus === 'conflict') return <Badge variant="warning">Conflicts</Badge>;
  return <Badge variant="outline">Synced</Badge>;
}
```

The `SyncIndicator` also shows a clickable toast when conflicts are detected, linking to the conflict resolution page.

---

## 7. Conflict Resolution UI

Route: `app/(dashboard)/settings/sync/conflicts/page.tsx`

DataTable showing: id, table type, description ("Oversold Product X"), local timestamp, status. Actions: resolve (accept server, accept local, manual override). Only accessible to managers.

---

## Implementation Plan (7 phases)

### Phase 1: Foundation
- Install `dexie`, `@serwist/next`, `@serwist/sw`
- Create `frontend/src/lib/sync/db.ts` with all stores
- Create `frontend/src/lib/sync/network-status.ts`
- Create `frontend/src/lib/sync/types.ts`
- Create `frontend/src/lib/sync/sync-queue.ts`

### Phase 2: Backend Sync Module
- Add `SyncCursor` + `SyncConflict` to Prisma schema
- Create `backend/src/modules/sync/` with controller, service, DTOs
- Implement pull endpoint (combine products, customers, exchange rates)
- Wire into existing models: all business models expose `updatedAt` for incremental filtering
- Run `prisma db push` + seed

### Phase 3: Sync Engine
- Create `frontend/src/lib/sync/sync-engine.ts` with pull + push + events
- Create `frontend/src/lib/sync/conflict-resolver.ts`
- Implement multi-tab coordination via `BroadcastChannel`
- Add `beforeunload` warning when queue has pending mutations
- Integration test: engine pulls from API, pushes mutations, handles responses

### Phase 4: POS Backend
- Create `backend/src/modules/sales/` — full CRUD for Sale + SalesDet
- Wire sales into sync push handler (stock validation, conflict detection)
- Add `GET /products?includeStock=true` endpoint

### Phase 5: POS Frontend
- Create `frontend/src/features/pos/` — page, grid, cart, payment modal
- Create `use-pos.ts` and `use-offline-sale.ts`
- Product search reads from local DB, falls back to API
- Denormalize product data into sale (embed name, price, priceUsd at time of sale)

### Phase 6: PWA + Hooks
- Configure `@serwist/next`
- Create `sw.ts`, `manifest.ts`
- Create `use-offline.ts` + `use-sync-status.ts`
- Create `SyncIndicator` component, add to dashboard layout
- Create conflict resolution page

### Phase 7: Cross-Module Reuse
- Add remaining business models (suppliers, companies, taxes, etc.) to sync pull
- Each: register store in `db.ts` + add `findMany` to pull endpoint
- Verify each module reads from local cache when offline
- Handle org switch: clear local stores, full re-pull

---

## 8. Offline Authentication

### Session persistence

- **First login requires network** — credentials must be validated server-side
- **Subsequent visits work offline** — JWT stored in localStorage persisted across sessions. The app loads from the cached token without a network call
- **Token expiry** — when the JWT expires and the device is offline, the app continues working with the cached token (grace period). On next online sync, if the token is expired, a refresh is attempted. If that fails, the user is redirected to the PIN screen
- **Logout** — clears local IndexedDB (all stores), localStorage tokens, PIN hash, and redirects to login

### Offline PIN (for extended outages)

When the JWT expires during a multi-day outage, the user can't re-authenticate. A device PIN solves this:

1. **First online login** — after successful credential validation, the app prompts the user to set a 4-6 digit PIN
2. **PIN storage** — a SHA-256 hash of the PIN is stored in IndexedDB (`syncMetadata` store), associated with the user ID:
   ```ts
   const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
   await localDb.syncMetadata.put({ key: `pin_${userId}`, value: bytesToHex(hash) });
   ```
3. **Offline unlock** — when the JWT is expired and the device is offline, the user sees a PIN screen instead of a login form. They enter the PIN, the app hashes it and compares to the stored hash. On match, the app works normally (all local operations permitted)
4. **Token refresh** — on the next online sync cycle, the expired JWT triggers a refresh. If the refresh succeeds, the app is back to fully authenticated state. If the refresh fails (revoked token), the PIN becomes invalid and the user must log in online
5. **Password change** — when the password is changed online, the server should invalidate old refresh tokens. The next sync will fail to refresh, and the app clears the PIN hash, forcing the user to log in online again

**Security considerations:**
- PIN is never sent to the server — verified entirely client-side
- No raw password is stored on the device, only a JWT (time-limited) and a PIN hash
- SHA-256 is used over bcrypt because the hash is computed in the browser where bcrypt is slow and blocking; the PIN is low-entropy anyway (4-6 digits), so the preimage resistance of SHA-256 is adequate for this threat model
- The PIN only authorizes offline operations — sensitive actions (admin panel, payment config) still require the server JWT role to be valid
- On device theft, the PIN adds a layer of protection, but the primary defense is that the server can revoke all refresh tokens for that user

---

## 9. Multi-Tab Coordination

When the same user opens the app in multiple browser tabs, IndexedDB is shared and sync could fire from both tabs simultaneously.

**Solution:** Use `BroadcastChannel` API to elect a "sync leader" tab:

1. On app start, each tab joins the `gladmin-sync` channel
2. The first tab to connect becomes the sync leader
3. Only the leader performs pull/push cycles
4. When the leader tab closes, another tab takes over (within 5 seconds)
5. Mutations enqueued by non-leader tabs are processed by the leader on the next push cycle

This prevents duplicate API calls and race conditions during push.

---

## 10. Org Switch Handling

When the user switches organizations:

1. `beforeSync` event fires to push all pending mutations for the current org first
2. All IndexedDB stores are cleared (all data is org-scoped)
3. A fresh full pull (no `since` timestamp) is triggered for the new org
4. `lastPullAt` resets to the current time
5. UI shows a loading state until the first pull completes

---

## 11. Cross-Module Conflict Rules

| Operation | Conflict detection | Resolution |
|-----------|-------------------|------------|
| **Create sale** | Stock snapshot vs current server stock | Flag for manager review |
| **Create product** | Duplicate name/ID | Server version wins, local flagged |
| **Update product** | None — last-write-wins by `localTimestamp` | Server applies latest |
| **Create customer** | Duplicate email/taxId | Server version wins, local flagged |
| **Update customer** | None — last-write-wins by `localTimestamp` | Server applies latest |
| **Delete record** | Record referenced by another entity | Fail gracefully, flag for review |

**Denormalization for resilience:** Sales embed the product data (name, price at time of sale) rather than relying on foreign key relationships. This way, even if a product is later deleted or renamed, the historical sale record remains accurate.

---

## Key Decisions

- **Option 1 — Decrement local stock + reconcile on sync** (chosen): Full offline operation. Overselling is rare and handled via conflict flags + manager review.
- **`@serwist/next` over `next-pwa`**: `next-pwa` is unmaintained. Serwist is the active fork with App Router support.
- **Dexie.js over raw IndexedDB**: Clean typed API, reactive queries, simpler code.
- **Incremental pull over full dump**: `since` timestamp reduces bandwidth. First pull has no timestamp and fetches everything.
- **FIFO mutation processing**: Server applies mutations in `localTimestamp` order. No vector clocks or CRDTs — simpler and sufficient for this use case.
- **Stock snapshot per sale**: Server compares the stock at sale time (offline) vs current server state to detect conflicts accurately.
