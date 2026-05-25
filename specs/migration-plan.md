# Migration Plan: Express + Vite/MobX + MUI → NestJS + Next.js + shadcn

## TL;DR

Migration from legacy Express 5 + Vite/React 16/MobX + Material-UI 4 to NestJS + Next.js App Router + Prisma + shadcn/ui + Aceternity UI. **Migration complete as of 2026-05-25.** This document now reflects the final state.

---

## Final Stack

| Layer | Technology |
|---|---|
| API Framework | NestJS |
| ORM | Prisma v6 + SQLite (dev) |
| Language | TypeScript (strict) |
| Auth | JWT + bcrypt + refresh token rotation |
| API Port | 4000 |
| Client Framework | Next.js 15+ (App Router) |
| State Management | React hooks + Context (no MobX) |
| UI Library | shadcn/ui v4 + Aceternity UI |
| Table Component | Custom DataTable (`@tanstack/react-table`) |
| Forms | SlideForm (shadcn Sheet), ConfirmDialog |
| Build Tool | Next.js built-in + Turbopack |
| Animation | `motion` (framer-motion) |
| Icons | `lucide-react` |
| Theme | `next-themes` (class strategy) |
| Dashboard Layout | Aceternity `Sidebar` (animated expand/collapse) |
| Monorepo | pnpm workspaces |
| Frontend Port | 3000 |
| i18n | Custom client i18n (es.json + en.json) |

---

## Architecture Decisions (Final)

- **Screaming Architecture**: code grouped by feature module, not by technical layer
- **Direct PrismaService usage**: simplified pattern (no IRepository abstraction). All modules except Users use PrismaService directly.
- **`AuthFactory` + `AuthService`**: token pair generation, refresh rotation, password hashing
- **JWT embeds role + email**: `AuthGuard` reads JWT payload without DB hit; `RolesGuard` reads `user.role` string
- **Dependency Injection**: all services, factories are `@Injectable()` via NestJS DI
- **Client i18n**: custom context-based system with `t()` / `tp()` hooks, JSON locale files
- **No Electron**: dropped (may revisit as separate `desktop/` package)

---

## Directory Structure

```
GLAdmin/
  pnpm-workspace.yaml
  package.json
  tsconfig.base.json
  specs/                      # This file + additional specs
  AGENTS.md                   # Project conventions for AI agent

  backend/
    package.json
    tsconfig.json
    nest-cli.json
    .env
    prisma/
      schema.prisma            # 20+ tables with multi-currency support
      seed.ts
      migrations/
    src/
      main.ts
      app.module.ts
      common/
        guards/
          auth.guard.ts        # JWT verification, reads payload (no DB hit)
          roles.guard.ts       # Reads user.role string
        interceptors/
          transform.interceptor.ts
        filters/
          http-exception.filter.ts
        decorators/
          current-user.decorator.ts
          roles.decorator.ts
          public.decorator.ts
      core/
        config/
          app.config.ts
          jwt.config.ts
      shared/
        prisma/
          prisma.service.ts
          prisma.module.ts
      modules/
        auth/                  # Login, refresh, change-password
        users/
        roles/
        customers/
        suppliers/
        companies/
        taxes/
        batches/
        products/
        stocks/
        purchase-orders/
        exchange-rates/        # Unified — replaced foreign-exchanges
        currencies/
        withholdings/

  frontend/
    package.json
    tsconfig.json
    next.config.ts
    .env.local
    src/
      app/
        layout.tsx             # Providers: I18n → Theme → Auth → Toaster
        (auth)/
          login/
            page.tsx           # Landing page with slide-panel form
        (dashboard)/
          layout.tsx           # Aceternity Sidebar + header + breadcrumbs
          page.tsx             # Redirects to /dashboard
          dashboard/
          users/
          customers/
          suppliers/
          companies/
          taxes/
          batches/
          stocks/
          products/
          purchase-orders/
          exchange-rates/
          withholdings/
          roles/
          settings/

      features/
        auth/
        users/
        customers/
        suppliers/
        companies/
        taxes/
        batches/
        stocks/
        products/
        purchase-orders/
        exchange-rates/
        withholdings/
        roles/

      components/ui/           # shadcn components + custom
        data-table.tsx         # @tanstack/react-table wrapper
        slide-form.tsx         # Sheet-based slide panel
        confirm-dialog.tsx
        role-guard.tsx         # minLevel-based access control
        striped-background.tsx # Animated login background
        // ... shadcn base components

      lib/
        api/
          api-client.ts        # Axios with refresh interceptor
        auth/
          roles.ts             # ROLE_LEVEL, hasMinLevel()
        utils/
          cn.ts

      providers/
        auth-provider.tsx      # Auth context with refresh token auto-refresh

      config/
        navigation.config.ts   # Sidebar nav with minLevel, collapsible groups

      i18n/
        locales/
          es.json
          en.json
```

---

## Database Schema (Final)

| Table | Key Relations | Notes |
|---|---|---|
| **User** | → Role | email (unique), isActive, mustChangePassword, lastLogin |
| **Role** | ← Users | Slugs: master, executive, manager, employee |
| **RefreshToken** | → User | bcrypt-hashed rotation |
| **Customer** | | Soft delete (available) |
| **Supplier** | ← Stock, PurchaseOrder | Soft delete, tax withholding agent |
| **Company** | | Hard delete |
| **Currency** | | DOP, USD, EUR |
| **ExchangeRate** | → Currency | Unified: type (official/paralelo/manual), source |
| **Product** | → Tax | Soft delete, multi-currency prices |
| **Tax** | ← Product | IVA/ISLR support |
| **Batch** | ← Stock | |
| **Stock** | → Product, Supplier, Batch, ← StockDet | |
| **StockDet** | → Stock | Entry/exit tracking |
| **PurchaseOrder** | → Supplier, ← PurchaseOrderDet, → ExchangeRate (dual) | Multi-currency (VED + USD) |
| **PurchaseOrderDet** | → PurchaseOrder, Product | |
| **Sale** | → Customer, ← SalesDet, → ExchangeRate (dual) | Multi-currency |
| **SalesDet** | → Sale, Product | |
| **AccountsPayable** | → PurchaseOrder | |
| **AccountsReceivable** | → Sale | |
| **WithholdingRecord** | → Supplier, PurchaseOrder | IVA/ISLR |
| **ProductsExchangeRates** | ↔ Product, ExchangeRate | Many-to-many |

---

## API Endpoint Reference

### Auth
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/auth/login` | Public | — | Login with email + password, returns `{ accessToken, refreshToken, expiresIn, user }` |
| GET | `/auth/me` | Bearer | — | Current authenticated user |
| POST | `/auth/refresh` | Public | — | Refresh token rotation |
| POST | `/auth/logout` | Bearer | — | Revoke current refresh token |
| POST | `/auth/change-password` | Bearer | — | Requires old + new password |

### Users
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/users` | Bearer | master, executive | Create user |
| GET | `/users` | Bearer | master, executive | List users |
| GET | `/users/:id` | Bearer | master, executive | Get user |
| PATCH | `/users/:id` | Bearer | master, executive | Update user |
| DELETE | `/users/:id` | Bearer | master | Delete user |

### Customers / Suppliers / Companies / Taxes / Batches
Standard CRUD. `DELETE` requires master. All others: view ≥40, create/edit ≥40 (customers/suppliers) or ≥60 (taxes/batches).

### Products
Same CRUD pattern. Edit ≥60. Delete master-only.

### Stocks
CRUD + nested stock details (entry/exit). Edit ≥60. Delete master-only.

### Purchase Orders
CRUD with inline line items (details array). Multi-currency (VED + USD + dual exchange rates). Edit ≥60. Delete master-only.

### Exchange Rates
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/exchange-rates` | Bearer | all | List rates |
| POST | `/exchange-rates` | Bearer | ≥40 | Create rate |
| GET | `/exchange-rates/latest` | Bearer | all | Latest BCV rate |

### Withholdings
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/withholdings` | Bearer | ≥60 | Create withholding |
| GET | `/withholdings` | Bearer | all | List withholdings |
| DELETE | `/withholdings/:id` | Bearer | master | Delete |

### Roles
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/roles` | Bearer | master, executive, manager | List all roles |
| GET | `/roles/:id` | Bearer | master, executive, manager | Get role |

### Currencies
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/currencies` | Bearer | all | List currencies |

---

## Migration Phases — Final Status

| Phase | Status | Notes |
|---|---|---|
| **0** Project Scaffolding | ✅ | pnpm workspaces, NestJS + Next.js scaffolding |
| **1** Database + Shared Backend | ✅ | Prisma schema, shared services, guards, interceptors |
| **2** Auth + Users (PoC) | ✅ | Login, JWT, roles, user CRUD. Simplified repository pattern. |
| **3** Remaining Backend Modules | ✅ | All 12+ modules. ForeignExchanges → ExchangeRates (unified). Added Withholdings. |
| **4a** Seed Data | ✅ | Realistic seed: users, currencies, rates, taxes, products, customers, suppliers, POs |
| **4b** Integration Tests | 🔲 | Deferred |
| **5** Frontend Scaffolding + Auth | ✅ | API client, auth provider, login page, dashboard layout, sidebar |
| **5b** Frontend i18n | ✅ | es.json + en.json, `useI18n()` hook across all pages |
| **6** Generic UI Components | ✅ | DataTable (TanStack), SlideForm (Sheet), ConfirmDialog |
| **7** Users Feature (Template) | ✅ | Model → service → hook → component pattern established |
| **8** Remaining Feature Pages | ✅ | 10+ feature pages following the pattern |
| **9** Migration Cleanup | ✅ | Legacy code removed, mobile responsive, breadcrumbs, 404/error pages, audit completed |
| **10** Final Polish | ✅ | typecheck, lint, E2E smoke test verified |

### Post-Migration Enhancements

| Feature | Date | Details |
|---|---|---|
| SaaS auth upgrade | 2026-05-25 | Refresh token rotation, email login, change-password |
| Role-based access | 2026-05-25 | ROLE_LEVEL hierarchy, RoleGuard component, minLevel on nav |
| Unified ExchangeRate | 2026-05-24 | Merged ForeignExchange + ExchangeRate into single model |
| Multi-currency POs/Sales | 2026-05-24 | Dual exchange rate (calculation + official) on financial records |
| Collapsible sidebar groups | 2026-05-25 | Groups collapsed by default, expand on click |
| Ventas (Sales) nav group | 2026-05-25 | Customers moved under Ventas group |
| Icon-only category headers | 2026-05-25 | Group headers show icons; items in labeled groups are text-only |
| Login page redesign | 2026-05-25 | Landing page with StripedBackground + slide panel |
| Font upgrade | 2026-05-25 | Plus Jakarta Sans (headings) + Inter (body) |

---

## Role Hierarchy

| Role | Level | Slug | Access |
|---|---|---|---|
| Master | 100 | `master` | Full access, delete everywhere |
| Executive | 80 | `executive` | Admin modules (users, companies) + operational |
| Manager | 60 | `manager` | Operational CRUD (products, POs, taxes, etc.) |
| Employee | 40 | `employee` | Read-mostly, limited writes (customers, suppliers, rates) |

Implementation: `ROLE_LEVEL` map in `frontend/src/lib/auth/roles.ts`, `<RoleGuard minLevel={N}>` component, `hasMinLevel()` helper. Nav items use `minLevel` instead of `roles[]`.

---

## Sidebar Structure

```
Dashboard        [icon]  minLevel=40
Compras ▼        [icon]
  Proveedores             minLevel=40
  Pedidos                 minLevel=40
  Retenciones             minLevel=40
  Tasas BCV               minLevel=40
Ventas ▼         [icon]
  Clientes                minLevel=40
Inventario ▼     [icon]
  Productos               minLevel=40
  Impuestos               minLevel=40
  Lotes                   minLevel=40
  Inventario              minLevel=40
Admin ▼          [icon]
  Usuarios                minLevel=80
  Empresas                minLevel=80
  Roles                   minLevel=60
Config ▼         [icon]
  Configuración           minLevel=60
```

Groups are collapsed by default. Only group headers show icons; items are text-only.

---

## Implementation Notes

- **Seed user**: email `admin@gladmin.com` / userName `glozada` / password `000000` (role: Master)
- **API base URL**: `http://localhost:4000/api`
- **Prisma**: v6 (not v7). Run seed via `cd backend && pnpm exec tsx prisma/seed.ts`
- **Migrations**: Already applied. Run `prisma db push` for schema sync, `prisma migrate dev --name <name>` for new migrations.
- **Legacy directories**: `api/` and `client/` were deleted on 2026-05-23 (Phase 9.12)
- **Electron**: Dropped. If needed, create a separate `desktop/` package wrapping the Next.js build
- **Tests**: Unit tests deferred. Integration tests deferred. Manual E2E verified.
- **Remaining (low priority)**: `@MinLevel()` backend decorator (currently using `@Roles()` strings), accessibility audit, Lighthouse score
