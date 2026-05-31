# Audit Report: AGENTS.md Rules Compliance

**Date:** 2026-05-30  
**Scope:** Full monorepo (`backend/`, `frontend/`, `specs/`)  
**Method:** Deep scan across 7 domains — no code modified

---

## Summary

| Severity | Count |
|----------|-------|
| **Critical** | 25 |
| **Important** | 27 |
| **Minor** | 8 |
| **Total** | **60** |

---

## 1. Planning & Requirements

| # | Severity | Rule | Finding |
|---|----------|------|---------|
| 1.1 | Important | Version 2 log | No dedicated "Version 2" backlog file exists. `specs/deferred-work.md` serves a similar purpose but is not labeled as such |
| 1.2 | Important | DoD checklists | No formal Definition of Done templates or per-feature DoD checklists found |
| 1.3 | Important | Cost of Ownership | No operational cost documentation (API tokens, hosting, cloud compute) |
| 1.4 | OK | ORCHESTRATOR.md | Present and well-maintained with status tracking |

---

## 2. System Structure

| # | Severity | Rule | Finding |
|---|----------|------|---------|
| 2.1 | Important | Feature folder structure | 3 features missing the standard structure: `pos/` (no `models/`, `services/`), `dashboard/` (no `services/`), `sync/` (no `components/`, `hooks/`, `models/`, `services/`) |
| 2.2 | OK | DataTable columns | All pages follow `Column<Entity>[]` pattern correctly |
| 2.3 | OK | Forms | All use `SlideForm` + shadcn components; no native `<select>` found |
| 2.4 | OK | ConfirmDialog | 14 pages correctly use `ConfirmDialog` for delete confirmations |

---

## 3. Thinking Disciplines

| # | Severity | Rule | Finding |
|---|----------|------|---------|
| 3.1 | OK | Edge case thinking | No direct violations found — this is a process discipline |
| 3.2 | OK | Production thinking | Transaction usage, PKCE PIN auth, sync engine show production-awareness |
| 3.3 | OK | Technical debt tracking | `specs/deferred-work.md` and `specs/ORCHESTRATOR.md` serve as debt trackers |

---

## 4. Reliability

### 4.1 Swallowed Exceptions

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **4.1.1** | **Critical** | 16 feature pages (e.g., `users-page.tsx:72`, `products-page.tsx:69`, `stocks-page.tsx:76-78`) | Empty `.catch(() => {})` silently discards API errors when loading reference/dropdown data |
| **4.1.2** | **Critical** | `frontend/src/providers/auth-provider.tsx:145` | Logout catches error and ignores it — server session may persist while client clears tokens |
| **4.1.3** | **Important** | 18 feature hooks (e.g., `use-products.ts:19`, `use-customers.ts:19`) | Hardcoded Spanish error strings instead of `t()` i18n keys |
| **4.1.4** | Important | Multiple page components | Error details discarded when setting generic i18n key — makes debugging harder |

### 4.2 Idempotency

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **4.2.1** | **Critical** | `backend/src/modules/payments/payments.service.ts:67-80` | Stripe webhook has no event ID deduplication; retried webhook reprocesses `checkout.session.completed` |
| **4.2.2** | **Critical** | `backend/src/modules/sync/sync.service.ts:142-256` | Sync push has no deduplication — retried push could create duplicate records |
| **4.2.3** | **Critical** | `backend/src/modules/sales/sales.service.ts:14-58` | Sale creation has no idempotency mechanism |
| **4.2.4** | **Critical** | `backend/src/modules/pago-movil/pago-movil.service.ts:103-126` | PagoMovil transaction creation has no idempotency check — double-submit creates two transactions |

### 4.3 Retry with Exponential Backoff

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **4.3.1** | **Critical** | `frontend/src/lib/sync/sync-engine.ts` | Pull retries on fixed 30s interval; no backoff, no jitter |
| **4.3.2** | **Critical** | `frontend/src/lib/sync/sync-queue.ts:32,46-47` | `retryCount` field and `incrementRetry()` exist but are **never called anywhere** |
| **4.3.3** | Important | `frontend/src/lib/api/api-client.ts:42-52` | Single 401 retry; no backoff, no max retries |

### 4.4 Rate Limiting

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **4.4.1** | **Critical** | `backend/src/app.module.ts:60-63` | `ThrottlerModule` configured but `ThrottlerGuard` is **not registered as `APP_GUARD`** — only applies where explicitly added |
| **4.4.2** | **Critical** | `backend/src/modules/auth/auth.controller.ts:40` | POST /auth/change-password has **no rate limiting** — vulnerable to brute-force |
| **4.4.3** | **Critical** | Multiple public endpoints | `/health`, `/bootstrap/status`, `/bootstrap/setup`, `/sync/pull`, `/sync/push` have no rate limiting |
| **4.4.4** | OK | Auth login/refresh | POST /auth/login (5/min) and POST /auth/refresh (10/min) correctly throttled |

### 4.5 Timeouts & Circuit Breakers

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **4.5.1** | **Critical** | `backend/src/modules/payments/payments.service.ts:15` | Stripe client created without `timeout` or `maxNetworkRetries` |
| **4.5.2** | **Critical** | `frontend/src/lib/api/api-client.ts:5-8` | Axios instance created without `timeout` — default is infinite |
| **4.5.3** | **Critical** | `frontend/src/lib/sync/network-status.ts:40` | Health `fetch()` has no `AbortSignal` or timeout |
| **4.5.4** | **Critical** | Entire codebase | Zero circuit breaker pattern implemented anywhere |

### 4.6 Graceful Degradation

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 4.6.1 | Minor | Feature pages with empty catch blocks | When reference data fails to load, forms submit with empty dropdowns — no warning to user |
| 4.6.2 | Minor | Sync indicator | No persistent visual indication of unsynced offline data beyond event emissions |
| 4.6.3 | OK | Multiple locations | JSON parse of plan features falls back to `[]` — graceful parsing |
| 4.6.4 | OK | `frontend/src/app/error.tsx` | Next.js error boundary with retry button |

### 4.7 Webhook Security

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 4.7.1 | Important | `backend/src/modules/payments/payments.controller.ts:47` | Relies on `req.rawBody` being set by Express middleware — no verification that it's populated |
| 4.7.2 | Important | `backend/src/modules/payments/payments.service.ts:68` | Unhandled event types (e.g., `invoice.payment_failed`) silently return `{ received: true }` with no warning |
| 4.7.3 | OK | `backend/src/modules/payments/payments.controller.ts:30-51` | Stripe webhook signature verification correctly implemented |

---

## 5. Execution (Async & Performance)

### 5.1 UI Blocking

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 5.1.1 | Important | `frontend/src/features/pos/pos-page.tsx:32` | `alert('Sale completed!')` — synchronous blocking dialog |
| **5.1.2** | **Critical** | Entire frontend | **Zero `<Suspense>` boundaries anywhere** — all pages render without fallback while data loads |
| 5.1.3 | Important | `frontend/src/app/(dashboard)/layout.tsx:63` | `if (isLoading) return null;` — renders nothing while auth loads |

### 5.2 Caching

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 5.2.1 | Important | All feature page components | No `React.memo` on any feature page — unnecessary re-renders |
| 5.2.2 | Important | Backend | No server-side caching (Redis, in-memory) for static lookup data |
| 5.2.3 | Minor | Server components | No `React.cache()` for deduplicating server-side fetch calls |
| 5.2.4 | OK | `frontend/src/lib/sync/db.ts` | Dexie.js IndexedDB for offline-first data caching |
| 5.2.5 | OK | `frontend/src/providers/query-provider.tsx` | React Query with `staleTime: 5min` |

### 5.3 Race Conditions

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **5.3.1** | **Critical** | `backend/prisma/schema.prisma` (28 models) | **Zero version/locking fields** — no `version Int`, no `@version`, no optimistic locking protection |
| **5.3.2** | **Critical** | `backend/src/modules/sales/sales.service.ts:121-126` | Stock restoration in `remove()` runs outside `$transaction` |
| **5.3.3** | **Critical** | `backend/src/modules/purchase-orders/purchase-orders.service.ts:85-91` | Delete details + delete header not in `$transaction` — partial failure leaves orphans |
| **5.3.4** | **Critical** | `backend/src/modules/users/users.service.ts:124-130` | `userOrganization` delete + user delete not in `$transaction` |
| 5.3.5 | OK | `backend/src/modules/sales/sales.service.ts:18-57` | Sale creation + stock decrement properly in `$transaction` |

### 5.4 Pagination

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **5.4.1** | **Critical** | **18/18 findAll endpoints** | **All list endpoints return unbounded datasets** — no `skip`/`take`, no `page`/`limit` params |
| 5.4.2 | Minor | `frontend/src/components/ui/data-table.tsx` | DataTable supports server-side pagination but no page component wires it up because backend lacks pagination |
| 5.4.3 | OK | `backend/src/modules/dashboard/dashboard.service.ts` | Dashboard uses `take: 5` / `take: 500` appropriately |

**Affected controllers:** products, customers, suppliers, companies, stocks, batches, taxes, purchase-orders, sales, exchange-rates, withholdings, users, roles, currencies, admin-orgs, admin-users, admin-plans, admin-invites

### 5.5 Batch Operations

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 5.5.1 | Important | Entire codebase | `createMany()` never used — no bulk creation endpoints |
| 5.5.2 | Important | `backend/src/modules/sales/sales.service.ts:49-53` | Stock `updateMany` inside `for` loop — could be single query |

### 5.6 Database Indexes

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **5.6.1** | **Critical** | `backend/prisma/schema.prisma` | **Zero `@@index` declarations** across 28 models |
| **5.6.2** | **Critical** | All tenant-scoped models | `organizationId` is filtered in every query (via Prisma middleware) but has no explicit index |
| **5.6.3** | **Critical** | Sync-targeted models (Product, Customer, etc.) | `@@index([organizationId, updatedAt])` missing — used in every sync pull query |
| **5.6.4** | **Critical** | Models with `available` field (Customer, Supplier, Product, Stock) | `@@index([organizationId, available])` missing — used in every findAll query |
| 5.6.5 | Important | Models with `status` (PagoMovilTransaction, PurchaseOrder, Sale, AccountsPayable/Receivable) | No index on commonly filtered `status` column |
| 5.6.6 | Important | Models with `date` (PurchaseOrder, Sale, ExchangeRate) | No index on sort/filter column |

### 5.7 Background Jobs

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 5.7.1 | Important | Entire codebase | No background job infrastructure (no Bull/BullMQ, no queues, no workers). Acceptable for current scope; required if email, reports, or data exports are added |

### 5.8 Streaming

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 5.8.1 | Minor | Entire backend | No streaming or chunked responses implemented. Acceptable for current small JSON payloads |

---

## 6. Infrastructure & DevOps

### 6.1 Secrets Management

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **6.1.1** | **Critical** | `backend/src/core/config/jwt.config.ts:4` | Hardcoded fallback `'gladmin-dev-secret'` in source code |
| **6.1.2** | **Critical** | `backend/src/app.module.ts:66` | Same hardcoded fallback in second location |
| **6.1.3** | Important | 12 files | `process.env` accessed directly instead of using `ConfigService` (which is configured but unused) |
| 6.1.4 | Important | `backend/prisma/seed.ts:31` | Hardcoded seed password `'000000'` |
| 6.1.5 | Minor | `frontend/.env.local.example` | Not tracked in git — should be tracked as documentation |
| 6.1.6 | OK | `.gitignore` | `.env*` correctly excluded from git |

### 6.2 Migrations

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **6.2.1** | **Critical** | `.gitignore:47` | **`backend/prisma/migrations/` is entirely gitignored** — no migration history in version control |
| **6.2.2** | **Critical** | `backend/prisma/migrations/migration_lock.toml` | Prisma's concurrency guard not tracked (file itself says "It should be added in your version-control system") |

### 6.3 CI/CD

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **6.3.1** | **Critical** | `.github/` directory | **Does not exist** — no GitHub Actions workflows |
| **6.3.2** | **Critical** | Root | No CI pipeline of any kind (no CircleCI, GitLab CI, etc.) |
| 6.3.3 | Important | Root `package.json` | `typecheck`, `lint`, `test` scripts exist but are never enforced |

### 6.4 Dependency Management

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 6.4.1 | Important | `backend/package.json`, `frontend/package.json` | All dependencies use caret `^` ranges instead of pinned versions (except `next` and `react`) |
| 6.4.2 | Minor | Root | No `pnpm audit` or security audit script configured |
| 6.4.3 | OK | Root `pnpm-lock.yaml` | Lockfile exists (426KB) and is tracked in git |

### 6.5 Backups

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 6.5.1 | Important | Entire project | No backup scripts, documentation, or configuration |

### 6.6 Configuration Management

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 6.6.1 | Important | `backend/src/` | `@nestjs/config` module configured but `ConfigService` never injected anywhere — all services read `process.env` directly |
| 6.6.2 | Minor | `backend/tsconfig.json` | Partial strict mode instead of `strict: true` (`tsconfig.base.json` has it correct) |

---

## 7. Testing & Quality

### 7.1 `any` Usage

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **7.1.1** | **Critical** | 25 locations | 17 `as any` + 8 `: any` across backend/frontend with no justifications |
| **7.1.2** | **Critical** | `backend/eslint.config.mjs:29` | `no-explicit-any` rule set to `'off'` — completely disabled |
| **7.1.3** | **Critical** | `root/.eslintrc.cjs:22` | `no-explicit-any` set to `'warn'` — should be `'error'` per zero-warnings policy |
| **7.1.4** | **Critical** | `frontend/eslint.config.mjs` | No `no-explicit-any` rule configured at all |

### 7.2 Test Coverage

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **7.2.1** | **Critical** | Backend | Zero unit tests (`*.spec.ts`) — only 1 scaffold e2e test |
| **7.2.2** | **Critical** | Frontend | Zero tests of any kind — no test script in `package.json` |
| **7.2.3** | **Critical** | Root | `pnpm -r test` will fail because frontend has no `test` script |

### 7.3 Linting

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 7.3.1 | OK | All 3 locations | ESLint configured with Prettier integration |
| 7.3.2 | Important | All locations | No CI enforcement of lint rules |

### 7.4 Mock External Services

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 7.4.1 | Important | `backend/test/app.e2e-spec.ts` | Only test file imports real `AppModule` — would require live database and Stripe |
| 7.4.2 | Important | Entire codebase | No `__mocks__/` directories, no jest.mock, no MSW |

---

## 8. Observability & Security

### 8.1 Structured Logging

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **8.1.1** | **Critical** | Backend | **No structured logging infrastructure** — no NestJS `Logger`, no `winston`, no `pino` |
| **8.1.2** | **Critical** | `backend/src/common/filters/http-exception.filter.ts:42` | `console.error('Unhandled error:', exception)` — logs raw exception object which may contain JWT tokens and PII |
| 8.1.3 | Important | `backend/src/app.module.ts:51` | `console.warn('WARNING: Using default JWT secret...')` — unstructured |
| 8.1.4 | Important | `frontend/src/app/error.tsx:17` | `console.error(error)` — may expose tokens or user data |
| 8.1.5 | Minor | `backend/prisma/seed.ts` | 17 `console.log` + 1 `console.error` in seed file |

### 8.2 AuthN vs AuthZ

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **8.2.1** | **Critical** | `backend/src/modules/sales/sales.controller.ts` (all endpoints) | **No `@Roles` or `@MinLevel` decorators** — any authenticated user can create/read/update/delete sales |
| **8.2.2** | **Critical** | `backend/src/modules/uploads/uploads.controller.ts` | No role authorization — any authenticated user can upload files |
| 8.2.3 | OK | Most controllers | 15+ controllers have correct `@UseGuards(RolesGuard)` + `@Roles()`/`@MinLevel()` |
| 8.2.4 | OK | Global guards | `AuthGuard`, `RolesGuard`, `FeatureGuard` registered as `APP_GUARD` |

### 8.3 Security-First (Input Validation)

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 8.3.1 | Important | `backend/src/modules/companies/dto/create-company.dto.ts` | PII fields (taxId, address, phoneNumber, email) use `@IsString()` only — no format/pattern/length validation |
| 8.3.2 | Important | `backend/src/modules/suppliers/dto/create-supplier.dto.ts` | taxId (RIF) uses `@IsString()` only — no RIF format validation |
| 8.3.3 | Minor | `backend/src/modules/auth/dto/change-password.dto.ts` | `oldPassword` has `@IsString()` but no `@MinLength` |
| 8.3.4 | OK | Global | `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform` applied globally |
| 8.3.5 | OK | DTOs | All 40+ DTOs use class-validator decorators |

### 8.4 SQL Injection

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 8.4.1 | OK | `backend/src/modules/health/health.controller.ts:13` | Only `$queryRaw` usage — uses tagged template, correctly parameterized |
| 8.4.2 | OK | Entire codebase | No `$executeRaw` or string interpolation found |

### 8.5 Audit Logging

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **8.5.1** | **Critical** | Entire backend | **No audit log module, service, or database table exists** |
| **8.5.2** | **Critical** | `backend/src/modules/users/users.service.ts:66` | User creation not audited |
| **8.5.3** | **Critical** | `backend/src/modules/admin/admin.service.ts:260` | User deactivation not audited |
| **8.5.4** | **Critical** | `backend/src/modules/admin/admin.service.ts:193` | Role changes not audited |
| **8.5.5** | **Critical** | `backend/src/modules/payments/payments.service.ts:67` | Payment processing not audited |

### 8.6 PII Handling

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **8.6.1** | **Critical** | `backend/prisma/schema.prisma` | **All PII stored as plaintext** — email, phone, address, taxId (RIF), idCardNumber across 7 models |
| **8.6.2** | **Critical** | Backend | **No encryption infrastructure** — `crypto` module only used for random ID generation, not data encryption |
| 8.6.3 | Important | All service findAll methods | Full entity records with PII returned in API responses — no field-level filtering |
| 8.6.4 | OK | All auth services | Passwords hashed with bcrypt; stripped from API responses |
| 8.6.5 | OK | Auth service | Refresh tokens hashed with bcrypt before storage |

### 8.7 Prompt Injection

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 8.7.1 | OK | Entire codebase | No LLM features detected — no OpenAI, Anthropic, or AI integrations |

### 8.8 Cost Observability

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 8.8.1 | Important | Entire codebase | No API spend monitoring, cost dashboards, or budget alerts |

---

## 9. Existing Project Conventions

### 9.1 i18n Compliance

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **9.1.1** | **Critical** | `es.json:194` vs `en.json:194` | Key name mismatch: `companies.field.taxId` (es) vs `companies.field.documentNumber` (en) — English users see broken key |
| **9.1.2** | **Critical** | `frontend/src/features/pos/` (entire feature) | Zero i18n — all text hardcoded English |
| **9.1.3** | **Critical** | `frontend/src/features/sync/` (entire feature) | Zero i18n — all text hardcoded English |
| 9.1.4 | Important | `frontend/src/features/exchange-rates/components/exchange-rates-page.tsx` | 8 hardcoded strings ("BCV", "Paralelo", "Manual", "DolarToday", etc.) |
| 9.1.5 | OK | Most features | Follow `t('module.key')` pattern correctly |

### 9.2 Sileo Toast Patterns

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **9.2.1** | **Critical** | 7 feature pages | Missing `sileo.success` after create/update/delete: taxes, companies, stocks, exchange-rates, batches, suppliers, customers |
| **9.2.2** | **Critical** | `frontend/src/features/pos/pos-page.tsx:32` | `alert('Sale completed!')` instead of `sileo.success()` |
| 9.2.3 | OK | 9 feature pages | Correctly use `sileo.success` |
| 9.2.4 | OK | Error handling | No misuse of `sileo.toast` or `sileo.error` |

### 9.3 Duplicate Title Rule

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| **9.3.1** | **Critical** | `frontend/src/features/pos/pos-page.tsx:37` | Renders `<h1>Point of Sale</h1>` — duplicates dashboard layout title |
| **9.3.2** | **Critical** | `frontend/src/features/sync/conflicts-page.tsx:34` | Renders `<h1>Sync Conflicts</h1>` — duplicates dashboard layout title |

### 9.4 Sidebar

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 9.4.1 | Important | `frontend/src/app/(dashboard)/layout.tsx` | Logout is only in `UserNav` dropdown — missing `SidebarLink` at end of navigation |

### 9.5 TypeScript & Validation

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 9.5.1 | Minor | `backend/tsconfig.json` | Partial strict mode — `tsconfig.base.json` has `strict: true` but backend overrides |
| 9.5.2 | OK | `backend/src/main.ts:27-33` | ValidationPipe correctly configured |
| 9.5.3 | OK | All DTOs | Frontend model interfaces match backend DTOs |

---

## Priority Matrix

### Immediate (Critical — Security/Data Integrity)
| # | Rule | Item |
|---|------|------|
| C1 | 8.2.1 | Add `@MinLevel` to sales controller (missing authZ) |
| C2 | 8.2.2 | Add `@MinLevel` to uploads controller |
| C3 | 6.1.1-2 | Remove hardcoded `'gladmin-dev-secret'`; require JWT_SECRET in production |
| C4 | 8.1.2 | Replace `console.error(exception)` in HTTP filter — logs raw payload with potential tokens/PII |
| C5 | 4.2.1 | Add Stripe webhook event ID deduplication |
| C6 | 4.4.1-3 | Register `ThrottlerGuard` as `APP_GUARD`; add rate limiting to password change and public endpoints |

### High (Data Integrity & Infrastructure)
| # | Rule | Item |
|---|------|------|
| H1 | 5.4.1 | Add pagination to all 18 list endpoints |
| H2 | 5.6.1-4 | Add `@@index` declarations on tenant-scoped models |
| H3 | 5.3.1-4 | Add version fields + wrap multi-step deletes in `$transaction` |
| H4 | 6.2.1 | Un-gitignore `backend/prisma/migrations/` |
| H5 | 6.3.1 | Set up GitHub Actions CI/CD (typecheck + lint + test) |
| H6 | 7.2.1-3 | Add test infrastructure and minimum test coverage |
| H7 | 9.1.1 | Fix es.json/en.json key mismatch (`taxId` vs `documentNumber`) |
| H8 | 8.5.1-5 | Create AuditLog model and module |

### Medium (Patterns & Conventions)
| # | Rule | Item |
|---|------|------|
| M1 | 4.1.1 | Replace 16 empty `.catch(() => {})` with proper error handling |
| M2 | 4.3.1-3 | Implement exponential backoff in sync engine and API client |
| M3 | 4.5.1-4 | Add HTTP timeouts to Stripe client, axios, and fetch calls |
| M4 | 5.1.2 | Add `<Suspense>` boundaries to layout and feature pages |
| M5 | 9.2.1-2 | Add `sileo.success` to 7 feature pages + replace `alert()` in POS |
| M6 | 9.1.2-4 | Add i18n to POS and sync features |
| M7 | 9.3.1-2 | Remove duplicate `<h1>` from POS and sync pages |
| M8 | 7.1.1-4 | Clean 25 `any` usages and enable `no-explicit-any: error` |
| M9 | 8.1.1 | Introduce structured logging (NestJS Logger / winston) |

### Low (Documentation & Nice-to-Have)
| # | Rule | Item |
|---|------|------|
| L1 | 1.1 | Create dedicated Version 2 backlog file |
| L2 | 1.2 | Define DoD checklist template |
| L3 | 1.3 | Document operational costs |
| L4 | 8.6.1-3 | Implement PII encryption at rest + field-level API filtering |
| L5 | 5.5.1 | Add bulk creation endpoints using `createMany` |
| L6 | 6.5.1 | Create backup scripts |
| L7 | 8.8.1 | Set up cost observability |
| L8 | 6.6.1 | Migrate `process.env` access to `ConfigService` |
