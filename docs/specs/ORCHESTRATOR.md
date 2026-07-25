# Spec Orchestrator

Master tracker for all specs, implementation plans, and their completion status.

---

## Status: Multi-Tenant SaaS

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `docs/superpowers/plans/2026-05-25-multi-tenant.md` | ✅ Complete | — | Approved implementation plan |
| Phase 1 — Foundation (schema + middleware + seed) | ✅ Complete | Plan §1 | All 5 steps done, typecheck 0 errors |
| Phase 2 — Auth + Org Picker | ✅ Complete | Plan §2 | Login returns orgs, select-org endpoint, org picker page |
| Phase 3 — Admin Panel Backend | ✅ Complete | Plan §3 | 19 endpoints across 4 controllers, all @MinLevel(master) |
| Phase 4 — Frontend Admin + Org Context | ✅ Complete | Plan §4 | 4 admin feature modules, sidebar org display |
| Phase 5 — Plans + Feature Gating | ✅ Complete | Plan §5 | @RequiresFeature decorator, PlanGuard, useFeature hook, 4 plans seeded |
| Phase 6 — Payments (Pago Movil + Stripe) | ✅ Complete | Plan §6 | Config CRUD, transactions, review flow, checkout, webhook, billing page |
| Phase 7 — Bootstrap / Setup Wizard | ✅ Complete | Plan §7 | Status check, setup wizard, auto-login |
| **Polish: `as any` cleanup** | ✅ Complete | — | 10 service files cleaned, 4 necessary casts remain |
| **Polish: Users module scoping** | ✅ Complete | — | findAll/findById scoped via UserOrganization |
| **Polish: Max users enforcement** | ✅ Complete | — | checkMaxUsers() on create/invite |
| **Polish: Setup edge cases** | ✅ Complete | — | Duplicate email/slug checks, transaction safety |
| **Polish: Billing error states** | ✅ Complete | — | Loading skeletons, Stripe config error, success/cancel toasts |
| **Polish: Deferred work spec** | ✅ Complete | — | `specs/deferred-work.md` — 9 sections |

---

## Status: Offline-First POS + Sync

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `docs/superpowers/specs/2026-05-25-offline-sync-design.md` | ✅ Complete | — | Approved spec + implementation plan |
| `docs/superpowers/plans/2026-05-25-offline-sync.md` | ✅ Complete | — | 8-phase implementation plan |
| Phase 1 — Foundation (Dexie, network-status, queue) | ✅ Complete | Plan §1 | dexie 4.4.3, @serwist/turbopack 9.5.11, 6 stores, sync queue |
| Phase 2 — Backend Sync Module | ✅ Complete | Plan §2 | SyncCursor + SyncConflict models, pull/push/conflicts/health endpoints |
| Phase 3 — Sync Engine | ✅ Complete | Plan §3 | Pull/push orchestration, BroadcastChannel leader election, beforeunload warning |
| Phase 4 — POS Backend (Sales module) | ✅ Complete | Plan §4 | Sales CRUD, stock decrement/increment, products with stock endpoint |
| Phase 5 — POS Frontend | ✅ Complete | Plan §5 | Product grid, cart, payment modal, offline sale flow |
| Phase 6 — PWA + Hooks | ✅ Complete | Plan §6 | Service worker, manifest, sync indicator, conflict resolution page |
| Phase 7 — Cross-Module Reuse | ✅ Complete | Plan §7 | Suppliers, companies, taxes in sync pull, org switch handling |
| Phase 8 — Offline Authentication | ✅ Complete | Plan §8 | PIN setup (PBKDF2+salt), PIN unlock, auth flow integration |
| **Serwist Turbopack Migration** | ✅ Complete | — | Migrated from @serwist/next to @serwist/turbopack for native Turbopack support |
| **PIN PBKDF2 migration** | ✅ Complete | — | SHA-256 → PBKDF2+salt, PinUnlock/PinSetup refactored to Dialog |
| **Sync timer fix** | ✅ Complete | — | `scheduleNext()` clears old timer, prevents cascade polling (27→4 req/min) |
| **TransformInterceptor pagination fix** | ✅ Complete | — | Paginated-response detection flattens double-wrapped responses |
| **Offline PIN fallback** | ✅ Complete | — | `initAuth()` catch reads saved user + PIN when offline |

---

## Status: POS Improvements (Phase 1-3)

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `specs/2026-05-31-pos-improvements-design.md` | ✅ Complete | — | Approved design doc |
| `specs/2026-05-31-pos-improvements-plan.md` | ✅ Complete | — | 3-phase implementation plan |
| Phase 1 — Essential (models, i18n, search, stock, customer, rate, tax) | ✅ Complete | Plan §1-9 | PaymentMethod enum, 20+ i18n keys, functional search, stock validation, customer select, live exchange rate, IVA calc |
| Phase 2 — Speed (quantity input, scroll, receipt, low-stock) | ✅ Complete | Plan §10-14 | Numeric qty, cart scroll, receipt dialog, stock indicators |
| Phase 3 — Advanced (barcode code field, sale history) | ✅ Complete | Plan §15-21 | `code` field wired to sync, barcode scanner, sale history panel |

---

## Status: POS Redesign — "Compra con Detalles"

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `specs/2026-06-06-pos-redesign.md` | ✅ Complete | — | Single-column invoice layout, async customer search + quick-add, product search-first, parked orders. All 7 components created, old components removed, i18n keys, useHotkey integration |

---

## Status: Audit Fixes (React Doctor 71→73 + Code Review)

| Spec | Status | Notes |
|------|--------|-------|
| `specs/audit-reglas.md` | ✅ Complete | 14/14 High/Critical items implemented. Priority Matrix done. |
| Sprint 1 - Security blockers | ✅ Complete | Isolation bypass, PIN PBKDF2+salt, JWT secret |
| Sprint 2 - Sync engine alive | ✅ Complete | start(), beforeunload, leader election, orgId |
| Sprint 3 - Data integrity | ✅ Complete | Role @unique, refresh O(1), $transaction, DB-agnostic |
| Sprint 4 - Hardening | ✅ Complete | Rate limiting, sync roles, CORS, Prisma $extends |
| Sprint 5 - Polish | ✅ Complete | Upload endpoint, as any cleanup, health, PIN skip |
| Sprint 6 - React Doctor | ✅ Complete | reduced-motion CSS, button-has-type, array-index-key, keyboard events |

---

## Status: Deferred (see deferred-work.md)

| Spec | Status | Notes |
|------|--------|-------|
| `specs/production-deployment.md` | ⏳ Deferred | In `specs/deferred-work.md` §2 |
| `specs/testing-strategy.md` | ⏳ Deferred | In `specs/deferred-work.md` §5 |
| `specs/ci-cd-pipeline.md` | ⏳ Deferred | Covered by deferred-work §2 |
| `specs/multi-currency-venezuela.md` | ⏳ Deferred | In `specs/deferred-work.md` §8 |
| `specs/observability-monitoring.md` | ⏳ Deferred | In `specs/deferred-work.md` §7 |
| `specs/api-documentation.md` | ⏳ Deferred | In `specs/deferred-work.md` §6 |

---

---

## Status: Subscription Payments (Pago Móvil + Cash USD)

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `specs/2026-06-17-subscription-payments.md` | 🔄 In Progress | — | Replaces Stripe with Pago Móvil + Cash USD for subscriptions |
| Phase 1 — Prisma model + migration | ✅ Complete | — | SubscriptionPayment model + SQLite migration |
| Phase 2 — Backend module | ✅ Complete | — | Controller, service, DTOs, SubscriptionsModule |
| Phase 3 — Frontend billing forms | ✅ Complete | — | BillingPagoMovil, BillingCash, SlideForm method selector |
| Phase 4 — Admin review page | ✅ Complete | — | Admin approve/reject page at /admin/subscription-payments |
| Phase 5 — i18n | ✅ Complete | — | 25+ keys in es.json + en.json |

---

---

## Status: Módulo Caja (Cash Register)

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `specs/2026-07-25-modulo-caja.md` | ⬜ Not started | — | Approved spec — pending implementation plan |

---

## Legend

| Icon | Meaning |
|------|---------|
| ✅ Complete | Fully implemented and typechecked |
| 🔄 In Progress | Being worked on |
| ⏳ Deferred | Deliberately postponed (see deferred-work.md) |
| ⬜ Not started | Not yet implemented |
| ❌ Blocked | Blocked by another item |

---

## Implementation Workflow

1. Spec written → user approves → writing-plans skill creates implementation plan
2. Implementation plan → subagent-driven execution (Phase N per subagent)
3. Each phase verified: `pnpm typecheck` (0 errors) + optional runtime test
4. ORCHESTRATOR.md updated with phase completion status
