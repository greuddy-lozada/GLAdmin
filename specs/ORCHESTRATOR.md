# Spec Orchestrator

Master tracker for all specs, implementation plans, and their completion status.

---

## Status: Multi-Tenant SaaS

| Spec | Status | Plan | Notes |
|------|--------|------|-------|
| `specs/multi-tenant-evaluation.md` | ✅ Complete | — | Gap analysis that led to the design |
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
| Phase 1 — Foundation (Dexie, network-status, queue) | ✅ Complete | Plan §1 | dexie 4.4.3, @serwist/next 9.5.11, 6 stores, sync queue |
| Phase 2 — Backend Sync Module | ✅ Complete | Plan §2 | SyncCursor + SyncConflict models, pull/push/conflicts/health endpoints |
| Phase 3 — Sync Engine | ✅ Complete | Plan §3 | Pull/push orchestration, BroadcastChannel leader election, beforeunload warning |
| Phase 4 — POS Backend (Sales module) | ✅ Complete | Plan §4 | Sales CRUD, stock decrement/increment, products with stock endpoint |
| Phase 5 — POS Frontend | ✅ Complete | Plan §5 | Product grid, cart, payment modal, offline sale flow |
| Phase 6 — PWA + Hooks | ✅ Complete | Plan §6 | Service worker, manifest, sync indicator, conflict resolution page |
| Phase 7 — Cross-Module Reuse | ✅ Complete | Plan §7 | Suppliers, companies, taxes in sync pull, org switch handling |
| Phase 8 — Offline Authentication | ✅ Complete | Plan §8 | PIN setup (SHA-256), PIN unlock, auth flow integration |
| **Serwist Turbopack Migration** | ✅ Complete | — | Migrated from @serwist/next to @serwist/turbopack for native Turbopack support |

---

## Status: Legacy Specs (from original project setup)

These specs were created during initial project scaffolding. None have been formally implemented — they represent the original vision.

| Spec | Status | Notes |
|------|--------|-------|
| `specs/production-deployment.md` | ⏳ Deferred | In `specs/deferred-work.md` §2 |
| `specs/testing-strategy.md` | ⏳ Deferred | In `specs/deferred-work.md` §5 |
| `specs/ci-cd-pipeline.md` | ⏳ Deferred | Covered by deferred-work §2 |
| `specs/multi-currency-venezuela.md` | ⏳ Deferred | In `specs/deferred-work.md` §8 |
| `specs/observability-monitoring.md` | ⏳ Deferred | In `specs/deferred-work.md` §7 |
| `specs/api-documentation.md` | ⏳ Deferred | In `specs/deferred-work.md` §6 |
| `specs/multi-tenant-design.md` | ✅ Superseded | Replaced by multi-tenant implementation |
| `specs/aceternity-sidebar-migration.md` | ✅ Complete | Sidebar implemented in layout |
| `specs/shadcn-migration.md` | ✅ Complete | shadcn v4 in use |
| `specs/design-migration.md` | ✅ Complete | Design system migrated |
| `specs/layout-fixes.md` | ✅ Complete | Layout fixes applied |
| `specs/migration-plan.md` | ✅ Complete | Migration completed |
| `specs/role-permissions.md` | ✅ Complete | Role system implemented |
| `specs/saas-auth-integration.md` | ⏳ Superseded | Superceded by multi-tenant auth |
| `docs/superpowers/specs/2026-05-23-dashboard-bento-grid-design.md` | ✅ Complete | BentoGrid implemented in dashboard |

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

opencode -s ses_1af235e89ffeDInGrNuQESgTpE