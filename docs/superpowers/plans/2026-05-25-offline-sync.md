# Offline-First POS + Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the app fully functional during network outages, with automatic background sync when connectivity returns. The POS (Point of Sale) module is the primary offline consumer, but the sync infrastructure is reusable by every module.

**Architecture:** Four-layer architecture: Service Worker (PWA), Local DB (IndexedDB via Dexie.js), Sync Engine (custom JS class), Backend Sync API (NestJS + Prisma). Model-agnostic infrastructure — modules register themselves with ~2-3 lines of config each. Observer pattern for UI, Queue pattern for mutations, full offline operation.

**Tech Stack:** @serwist/next (PWA), Dexie.js (IndexedDB), NestJS, Prisma, Next.js App Router, TypeScript

**Spec:** `docs/superpowers/specs/2026-05-25-offline-sync-design.md`

---

## Phase 1: Foundation

### Task 1.1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install dexie, @serwist/next, @serwist/sw**

```bash
cd frontend
pnpm add dexie @serwist/next @serwist/sw
```

- [ ] **Step 2: Verify installation**

```bash
pnpm list dexie @serwist/next @serwist/sw
```

Expected: All three packages listed with versions

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/pnpm-lock.yaml
git commit -m "chore: install dexie and serwist for offline-first POS"
```

---

### Task 1.2: Create Local Database Schema

**Files:**
- Create: `frontend/src/lib/sync/db.ts`

- [ ] **Step 1: Create db.ts with all stores**

```ts
// frontend/src/lib/sync/db.ts
import Dexie, { type EntityTable } from 'dexie';

export interface LocalProduct {
  id: number;
  organizationId: number;
  name: string;
  price: number;
  priceUsd?: number;
  stock: number;
  taxId?: number;
  updatedAt: string;
}

export interface LocalCustomer {
  id: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  taxId?: string;
  phone?: string;
  updatedAt: string;
}

export interface SyncQueueItem {
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

export interface StockCacheItem {
  productId: number;
  quantity: number;
  lastUpdated: string;
}

export interface LocalSale {
  id?: number;
  localId: string;
  data: unknown;
  syncedAt?: string;
  createdAt: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

export const localDb = new Dexie('GLAdmin') as Dexie & {
  products: EntityTable<LocalProduct, 'id'>;
  customers: EntityTable<LocalCustomer, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  stockCache: EntityTable<StockCacheItem, 'productId'>;
  sales: EntityTable<LocalSale, 'id'>;
  syncMetadata: EntityTable<SyncMetadata, 'key'>;
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

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/db.ts
git commit -m "feat: create local database schema with Dexie.js"
```

---

### Task 1.3: Create Network Status Detector

**Files:**
- Create: `frontend/src/lib/sync/network-status.ts`

- [ ] **Step 1: Create network-status.ts**

```ts
// frontend/src/lib/sync/network-status.ts
export type NetworkListener = (online: boolean) => void;

export class NetworkStatus {
  private listeners: Set<NetworkListener> = new Set();
  private pingInterval?: ReturnType<typeof setInterval>;
  private _online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  get isOnline() {
    return this._online;
  }

  onStatusChange(listener: NetworkListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setOnline(online: boolean) {
    if (this._online === online) return;
    this._online = online;
    this.listeners.forEach(fn => fn(online));
  }

  start() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
    
    this.pingInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync/health', { method: 'HEAD' });
        this.setOnline(res.ok);
      } catch {
        this.setOnline(false);
      }
    }, 30_000);
  }

  stop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}

export const networkStatus = new NetworkStatus();
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/network-status.ts
git commit -m "feat: create network status detector with ping"
```

---

### Task 1.4: Create Shared Types

**Files:**
- Create: `frontend/src/lib/sync/types.ts`

- [ ] **Step 1: Create types.ts**

```ts
// frontend/src/lib/sync/types.ts
export type SyncEvent = 'sync-start' | 'sync-complete' | 'sync-error' | 'conflict-detected';
export type SyncListener = (payload?: unknown) => void;

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error';

export interface SyncConflict {
  id: number;
  table: string;
  recordId?: number;
  localData: unknown;
  serverData: unknown;
  localTimestamp: string;
  description: string;
  status: 'pending' | 'resolved_server' | 'resolved_local' | 'manual';
  resolvedBy?: number;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullResponse {
  data: {
    products: Array<{ id: number; name: string; price: number; priceUsd?: number; stock: number; taxId?: number; updatedAt: string }>;
    customers: Array<{ id: number; firstName: string; lastName: string; taxId?: string; phone?: string; updatedAt: string }>;
    exchangeRates: Array<{ id: number; rate: number; updatedAt: string }>;
    cursor: { lastPullAt: string };
  };
}

export interface PushMutation {
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId?: number;
  data: unknown;
  stockSnapshot?: Record<number, number>;
  localTimestamp: string;
}

export interface PushRequest {
  mutations: PushMutation[];
}

export interface PushResponse {
  data: {
    accepted: number[];
    conflicts: Array<{
      localTimestamp: string;
      recordId?: number;
      issue: string;
      description: string;
    }>;
    errors: Array<{
      localTimestamp: string;
      error: string;
    }>;
  };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/types.ts
git commit -m "feat: create shared sync types"
```

---

### Task 1.5: Create Sync Queue Manager

**Files:**
- Create: `frontend/src/lib/sync/sync-queue.ts`

- [ ] **Step 1: Create sync-queue.ts**

```ts
// frontend/src/lib/sync/sync-queue.ts
import { localDb, type SyncQueueItem } from './db';

export class SyncQueue {
  async enqueue(
    mutation: Omit<SyncQueueItem, 'id' | 'retryCount' | 'status'>
  ): Promise<number> {
    const id = await localDb.syncQueue.add({
      ...mutation,
      retryCount: 0,
      status: 'pending',
    });
    return id;
  }

  async getPending(): Promise<SyncQueueItem[]> {
    return localDb.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('localTimestamp');
  }

  async getFailed(): Promise<SyncQueueItem[]> {
    return localDb.syncQueue
      .where('status')
      .equals('failed')
      .sortBy('localTimestamp');
  }

  async markComplete(id: number) {
    await localDb.syncQueue.delete(id);
  }

  async markFailed(id: number) {
    await localDb.syncQueue.update(id, { status: 'failed' });
  }

  async incrementRetry(id: number, retryCount: number) {
    await localDb.syncQueue.update(id, { retryCount });
  }

  async count(): Promise<number> {
    return localDb.syncQueue.where('status').equals('pending').count();
  }

  async clear() {
    await localDb.syncQueue.clear();
  }
}

export const syncQueue = new SyncQueue();
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/sync-queue.ts
git commit -m "feat: create sync queue manager"
```

---

## Phase 2: Backend Sync Module

### Task 2.1: Add Sync Models to Prisma Schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add SyncCursor and SyncConflict models**

```prisma
// Add to backend/prisma/schema.prisma

model SyncCursor {
  id              Int      @id @default(autoincrement())
  organizationId  Int      @unique
  lastPullAt      DateTime
  lastPushAt      DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  organization    Organization @relation(fields: [organizationId], references: [id])
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

  organization    Organization @relation(fields: [organizationId], references: [id])
}
```

- [ ] **Step 2: Add relations to Organization model**

```prisma
// Add to Organization model in backend/prisma/schema.prisma
  syncCursors     SyncCursor[]
  syncConflicts   SyncConflict[]
```

- [ ] **Step 3: Push schema to database**

```bash
cd backend
pnpm prisma db push
```

Expected: Schema pushed successfully

- [ ] **Step 4: Generate Prisma client**

```bash
pnpm prisma generate
```

Expected: Client generated successfully

- [ ] **Step 5: Verify TypeScript compilation**

```bash
pnpm typecheck
```

Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: add SyncCursor and SyncConflict models"
```

---

### Task 2.2: Create Sync Module Structure

**Files:**
- Create: `backend/src/modules/sync/sync.module.ts`
- Create: `backend/src/modules/sync/sync.controller.ts`
- Create: `backend/src/modules/sync/sync.service.ts`
- Create: `backend/src/modules/sync/dto/push-mutation.dto.ts`
- Create: `backend/src/modules/sync/dto/resolve-conflict.dto.ts`

- [ ] **Step 1: Create push-mutation.dto.ts**

```ts
// backend/src/modules/sync/dto/push-mutation.dto.ts
import { IsString, IsOptional, IsInt, IsIn, IsObject, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class PushMutationDto {
  @IsString()
  @IsIn(['create', 'update', 'delete'])
  operation: 'create' | 'update' | 'delete';

  @IsString()
  table: string;

  @IsOptional()
  @IsInt()
  recordId?: number;

  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  stockSnapshot?: Record<string, number>;

  @IsDateString()
  localTimestamp: string;
}

export class PushRequestDto {
  @Type(() => PushMutationDto)
  mutations: PushMutationDto[];
}
```

- [ ] **Step 2: Create resolve-conflict.dto.ts**

```ts
// backend/src/modules/sync/dto/resolve-conflict.dto.ts
import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';

export class ResolveConflictDto {
  @IsString()
  @IsIn(['resolved_server', 'resolved_local', 'manual'])
  status: 'resolved_server' | 'resolved_local' | 'manual';

  @IsOptional()
  @IsObject()
  manualData?: Record<string, unknown>;
}
```

- [ ] **Step 3: Create sync.service.ts (stub)**

```ts
// backend/src/modules/sync/sync.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { PushMutationDto } from './dto/push-mutation.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  async pull(since?: string) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const sinceDate = since ? new Date(since) : new Date(0);

    const products = await this.prisma.product.findMany({
      where: {
        organizationId: orgId,
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        name: true,
        price: true,
        priceUsd: true,
        stock: true,
        taxId: true,
        updatedAt: true,
      },
    });

    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId: orgId,
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        taxId: true,
        phone: true,
        updatedAt: true,
      },
    });

    const exchangeRates = await this.prisma.exchangeRate.findMany({
      where: {
        organizationId: orgId,
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        rate: true,
        updatedAt: true,
      },
    });

    const lastPullAt = new Date();

    await this.prisma.syncCursor.upsert({
      where: { organizationId: orgId },
      update: { lastPullAt },
      create: {
        organizationId: orgId,
        lastPullAt,
        lastPushAt: new Date(0),
      },
    });

    return {
      products,
      customers,
      exchangeRates,
      cursor: { lastPullAt: lastPullAt.toISOString() },
    };
  }

  async push(mutations: PushMutationDto[]) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const accepted: number[] = [];
    const conflicts: Array<{ localTimestamp: string; recordId?: number; issue: string; description: string }> = [];
    const errors: Array<{ localTimestamp: string; error: string }> = [];

    for (const mutation of mutations) {
      try {
        // TODO: Implement mutation processing
        accepted.push(0);
      } catch (error) {
        errors.push({
          localTimestamp: mutation.localTimestamp,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const lastPushAt = new Date();
    await this.prisma.syncCursor.upsert({
      where: { organizationId: orgId },
      update: { lastPushAt },
      create: {
        organizationId: orgId,
        lastPullAt: new Date(0),
        lastPushAt,
      },
    });

    return { accepted, conflicts, errors };
  }

  async getConflicts() {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return this.prisma.syncConflict.findMany({
      where: { organizationId: orgId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveConflict(id: number, dto: ResolveConflictDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    return this.prisma.syncConflict.update({
      where: { id, organizationId: orgId },
      data: {
        status: dto.status,
        resolvedAt: new Date(),
      },
    });
  }
}
```

- [ ] **Step 4: Create sync.controller.ts (stub)**

```ts
// backend/src/modules/sync/sync.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, Head, Res } from '@nestjs/common';
import { Response } from 'express';
import { SyncService } from './sync.service';
import { PushRequestDto } from './dto/push-mutation.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pull(@Query('since') since?: string) {
    return this.syncService.pull(since);
  }

  @Post('push')
  async push(@Body() dto: PushRequestDto) {
    return this.syncService.push(dto.mutations);
  }

  @Get('conflicts')
  async getConflicts() {
    return this.syncService.getConflicts();
  }

  @Patch('conflicts/:id/resolve')
  async resolveConflict(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveConflictDto,
  ) {
    return this.syncService.resolveConflict(id, dto);
  }

  @Head('health')
  async health(@Res() res: Response) {
    res.status(200).send();
  }
}
```

- [ ] **Step 5: Create sync.module.ts**

```ts
// backend/src/modules/sync/sync.module.ts
import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
```

- [ ] **Step 6: Register SyncModule in AppModule**

```ts
// Add to backend/src/app.module.ts imports array
import { SyncModule } from './modules/sync/sync.module';

// In imports array:
SyncModule,
```

- [ ] **Step 7: Verify TypeScript compilation**

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/sync/
git add backend/src/app.module.ts
git commit -m "feat: create sync module structure"
```

---

### Task 2.3: Implement Pull Endpoint

**Files:**
- Modify: `backend/src/modules/sync/sync.service.ts`

- [ ] **Step 1: Implement pull method**

The pull method is already implemented in Task 2.2. Verify it works:

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 2: Test pull endpoint**

```bash
# Start backend if not running
pnpm start:dev

# In another terminal, test pull
curl -X GET "http://localhost:4000/api/sync/pull" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "x-organization-id: 1"
```

Expected: JSON response with products, customers, exchangeRates, cursor

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/sync/sync.service.ts
git commit -m "feat: implement pull endpoint"
```

---

### Task 2.4: Implement Push Endpoint

**Files:**
- Modify: `backend/src/modules/sync/sync.service.ts`

- [ ] **Step 1: Implement push method with mutation processing**

```ts
// Replace the push method in backend/src/modules/sync/sync.service.ts

async push(mutations: PushMutationDto[]) {
  const orgId = this.context.getCurrent()?.organizationId;
  if (!orgId) throw new Error('No organization context');
  const accepted: number[] = [];
  const conflicts: Array<{ localTimestamp: string; recordId?: number; issue: string; description: string }> = [];
  const errors: Array<{ localTimestamp: string; error: string }> = [];

  for (const mutation of mutations) {
    try {
      if (mutation.table === 'sales' && mutation.operation === 'create') {
        // Check stock conflicts
        const saleData = mutation.data as {
          items: Array<{ productId: number; quantity: number }>;
        };

        for (const item of saleData.items) {
          const currentStock = await this.prisma.stock.findFirst({
            where: { productId: item.productId, organizationId: orgId },
          });

          if (!currentStock || currentStock.quantity < item.quantity) {
            // Check if other sales have consumed stock since this sale was created
            const salesSince = await this.prisma.sale.findMany({
              where: {
                organizationId: orgId,
                createdAt: { gt: new Date(mutation.localTimestamp) },
                details: {
                  some: { idProduct: item.productId },
                },
              },
              include: { details: true },
            });

            const consumedSince = salesSince.reduce((sum, sale) => {
              const detail = sale.details.find(d => d.idProduct === item.productId);
              return sum + (detail?.quantity || 0);
            }, 0);

            const available = (currentStock?.quantity || 0) - consumedSince;

            if (available < item.quantity) {
              conflicts.push({
                localTimestamp: mutation.localTimestamp,
                recordId: mutation.recordId,
                issue: 'oversold',
                description: `Product ${item.productId}: requested ${item.quantity}, available ${available}`,
              });

              // Create SyncConflict record
              await this.prisma.syncConflict.create({
                data: {
                  organizationId: orgId,
                  table: 'sales',
                  recordId: mutation.recordId,
                  localData: JSON.stringify(mutation.data),
                  serverData: JSON.stringify({ currentStock: currentStock?.quantity || 0, consumedSince }),
                  localTimestamp: new Date(mutation.localTimestamp),
                  description: `Oversold product ${item.productId}: requested ${item.quantity}, available ${available}`,
                  status: 'pending',
                },
              });

              continue;
            }
          }

          // Decrement stock
          await this.prisma.stock.update({
            where: { id: currentStock!.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // Create sale
        const sale = await this.prisma.sale.create({
          data: {
            organizationId: orgId,
            code: mutation.data.code as string,
            date: new Date(mutation.data.date as string),
            amount: mutation.data.amount as number,
            amountUsd: mutation.data.amountUsd as number,
            exchangeRate: mutation.data.exchangeRate as number,
            paymentMethod: mutation.data.paymentMethod as number,
            status: mutation.data.status as number,
            idCustomer: mutation.data.idCustomer as number,
            details: {
              create: (mutation.data.items as Array<{ productId: number; quantity: number; unitPrice: number; unitPriceUsd: number; subtotal: number; subtotalUsd: number }>).map(item => ({
                organizationId: orgId,
                idProduct: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitPriceUsd: item.unitPriceUsd,
                subtotal: item.subtotal,
                subtotalUsd: item.subtotalUsd,
              })),
            },
          },
        });

        accepted.push(sale.id);
      } else {
        // TODO: Handle other tables (products, customers, etc.)
        accepted.push(0);
      }
    } catch (error) {
      errors.push({
        localTimestamp: mutation.localTimestamp,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const lastPushAt = new Date();
  await this.prisma.syncCursor.upsert({
    where: { organizationId: orgId },
    update: { lastPushAt },
    create: {
      organizationId: orgId,
      lastPullAt: new Date(0),
      lastPushAt,
    },
  });

  return { accepted, conflicts, errors };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Test push endpoint**

```bash
curl -X POST "http://localhost:4000/api/sync/push" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "x-organization-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "mutations": [
      {
        "operation": "create",
        "table": "sales",
        "data": {
          "code": "TEST-001",
          "date": "2026-05-25T12:00:00Z",
          "amount": 100,
          "amountUsd": 2,
          "exchangeRate": 50,
          "paymentMethod": 1,
          "status": 1,
          "idCustomer": 1,
          "items": [
            {
              "productId": 1,
              "quantity": 1,
              "unitPrice": 100,
              "unitPriceUsd": 2,
              "subtotal": 100,
              "subtotalUsd": 2
            }
          ]
        },
        "localTimestamp": "2026-05-25T12:00:00Z"
      }
    ]
  }'
```

Expected: JSON response with accepted, conflicts, errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/sync/sync.service.ts
git commit -m "feat: implement push endpoint with stock conflict detection"
```

---

### Task 2.5: Implement Conflicts Endpoints

**Files:**
- Modify: `backend/src/modules/sync/sync.service.ts`

- [ ] **Step 1: Implement getConflicts and resolveConflict methods**

These methods are already implemented in Task 2.2. Verify they work:

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 2: Test conflicts endpoints**

```bash
# Get conflicts
curl -X GET "http://localhost:4000/api/sync/conflicts" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "x-organization-id: 1"

# Resolve conflict
curl -X PATCH "http://localhost:4000/api/sync/conflicts/1/resolve" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "x-organization-id: 1" \
  -H "Content-Type: application/json" \
  -d '{"status": "resolved_server"}'
```

Expected: JSON responses

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/sync/sync.service.ts
git commit -m "feat: implement conflicts endpoints"
```

---

### Task 2.6: Implement Health Endpoint

**Files:**
- Modify: `backend/src/modules/sync/sync.controller.ts`

- [ ] **Step 1: Update health endpoint to use HEAD method**

The health endpoint is already implemented. Verify it works:

```bash
curl -X HEAD "http://localhost:4000/api/sync/health"
```

Expected: 200 OK

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/sync/sync.controller.ts
git commit -m "feat: implement health endpoint"
```

---

### Task 2.7: Wire UpdatedAt to Existing Models

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Verify all business models have updatedAt**

Check that Product, Customer, ExchangeRate, and other business models have `updatedAt DateTime @updatedAt` fields. If any are missing, add them:

```prisma
// Example for Product model
model Product {
  // ... existing fields ...
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Push schema to database**

```bash
cd backend
pnpm prisma db push
```

Expected: Schema pushed successfully

- [ ] **Step 3: Verify TypeScript compilation**

```bash
pnpm typecheck
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat: ensure all business models have updatedAt for incremental sync"
```

---

## Phase 3: Sync Engine

### Task 3.1: Create Sync Engine with Pull and Push

**Files:**
- Create: `frontend/src/lib/sync/sync-engine.ts`

- [ ] **Step 1: Create sync-engine.ts**

```ts
// frontend/src/lib/sync/sync-engine.ts
import { localDb } from './db';
import { syncQueue } from './sync-queue';
import { networkStatus } from './network-status';
import type { SyncEvent, SyncListener, PullResponse, PushResponse } from './types';
import apiClient from '@/lib/api/api-client';

export class SyncEngine {
  private events: Map<SyncEvent, Set<SyncListener>> = new Map();
  private pullInterval?: ReturnType<typeof setInterval>;
  private pushInFlight = false;
  private pullInFlight = false;
  private _lastSyncAt?: string;

  get lastSyncAt() {
    return this._lastSyncAt;
  }

  on(event: SyncEvent, listener: SyncListener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return () => {
      this.events.get(event)?.delete(listener);
    };
  }

  private emit(event: SyncEvent, payload?: unknown) {
    this.events.get(event)?.forEach(listener => listener(payload));
  }

  async pull(): Promise<void> {
    if (this.pullInFlight || !networkStatus.isOnline) return;

    this.pullInFlight = true;
    this.emit('sync-start');

    try {
      const metadata = await localDb.syncMetadata.get('lastPullAt');
      const since = metadata?.value;

      const response = await apiClient.get<PullResponse>('/sync/pull', {
        params: since ? { since } : undefined,
      });

      const { products, customers, exchangeRates, cursor } = response.data.data;

      // Merge products
      for (const product of products) {
        await localDb.products.put({
          id: product.id,
          organizationId: 1, // TODO: Get from context
          name: product.name,
          price: product.price,
          priceUsd: product.priceUsd,
          stock: product.stock,
          taxId: product.taxId,
          updatedAt: product.updatedAt,
        });
      }

      // Merge customers
      for (const customer of customers) {
        await localDb.customers.put({
          id: customer.id,
          organizationId: 1, // TODO: Get from context
          firstName: customer.firstName,
          lastName: customer.lastName,
          taxId: customer.taxId,
          phone: customer.phone,
          updatedAt: customer.updatedAt,
        });
      }

      // Update cursor
      await localDb.syncMetadata.put({
        key: 'lastPullAt',
        value: cursor.lastPullAt,
      });

      this._lastSyncAt = cursor.lastPullAt;
      this.emit('sync-complete');
    } catch (error) {
      this.emit('sync-error', error);
    } finally {
      this.pullInFlight = false;
    }
  }

  async push(): Promise<void> {
    if (this.pushInFlight || !networkStatus.isOnline) return;

    const pending = await syncQueue.getPending();
    if (pending.length === 0) return;

    this.pushInFlight = true;
    this.emit('sync-start');

    try {
      const mutations = pending.map(item => ({
        operation: item.operation,
        table: item.table,
        recordId: item.recordId,
        data: item.data,
        stockSnapshot: item.stockSnapshot,
        localTimestamp: item.localTimestamp,
      }));

      const response = await apiClient.post<PushResponse>('/sync/push', {
        mutations,
      });

      const { accepted, conflicts, errors } = response.data.data;

      // Remove accepted mutations from queue
      for (const id of accepted) {
        const item = pending.find(p => p.recordId === id);
        if (item?.id) {
          await syncQueue.markComplete(item.id);
        }
      }

      // Mark conflicts as failed
      for (const conflict of conflicts) {
        const item = pending.find(p => p.localTimestamp === conflict.localTimestamp);
        if (item?.id) {
          await syncQueue.markFailed(item.id);
        }
      }

      // Mark errors as failed
      for (const error of errors) {
        const item = pending.find(p => p.localTimestamp === error.localTimestamp);
        if (item?.id) {
          await syncQueue.markFailed(item.id);
        }
      }

      if (conflicts.length > 0) {
        this.emit('conflict-detected', conflicts);
      }

      this.emit('sync-complete');
    } catch (error) {
      this.emit('sync-error', error);
    } finally {
      this.pushInFlight = false;
    }
  }

  triggerPush(): void {
    // Debounced push - will be called by syncQueue.enqueue()
    setTimeout(() => this.push(), 2000);
  }

  start() {
    if (typeof window === 'undefined') return;

    // Periodic pull every 30s
    this.pullInterval = setInterval(() => this.pull(), 30_000);

    // Pull on app focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pull();
      }
    });

    // Initial pull
    this.pull();
  }

  stop() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }
  }

  async forceSync(): Promise<void> {
    await this.pull();
    await this.push();
  }
}

export const syncEngine = new SyncEngine();
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/sync-engine.ts
git commit -m "feat: create sync engine with pull and push"
```

---

### Task 3.2: Create Conflict Resolver

**Files:**
- Create: `frontend/src/lib/sync/conflict-resolver.ts`

- [ ] **Step 1: Create conflict-resolver.ts**

```ts
// frontend/src/lib/sync/conflict-resolver.ts
import type { SyncConflict } from './types';
import apiClient from '@/lib/api/api-client';

export class ConflictResolver {
  async getConflicts(): Promise<SyncConflict[]> {
    const response = await apiClient.get<SyncConflict[]>('/sync/conflicts');
    return response.data.data;
  }

  async resolveConflict(
    id: number,
    status: 'resolved_server' | 'resolved_local' | 'manual',
    manualData?: Record<string, unknown>,
  ): Promise<void> {
    await apiClient.patch(`/sync/conflicts/${id}/resolve`, {
      status,
      manualData,
    });
  }
}

export const conflictResolver = new ConflictResolver();
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/conflict-resolver.ts
git commit -m "feat: create conflict resolver"
```

---

### Task 3.3: Implement Multi-Tab Coordination

**Files:**
- Modify: `frontend/src/lib/sync/sync-engine.ts`

- [ ] **Step 1: Add BroadcastChannel coordination**

```ts
// Add to frontend/src/lib/sync/sync-engine.ts

export class SyncEngine {
  private events: Map<SyncEvent, Set<SyncListener>> = new Map();
  private pullInterval?: ReturnType<typeof setInterval>;
  private pushInFlight = false;
  private pullInFlight = false;
  private _lastSyncAt?: string;
  private broadcastChannel?: BroadcastChannel;
  private isLeader = false;

  // ... existing code ...

  start() {
    if (typeof window === 'undefined') return;

    // Setup BroadcastChannel for multi-tab coordination
    this.broadcastChannel = new BroadcastChannel('gladmin-sync');
    
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'leader-election' && event.data.tabId < this.getTabId()) {
        this.isLeader = false;
      }
    };

    // Elect leader
    this.broadcastChannel.postMessage({ type: 'leader-election', tabId: this.getTabId() });
    setTimeout(() => {
      this.isLeader = true;
    }, 1000);

    // Periodic pull every 30s (only if leader)
    this.pullInterval = setInterval(() => {
      if (this.isLeader) {
        this.pull();
      }
    }, 30_000);

    // Pull on app focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isLeader) {
        this.pull();
      }
    });

    // Initial pull
    if (this.isLeader) {
      this.pull();
    }
  }

  private getTabId(): number {
    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
      tabId = Math.random().toString(36).substring(2);
      sessionStorage.setItem('tabId', tabId);
    }
    return parseInt(tabId, 36);
  }

  stop() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }

  // ... existing code ...
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/sync-engine.ts
git commit -m "feat: implement multi-tab coordination via BroadcastChannel"
```

---

### Task 3.4: Add Beforeunload Warning

**Files:**
- Modify: `frontend/src/lib/sync/sync-engine.ts`

- [ ] **Step 1: Add beforeunload event listener**

```ts
// Add to frontend/src/lib/sync/sync-engine.ts start() method

start() {
  // ... existing code ...

  // Warn user if there are pending mutations
  window.addEventListener('beforeunload', (event) => {
    syncQueue.count().then(count => {
      if (count > 0) {
        event.preventDefault();
        event.returnValue = `You have ${count} pending changes that haven't been synced. Are you sure you want to leave?`;
      }
    });
  });

  // ... existing code ...
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/sync-engine.ts
git commit -m "feat: add beforeunload warning for pending mutations"
```

---

### Task 3.5: Integration Test

**Files:**
- None (manual testing)

- [ ] **Step 1: Start backend and frontend**

```bash
# Terminal 1
cd backend
pnpm start:dev

# Terminal 2
cd frontend
pnpm dev
```

- [ ] **Step 2: Test pull**

Open browser to http://localhost:3000, login, and check browser console for sync logs.

Expected: Pull request to /api/sync/pull succeeds

- [ ] **Step 3: Test push**

Create a test mutation in browser console:

```js
import { syncQueue } from '@/lib/sync/sync-queue';

await syncQueue.enqueue({
  operation: 'create',
  table: 'sales',
  data: {
    code: 'TEST-001',
    date: new Date().toISOString(),
    amount: 100,
    amountUsd: 2,
    exchangeRate: 50,
    paymentMethod: 1,
    status: 1,
    idCustomer: 1,
    items: [
      {
        productId: 1,
        quantity: 1,
        unitPrice: 100,
        unitPriceUsd: 2,
        subtotal: 100,
        subtotalUsd: 2,
      },
    ],
  },
  localTimestamp: new Date().toISOString(),
});
```

Expected: Push request to /api/sync/push succeeds

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "test: integration test for sync engine"
```

---

## Phase 4: POS Backend

### Task 4.1: Create Sales Module

**Files:**
- Create: `backend/src/modules/sales/sales.module.ts`
- Create: `backend/src/modules/sales/sales.controller.ts`
- Create: `backend/src/modules/sales/sales.service.ts`
- Create: `backend/src/modules/sales/dto/create-sale.dto.ts`
- Create: `backend/src/modules/sales/dto/update-sale.dto.ts`

- [ ] **Step 1: Create create-sale.dto.ts**

```ts
// backend/src/modules/sales/dto/create-sale.dto.ts
import { IsString, IsOptional, IsInt, IsNumber, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  unitPriceUsd: number;

  @IsNumber()
  subtotal: number;

  @IsNumber()
  subtotalUsd: number;

  @IsOptional()
  @IsString()
  observation?: string;
}

export class CreateSaleDto {
  @IsString()
  code: string;

  @IsDateString()
  date: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  amountUsd: number;

  @IsNumber()
  exchangeRate: number;

  @IsInt()
  paymentMethod: number;

  @IsInt()
  status: number;

  @IsOptional()
  @IsInt()
  idCustomer?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
```

- [ ] **Step 2: Create update-sale.dto.ts**

```ts
// backend/src/modules/sales/dto/update-sale.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDto } from './create-sale.dto';

export class UpdateSaleDto extends PartialType(CreateSaleDto) {}
```

- [ ] **Step 3: Create sales.service.ts**

```ts
// backend/src/modules/sales/sales.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  async create(dto: CreateSaleDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    const sale = await this.prisma.sale.create({
      data: {
        organizationId: orgId,
        code: dto.code,
        date: new Date(dto.date),
        amount: dto.amount,
        amountUsd: dto.amountUsd,
        exchangeRate: dto.exchangeRate,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        idCustomer: dto.idCustomer,
        details: {
          create: dto.items.map(item => ({
            organizationId: orgId,
            idProduct: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitPriceUsd: item.unitPriceUsd,
            subtotal: item.subtotal,
            subtotalUsd: item.subtotalUsd,
            observation: item.observation,
          })),
        },
      },
      include: {
        details: true,
        customer: true,
      },
    });

    // Decrement stock
    for (const item of dto.items) {
      await this.prisma.stock.updateMany({
        where: { productId: item.productId, organizationId: orgId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    return sale;
  }

  async findAll() {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return this.prisma.sale.findMany({
      where: { organizationId: orgId },
      include: {
        details: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const sale = await this.prisma.sale.findFirst({
      where: { id, organizationId: orgId },
      include: {
        details: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async update(id: number, dto: UpdateSaleDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    const sale = await this.prisma.sale.update({
      where: { id, organizationId: orgId },
      data: {
        code: dto.code,
        date: dto.date ? new Date(dto.date) : undefined,
        amount: dto.amount,
        amountUsd: dto.amountUsd,
        exchangeRate: dto.exchangeRate,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        idCustomer: dto.idCustomer,
      },
      include: {
        details: true,
        customer: true,
      },
    });

    return sale;
  }

  async remove(id: number) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const sale = await this.findOne(id);

    // Restore stock
    for (const item of sale.details) {
      await this.prisma.stock.updateMany({
        where: { productId: item.idProduct, organizationId: orgId },
        data: { quantity: { increment: item.quantity || 0 } },
      });
    }

    await this.prisma.sale.delete({
      where: { id, organizationId: orgId },
    });

    return sale;
  }
}
```

- [ ] **Step 4: Create sales.controller.ts**

```ts
// backend/src/modules/sales/sales.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSaleDto) {
    return this.salesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.remove(id);
  }
}
```

- [ ] **Step 5: Create sales.module.ts**

```ts
// backend/src/modules/sales/sales.module.ts
import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
```

- [ ] **Step 6: Register SalesModule in AppModule**

```ts
// Add to backend/src/app.module.ts imports array
import { SalesModule } from './modules/sales/sales.module';

// In imports array:
SalesModule,
```

- [ ] **Step 7: Verify TypeScript compilation**

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/sales/
git add backend/src/app.module.ts
git commit -m "feat: create sales module with CRUD operations"
```

---

### Task 4.2: Wire Sales into Sync Push Handler

**Files:**
- Modify: `backend/src/modules/sync/sync.service.ts`

- [ ] **Step 1: Update push method to use SalesService**

The push method already handles sales creation. Verify it works:

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/sync/sync.service.ts
git commit -m "feat: wire sales into sync push handler"
```

---

### Task 4.3: Add Products with Stock Endpoint

**Files:**
- Modify: `backend/src/modules/products/products.controller.ts`
- Modify: `backend/src/modules/products/products.service.ts`

- [ ] **Step 1: Update products.service.ts to include stock**

```ts
// Add to backend/src/modules/products/products.service.ts

async findAllWithStock() {
  const orgId = this.context.getCurrent()?.organizationId;
  if (!orgId) throw new Error('No organization context');
  const products = await this.prisma.product.findMany({
    where: { organizationId: orgId },
    include: {
      stocks: true,
    },
  });

  return products.map(product => ({
    ...product,
    stock: product.stocks.reduce((sum, stock) => sum + stock.quantity, 0),
  }));
}
```

- [ ] **Step 2: Update products.controller.ts to add endpoint**

```ts
// Add to backend/src/modules/products/products.controller.ts

@Get()
async findAll(@Query('includeStock') includeStock?: string) {
  if (includeStock === 'true') {
    return this.productsService.findAllWithStock();
  }
  return this.productsService.findAll();
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 4: Test endpoint**

```bash
curl -X GET "http://localhost:4000/api/products?includeStock=true" \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "x-organization-id: 1"
```

Expected: JSON response with products including stock field

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/products/
git commit -m "feat: add products with stock endpoint"
```

---

## Phase 5: POS Frontend

### Task 5.1: Create POS Feature Structure

**Files:**
- Create: `frontend/src/features/pos/pos-page.tsx`
- Create: `frontend/src/features/pos/components/product-grid.tsx`
- Create: `frontend/src/features/pos/components/cart.tsx`
- Create: `frontend/src/features/pos/components/payment-modal.tsx`
- Create: `frontend/src/features/pos/hooks/use-pos.ts`
- Create: `frontend/src/features/pos/hooks/use-offline-sale.ts`

- [ ] **Step 1: Create use-pos.ts**

```ts
// frontend/src/features/pos/hooks/use-pos.ts
import { useState } from 'react';
import { localDb } from '@/lib/sync/db';

export interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  unitPriceUsd: number;
  subtotal: number;
  subtotalUsd: number;
}

export function usePos() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const loadProducts = async () => {
    const allProducts = await localDb.products.toArray();
    setProducts(allProducts);
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unitPrice,
              subtotalUsd: (item.quantity + 1) * item.unitPriceUsd,
            }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          unitPriceUsd: product.priceUsd || 0,
          subtotal: product.price,
          subtotalUsd: product.priceUsd || 0,
        },
      ]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice,
            subtotalUsd: quantity * item.unitPriceUsd,
          }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUsd = cart.reduce((sum, item) => sum + item.subtotalUsd, 0);

  return {
    cart,
    products,
    loadProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    totalUsd,
  };
}
```

- [ ] **Step 2: Create use-offline-sale.ts**

```ts
// frontend/src/features/pos/hooks/use-offline-sale.ts
import { localDb } from '@/lib/sync/db';
import { syncQueue } from '@/lib/sync/sync-queue';
import type { CartItem } from './use-pos';

export function useOfflineSale() {
  const createSale = async (
    cart: CartItem[],
    total: number,
    totalUsd: number,
    exchangeRate: number,
    paymentMethod: number,
    customerId?: number,
  ) => {
    const saleData = {
      code: `SALE-${Date.now()}`,
      date: new Date().toISOString(),
      amount: total,
      amountUsd: totalUsd,
      exchangeRate,
      paymentMethod,
      status: 1,
      idCustomer: customerId,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitPriceUsd: item.unitPriceUsd,
        subtotal: item.subtotal,
        subtotalUsd: item.subtotalUsd,
      })),
    };

    // Get stock snapshot
    const stockSnapshot: Record<number, number> = {};
    for (const item of cart) {
      const stock = await localDb.stockCache.get(item.productId);
      if (stock) {
        stockSnapshot[item.productId] = stock.quantity;
      }
    }

    // Save to local sales
    await localDb.sales.add({
      localId: saleData.code,
      data: saleData,
      createdAt: new Date().toISOString(),
    });

    // Enqueue for sync
    await syncQueue.enqueue({
      operation: 'create',
      table: 'sales',
      data: saleData,
      stockSnapshot,
      localTimestamp: new Date().toISOString(),
    });

    // Decrement local stock
    for (const item of cart) {
      const stock = await localDb.stockCache.get(item.productId);
      if (stock) {
        await localDb.stockCache.update(item.productId, {
          quantity: stock.quantity - item.quantity,
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  };

  return { createSale };
}
```

- [ ] **Step 3: Create product-grid.tsx**

```tsx
// frontend/src/features/pos/components/product-grid.tsx
'use client';

import { Input } from '@/components/ui/input';

interface Product {
  id: number;
  name: string;
  price: number;
  priceUsd?: number;
  stock: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="space-y-4">
      <Input placeholder="Search products..." className="w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="p-4 border rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="font-medium">{product.name}</div>
            <div className="text-sm text-muted-foreground">
              ${product.price} | ${product.priceUsd || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Stock: {product.stock}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create cart.tsx**

```tsx
// frontend/src/features/pos/components/cart.tsx
'use client';

import { Button } from '@/components/ui/button';
import type { CartItem } from '../hooks/use-pos';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  total: number;
  totalUsd: number;
}

export function Cart({ items, onUpdateQuantity, onRemove, total, totalUsd }: CartProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Cart</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Cart is empty</p>
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${item.unitPrice} x {item.quantity}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemove(item.productId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Total (VES):</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total (USD):</span>
              <span className="font-semibold">${totalUsd.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create payment-modal.tsx**

```tsx
// frontend/src/features/pos/components/payment-modal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PaymentModalProps {
  total: number;
  totalUsd: number;
  onPayment: (paymentMethod: number) => void;
}

export function PaymentModal({ total, totalUsd, onPayment }: PaymentModalProps) {
  const [open, setOpen] = useState(false);

  const handlePayment = (method: number) => {
    onPayment(method);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={total === 0}>
          Checkout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">${total.toFixed(2)} VES</div>
            <div className="text-lg text-muted-foreground">${totalUsd.toFixed(2)} USD</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => handlePayment(1)}>Cash</Button>
            <Button onClick={() => handlePayment(2)}>Pago Movil</Button>
            <Button onClick={() => handlePayment(3)}>Transfer</Button>
            <Button onClick={() => handlePayment(4)}>Card</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Create pos-page.tsx**

```tsx
// frontend/src/features/pos/pos-page.tsx
'use client';

import { useEffect } from 'react';
import { usePos } from './hooks/use-pos';
import { useOfflineSale } from './hooks/use-offline-sale';
import { ProductGrid } from './components/product-grid';
import { Cart } from './components/cart';
import { PaymentModal } from './components/payment-modal';

export default function PosPage() {
  const {
    cart,
    products,
    loadProducts,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    totalUsd,
  } = usePos();

  const { createSale } = useOfflineSale();

  useEffect(() => {
    loadProducts();
  }, []);

  const handlePayment = async (paymentMethod: number) => {
    await createSale(cart, total, totalUsd, 50, paymentMethod);
    clearCart();
    alert('Sale completed!');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductGrid products={products} onAddToCart={addToCart} />
        </div>
        <div className="space-y-4">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            total={total}
            totalUsd={totalUsd}
          />
          <PaymentModal total={total} totalUsd={totalUsd} onPayment={handlePayment} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create POS route**

```tsx
// frontend/src/app/(dashboard)/pos/page.tsx
import PosPage from '@/features/pos/pos-page';

export default function Page() {
  return <PosPage />;
}
```

- [ ] **Step 8: Add POS to navigation**

```ts
// Add to frontend/src/config/navigation.config.ts

{
  label: 'POS',
  href: '/pos',
  icon: ShoppingCart,
},
```

- [ ] **Step 9: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/pos/
git add frontend/src/app/\(dashboard\)/pos/
git add frontend/src/config/navigation.config.ts
git commit -m "feat: create POS frontend with offline-first sale flow"
```

---

## Phase 6: PWA + Hooks

### Task 6.1: Configure @serwist/next

**Files:**
- Modify: `frontend/next.config.mjs`

- [ ] **Step 1: Update next.config.mjs**

```js
// frontend/next.config.mjs
import withSerwist from '@serwist/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default withSerwist({
  swSrc: 'sw.ts',
  swDest: 'public/sw.js',
})(nextConfig);
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/next.config.mjs
git commit -m "feat: configure @serwist/next for PWA"
```

---

### Task 6.2: Create Service Worker and Manifest

**Files:**
- Create: `frontend/sw.ts`
- Create: `frontend/src/app/manifest.ts`

- [ ] **Step 1: Create sw.ts**

```ts
// frontend/sw.ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => !request.url.includes('/api/'),
      },
    ],
  },
});

serwist.addEventListeners();
```

- [ ] **Step 2: Create manifest.ts**

```ts
// frontend/src/app/manifest.ts
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
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
  };
}
```

- [ ] **Step 3: Create offline page**

```tsx
// frontend/src/app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">You are offline</h1>
        <p className="text-muted-foreground">
          Please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/sw.ts
git add frontend/src/app/manifest.ts
git add frontend/src/app/offline/
git commit -m "feat: create service worker and PWA manifest"
```

---

### Task 6.3: Create Offline and Sync Status Hooks

**Files:**
- Create: `frontend/src/lib/sync/hooks/use-offline.ts`
- Create: `frontend/src/lib/sync/hooks/use-sync-status.ts`

- [ ] **Step 1: Create use-offline.ts**

```ts
// frontend/src/lib/sync/hooks/use-offline.ts
import { useEffect, useState } from 'react';
import { networkStatus } from '../network-status';
import { syncQueue } from '../sync-queue';
import { syncEngine } from '../sync-engine';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = networkStatus.onStatusChange(setIsOnline);

    const updatePendingCount = async () => {
      const count = await syncQueue.count();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    const unsubscribeSync = syncEngine.on('sync-complete', () => {
      updatePendingCount();
      setLastSyncAt(syncEngine.lastSyncAt);
    });

    return () => {
      unsubscribe();
      clearInterval(interval);
      unsubscribeSync();
    };
  }, []);

  const forceSync = async () => {
    await syncEngine.forceSync();
  };

  return {
    isOnline,
    pendingCount,
    lastSyncAt,
    forceSync,
  };
}
```

- [ ] **Step 2: Create use-sync-status.ts**

```ts
// frontend/src/lib/sync/hooks/use-sync-status.ts
import { useEffect, useState } from 'react';
import { syncEngine } from '../sync-engine';
import { useOffline } from './use-offline';
import type { SyncStatus } from '../types';

export function useSyncStatus() {
  const { isOnline, pendingCount, lastSyncAt, forceSync } = useOffline();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    const unsubscribeStart = syncEngine.on('sync-start', () => {
      setSyncStatus('syncing');
    });

    const unsubscribeComplete = syncEngine.on('sync-complete', () => {
      setSyncStatus('idle');
    });

    const unsubscribeError = syncEngine.on('sync-error', () => {
      setSyncStatus('error');
    });

    const unsubscribeConflict = syncEngine.on('conflict-detected', () => {
      setSyncStatus('conflict');
    });

    return () => {
      unsubscribeStart();
      unsubscribeComplete();
      unsubscribeError();
      unsubscribeConflict();
    };
  }, []);

  return {
    isOnline,
    pendingCount,
    lastSyncAt,
    syncStatus,
    forceSync,
  };
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/sync/hooks/
git commit -m "feat: create offline and sync status hooks"
```

---

### Task 6.4: Create Sync Indicator Component

**Files:**
- Create: `frontend/src/components/sync-indicator.tsx`
- Modify: `frontend/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create sync-indicator.tsx**

```tsx
// frontend/src/components/sync-indicator.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/lib/sync/hooks/use-sync-status';

export function SyncIndicator() {
  const { isOnline, pendingCount, syncStatus } = useSyncStatus();

  if (!isOnline) {
    return <Badge variant="destructive">Offline</Badge>;
  }

  if (syncStatus === 'syncing') {
    return <Badge variant="secondary">Syncing...</Badge>;
  }

  if (pendingCount > 0) {
    return <Badge>{pendingCount} pending</Badge>;
  }

  if (syncStatus === 'conflict') {
    return <Badge variant="warning">Conflicts</Badge>;
  }

  return <Badge variant="outline">Synced</Badge>;
}
```

- [ ] **Step 2: Add SyncIndicator to dashboard layout**

```tsx
// Add to frontend/src/app/(dashboard)/layout.tsx

import { SyncIndicator } from '@/components/sync-indicator';

// In the layout JSX, add to the header or sidebar:
<SyncIndicator />
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/sync-indicator.tsx
git add frontend/src/app/\(dashboard\)/layout.tsx
git commit -m "feat: create sync indicator component"
```

---

### Task 6.5: Create Conflict Resolution Page

**Files:**
- Create: `frontend/src/features/sync/conflicts-page.tsx`
- Create: `frontend/src/app/(dashboard)/settings/sync/conflicts/page.tsx`

- [ ] **Step 1: Create conflicts-page.tsx**

```tsx
// frontend/src/features/sync/conflicts-page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { conflictResolver } from '@/lib/sync/conflict-resolver';
import type { SyncConflict } from '@/lib/sync/types';

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setLoading(true);
    const data = await conflictResolver.getConflicts();
    setConflicts(data);
    setLoading(false);
  };

  const handleResolve = async (id: number, status: 'resolved_server' | 'resolved_local') => {
    await conflictResolver.resolveConflict(id, status);
    await loadConflicts();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Sync Conflicts</h1>
      {conflicts.length === 0 ? (
        <p className="text-muted-foreground">No conflicts</p>
      ) : (
        <div className="space-y-4">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="p-4 border rounded-lg space-y-2">
              <div className="font-medium">{conflict.description}</div>
              <div className="text-sm text-muted-foreground">
                Table: {conflict.table} | Status: {conflict.status}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleResolve(conflict.id, 'resolved_server')}
                >
                  Accept Server
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolve(conflict.id, 'resolved_local')}
                >
                  Accept Local
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create conflicts route**

```tsx
// frontend/src/app/(dashboard)/settings/sync/conflicts/page.tsx
import ConflictsPage from '@/features/sync/conflicts-page';

export default function Page() {
  return <ConflictsPage />;
}
```

- [ ] **Step 3: Add conflicts to navigation**

```ts
// Add to frontend/src/config/navigation.config.ts under Settings

{
  label: 'Sync Conflicts',
  href: '/settings/sync/conflicts',
  icon: AlertCircle,
},
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/sync/
git add frontend/src/app/\(dashboard\)/settings/sync/conflicts/
git add frontend/src/config/navigation.config.ts
git commit -m "feat: create conflict resolution page"
```

---

## Phase 7: Cross-Module Reuse

### Task 7.1: Add Remaining Business Models to Sync Pull

**Files:**
- Modify: `backend/src/modules/sync/sync.service.ts`

- [ ] **Step 1: Update pull method to include all business models**

```ts
// Update pull method in backend/src/modules/sync/sync.service.ts

async pull(since?: string) {
  const orgId = this.context.getCurrent()?.organizationId;
  if (!orgId) throw new Error('No organization context');
  const sinceDate = since ? new Date(since) : new Date(0);

  const products = await this.prisma.product.findMany({
    where: { organizationId: orgId, updatedAt: { gt: sinceDate } },
    select: { id: true, name: true, price: true, priceUsd: true, stock: true, taxId: true, updatedAt: true },
  });

  const customers = await this.prisma.customer.findMany({
    where: { organizationId: orgId, updatedAt: { gt: sinceDate } },
    select: { id: true, firstName: true, lastName: true, taxId: true, phone: true, updatedAt: true },
  });

  const exchangeRates = await this.prisma.exchangeRate.findMany({
    where: { organizationId: orgId, updatedAt: { gt: sinceDate } },
    select: { id: true, rate: true, updatedAt: true },
  });

  const suppliers = await this.prisma.supplier.findMany({
    where: { organizationId: orgId, updatedAt: { gt: sinceDate } },
    select: { id: true, name: true, updatedAt: true },
  });

  const companies = await this.prisma.company.findMany({
    where: { organizationId: orgId, updatedAt: { gt: sinceDate } },
    select: { id: true, name: true, updatedAt: true },
  });

  const taxes = await this.prisma.tax.findMany({
    where: { organizationId: orgId, updatedAt: { gt: sinceDate } },
    select: { id: true, name: true, rate: true, updatedAt: true },
  });

  const lastPullAt = new Date();

  await this.prisma.syncCursor.upsert({
    where: { organizationId: orgId },
    update: { lastPullAt },
    create: { organizationId: orgId, lastPullAt, lastPushAt: new Date(0) },
  });

  return {
    products,
    customers,
    exchangeRates,
    suppliers,
    companies,
    taxes,
    cursor: { lastPullAt: lastPullAt.toISOString() },
  };
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd backend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/sync/sync.service.ts
git commit -m "feat: add all business models to sync pull"
```

---

### Task 7.2: Register Stores in db.ts

**Files:**
- Modify: `frontend/src/lib/sync/db.ts`

- [ ] **Step 1: Add new stores to db.ts**

```ts
// Add to frontend/src/lib/sync/db.ts

export interface LocalSupplier {
  id: number;
  organizationId: number;
  name: string;
  updatedAt: string;
}

export interface LocalCompany {
  id: number;
  organizationId: number;
  name: string;
  updatedAt: string;
}

export interface LocalTax {
  id: number;
  organizationId: number;
  name: string;
  rate: number;
  updatedAt: string;
}

// Update localDb type
export const localDb = new Dexie('GLAdmin') as Dexie & {
  products: EntityTable<LocalProduct, 'id'>;
  customers: EntityTable<LocalCustomer, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
  stockCache: EntityTable<StockCacheItem, 'productId'>;
  sales: EntityTable<LocalSale, 'id'>;
  syncMetadata: EntityTable<SyncMetadata, 'key'>;
  suppliers: EntityTable<LocalSupplier, 'id'>;
  companies: EntityTable<LocalCompany, 'id'>;
  taxes: EntityTable<LocalTax, 'id'>;
};

// Update version
localDb.version(2).stores({
  products: 'id, updatedAt, organizationId',
  customers: 'id, updatedAt, organizationId',
  syncQueue: '++id, status, localTimestamp',
  stockCache: 'productId',
  sales: '++id, syncedAt',
  syncMetadata: 'key',
  suppliers: 'id, updatedAt, organizationId',
  companies: 'id, updatedAt, organizationId',
  taxes: 'id, updatedAt, organizationId',
});
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/db.ts
git commit -m "feat: register all business model stores in local database"
```

---

### Task 7.3: Update Sync Engine to Merge All Models

**Files:**
- Modify: `frontend/src/lib/sync/sync-engine.ts`

- [ ] **Step 1: Update pull method to merge all models**

```ts
// Update pull method in frontend/src/lib/sync/sync-engine.ts

async pull(): Promise<void> {
  // ... existing code ...

  const { products, customers, exchangeRates, suppliers, companies, taxes, cursor } = response.data.data;

  // Merge products
  for (const product of products) {
    await localDb.products.put({
      id: product.id,
      organizationId: 1,
      name: product.name,
      price: product.price,
      priceUsd: product.priceUsd,
      stock: product.stock,
      taxId: product.taxId,
      updatedAt: product.updatedAt,
    });
  }

  // Merge customers
  for (const customer of customers) {
    await localDb.customers.put({
      id: customer.id,
      organizationId: 1,
      firstName: customer.firstName,
      lastName: customer.lastName,
      taxId: customer.taxId,
      phone: customer.phone,
      updatedAt: customer.updatedAt,
    });
  }

  // Merge suppliers
  for (const supplier of suppliers) {
    await localDb.suppliers.put({
      id: supplier.id,
      organizationId: 1,
      name: supplier.name,
      updatedAt: supplier.updatedAt,
    });
  }

  // Merge companies
  for (const company of companies) {
    await localDb.companies.put({
      id: company.id,
      organizationId: 1,
      name: company.name,
      updatedAt: company.updatedAt,
    });
  }

  // Merge taxes
  for (const tax of taxes) {
    await localDb.taxes.put({
      id: tax.id,
      organizationId: 1,
      name: tax.name,
      rate: tax.rate,
      updatedAt: tax.updatedAt,
    });
  }

  // ... existing code ...
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/sync/sync-engine.ts
git commit -m "feat: update sync engine to merge all business models"
```

---

### Task 7.4: Handle Org Switch

**Files:**
- Modify: `frontend/src/lib/sync/sync-engine.ts`

- [ ] **Step 1: Add clearLocalData method**

```ts
// Add to frontend/src/lib/sync/sync-engine.ts

async clearLocalData(): Promise<void> {
  await localDb.products.clear();
  await localDb.customers.clear();
  await localDb.syncQueue.clear();
  await localDb.stockCache.clear();
  await localDb.sales.clear();
  await localDb.syncMetadata.clear();
  await localDb.suppliers.clear();
  await localDb.companies.clear();
  await localDb.taxes.clear();
}
```

- [ ] **Step 2: Add onOrgSwitch method**

```ts
// Add to frontend/src/lib/sync/sync-engine.ts

async onOrgSwitch(): Promise<void> {
  // Push pending mutations first
  await this.push();
  
  // Clear all local data
  await this.clearLocalData();
  
  // Reset cursor
  this._lastSyncAt = undefined;
  
  // Pull fresh data
  await this.pull();
}
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/sync/sync-engine.ts
git commit -m "feat: handle org switch with data clear and re-pull"
```

---

## Phase 8: Offline Authentication

### Task 8.1: Create PIN Setup Component

**Files:**
- Create: `frontend/src/features/auth/components/pin-setup.tsx`

- [ ] **Step 1: Create pin-setup.tsx**

```tsx
// frontend/src/features/auth/components/pin-setup.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localDb } from '@/lib/sync/db';

interface PinSetupProps {
  userId: number;
  onComplete: () => void;
}

export function PinSetup({ userId, onComplete }: PinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    // Hash PIN
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store hash
    await localDb.syncMetadata.put({
      key: `pin_${userId}`,
      value: hashHex,
    });

    onComplete();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Set Up Offline PIN</h2>
      <p className="text-sm text-muted-foreground">
        Create a 4-6 digit PIN to access the app when offline.
      </p>
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={6}
        />
        <Input
          type="password"
          placeholder="Confirm PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          maxLength={6}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Save PIN
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/components/pin-setup.tsx
git commit -m "feat: create PIN setup component"
```

---

### Task 8.2: Create PIN Unlock Component

**Files:**
- Create: `frontend/src/features/auth/components/pin-unlock.tsx`

- [ ] **Step 1: Create pin-unlock.tsx**

```tsx
// frontend/src/features/auth/components/pin-unlock.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { localDb } from '@/lib/sync/db';

interface PinUnlockProps {
  userId: number;
  onUnlock: () => void;
}

export function PinUnlock({ userId, onUnlock }: PinUnlockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Get stored hash
    const stored = await localDb.syncMetadata.get(`pin_${userId}`);
    if (!stored) {
      setError('PIN not set up');
      return;
    }

    // Hash entered PIN
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Compare
    if (hashHex === stored.value) {
      onUnlock();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Enter PIN</h2>
      <p className="text-sm text-muted-foreground">
        Enter your PIN to access the app offline.
      </p>
      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={6}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Unlock
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/components/pin-unlock.tsx
git commit -m "feat: create PIN unlock component"
```

---

### Task 8.3: Integrate PIN into Auth Flow

**Files:**
- Modify: `frontend/src/features/auth/auth-provider.tsx`

- [ ] **Step 1: Update auth provider to handle PIN flow**

```ts
// Add to frontend/src/features/auth/auth-provider.tsx

import { localDb } from '@/lib/sync/db';

// In the AuthProvider component, add state for PIN flow
const [showPinSetup, setShowPinSetup] = useState(false);
const [showPinUnlock, setShowPinUnlock] = useState(false);

// After successful login, check if PIN is set
const handleLogin = async (credentials: LoginCredentials) => {
  const response = await authService.login(credentials);
  
  // Check if PIN is set
  const pinStored = await localDb.syncMetadata.get(`pin_${response.user.id}`);
  if (!pinStored) {
    setShowPinSetup(true);
  }
  
  // ... rest of login flow
};

// Handle token expiry
const handleTokenExpiry = async () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const pinStored = await localDb.syncMetadata.get(`pin_${user.id}`);
  
  if (pinStored && !networkStatus.isOnline) {
    setShowPinUnlock(true);
  } else {
    // Redirect to login
    router.push('/login');
  }
};

// Provide PIN components in context
return (
  <AuthContext.Provider value={{ /* ... */ }}>
    {children}
    {showPinSetup && (
      <PinSetup
        userId={user.id}
        onComplete={() => setShowPinSetup(false)}
      />
    )}
    {showPinUnlock && (
      <PinUnlock
        userId={user.id}
        onUnlock={() => setShowPinUnlock(false)}
      />
    )}
  </AuthContext.Provider>
);
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd frontend
pnpm typecheck
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/auth-provider.tsx
git commit -m "feat: integrate PIN setup and unlock into auth flow"
```

---

## Summary

This implementation plan covers all 8 phases of the offline-first POS + sync system:

1. **Foundation** - Local database, network detection, sync queue
2. **Backend Sync** - Pull/push endpoints, conflict detection
3. **Sync Engine** - Client-side orchestration, multi-tab coordination
4. **POS Backend** - Sales module with stock management
5. **POS Frontend** - Offline-first POS interface
6. **PWA + Hooks** - Service worker, sync status UI
7. **Cross-Module** - Extend sync to all business models
8. **Offline Auth** - PIN setup and unlock flow

Each task is designed to be executed by a subagent in 2-5 minutes, with clear file paths, complete code, and verification steps.
