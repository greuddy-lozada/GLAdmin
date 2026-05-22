# Migration Plan: Express + Vite/MobX → NestJS + Next.js

## TL;DR

Replace the legacy Express 5 + Vite/React 16/MobX stack with a TypeScript-first NestJS backend and Next.js App Router frontend, using feature-based modules (Screaming Architecture), dependency injection, repository pattern for data access, and factory pattern for domain object creation.

---

## Current Stack (Legacy)

| Layer | Technology |
|---|---|
| API Framework | Express 5 |
| ORM | Sequelize 6 + SQLite (dev) / MySQL (prod) |
| Language | JavaScript (no TypeScript) |
| Auth | Token-based (bcrypt + AuthToken model stored in DB) |
| API Port | 9000 |
| Client Framework | React 16.14 |
| State Management | MobX 5 |
| UI Library | Material-UI 4 |
| Table Component | material-table 1.69.3 |
| Build Tool | Vite 5 |
| Desktop Shell | Electron 8 |
| Client Port | 3000 |
| i18n | Ad-hoc bilingual en/es response fields |

## Target Stack (New)

| Layer | Technology |
|---|---|
| API Framework | NestJS |
| ORM | Prisma (with repository pattern abstraction) |
| Language | TypeScript (strict) |
| Auth | JWT + bcrypt |
| API Port | 4000 |
| Client Framework | Next.js 14+ (App Router) |
| State Management | React hooks + Context (no MobX) |
| UI Library | Material-UI 6 |
| Table Component | Custom DataTable (via MUI `@mui/x-data-grid` or custom) |
| Build Tool | Next.js built-in |
| Desktop Shell | Dropped (for now) |
| Client Port | 3000 |
| i18n | NestJS i18n service with JSON locale files (en/es) |
| Monorepo | pnpm workspaces |

---

## Architecture Decisions

- **Screaming Architecture**: code grouped by business domain/feature, not by technical layer
- **Repository Pattern**: `IRepository<T>` interface abstracts data access; Prisma implements it → swapping ORMs means new repository implementations only
- **Factory Pattern**: domain factories (e.g., `UserFactory`, `PurchaseOrderFactory`) encapsulate object creation logic
- **Dependency Injection**: all services, repositories, factories are `@Injectable()` via NestJS DI
- **Proper i18n**: centralized locale JSON files + NestJS `I18nService` instead of ad-hoc bilingual response fields
- **Dynamic Storage**: database abstraction via repository interfaces — the app does not depend directly on Prisma or any specific ORM

---

## Directory Structure

```
GLAdmin/
  pnpm-workspace.yaml
  package.json                    # Root: workspace scripts, shared devDeps
  tsconfig.base.json              # Shared TypeScript config
  .prettierrc
  .eslintrc.cjs
  specs/                          # This file
  .gitignore

  api/                            # KEPT as reference during migration
  client/                         # KEPT as reference during migration

  backend/
    package.json
    tsconfig.json
    tsconfig.build.json
    nest-cli.json
    .env
    .env.example
    prisma/
      schema.prisma               # All 18 tables mapped from existing migrations
      seed.ts
    src/
      main.ts
      app.module.ts

      common/
        guards/
          auth.guard.ts           # JWT verification guard (can be global)
          roles.guard.ts          # Role-based access control
        interceptors/
          transform.interceptor.ts # Standardizes { data, message, statusCode }
          logging.interceptor.ts
        filters/
          http-exception.filter.ts
        pipes/
          validation.pipe.ts      # class-validator integration
        decorators/
          current-user.decorator.ts
          roles.decorator.ts
          public.decorator.ts     # Marks routes as public (skip auth guard)

      core/
        config/
          app.config.ts
          database.config.ts
          jwt.config.ts
          i18n.config.ts
        logger/
          app-logger.service.ts
          logger.module.ts

      shared/
        prisma/
          prisma.service.ts
          prisma.module.ts
        i18n/
          i18n.service.ts
          i18n.module.ts
          locales/
            en.json
            es.json
        interfaces/
          repository.interface.ts # Generic IRepository<T>
          factory.interface.ts    # Generic IFactory<T, DTO>
        constants/
          messages.constant.ts
        utils/
          hash.util.ts
          token.util.ts

      modules/
        auth/
          auth.module.ts
          auth.controller.ts
          auth.service.ts
          auth.factory.ts
          auth.service.interface.ts
          dto/
            login.dto.ts
            login-response.dto.ts
          entities/
            auth-token.entity.ts
          specs/
            auth.service.spec.ts
            auth.controller.spec.ts

        users/
          users.module.ts
          users.controller.ts
          users.service.ts
          user.factory.ts
          dto/
            create-user.dto.ts
            update-user.dto.ts
            user-response.dto.ts
            user-query.dto.ts
          entities/
            user.entity.ts
          repository/
            user.repository.interface.ts
            user.repository.ts
          specs/
            users.service.spec.ts
            users.controller.spec.ts

        roles/
          roles.module.ts
          roles.controller.ts
          roles.service.ts
          role.factory.ts
          dto/
            create-role.dto.ts
            role-response.dto.ts
          repository/
            role.repository.interface.ts
            role.repository.ts
          specs/
            roles.service.spec.ts

        customers/
          (same module structure as users/)

        suppliers/
          (same module structure as users/)

        companies/
          (same module structure as users/)

        taxes/
          (same module structure as users/)

        batches/
          (same module structure as users/)

        stocks/
          (same module structure as users/)

        products/
          (same module structure as users/)

        purchase-orders/
          (same module structure as users/)

        foreign-exchanges/
          (same module structure as users/)

  frontend/
    package.json
    tsconfig.json
    next.config.ts
    .env.local
    .env.local.example
    public/
      assets/
        images/
          gl.png
          no-image.png
        fonts/
          (preserve existing custom fonts from client/)
    src/
      app/
        layout.tsx                  # Root: providers, theme, fonts
        page.tsx                    # Redirects to /login
        loading.tsx

        (auth)/
          layout.tsx
          login/
            page.tsx

        (dashboard)/
          layout.tsx                # AppShell: Sidebar + Header + <Outlet>
          page.tsx                  # Redirects to /dashboard
          dashboard/
            page.tsx
          users/
            page.tsx                # List (DataTable)
            new/
              page.tsx              # Create form (slide or page)
            [id]/
              page.tsx              # Edit form (slide or page)
          customers/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          suppliers/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          companies/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          taxes/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          batches/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          stocks/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          products/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          purchase-orders/
            page.tsx
            new/
              page.tsx
            [id]/
              page.tsx
          foreign-exchanges/
            page.tsx
          settings/
            page.tsx

      features/
        auth/
          components/
            login-form.tsx
            protected-route.tsx
          hooks/
            use-auth.ts
          services/
            auth.service.ts
          models/
            auth.model.ts
            login-request.model.ts
            login-response.model.ts

        users/
          components/
            user-table.tsx
            user-form.tsx
          hooks/
            use-users.ts
          services/
            user.service.ts
          models/
            user.model.ts
            create-user-request.model.ts
            update-user-request.model.ts

        customers/
          (same pattern as users/)

        suppliers/
          (same pattern as users/)

        companies/
          (same pattern as users/)

        taxes/
          (same pattern as users/)

        batches/
          (same pattern as users/)

        stocks/
          components/
            stock-table.tsx
            stock-form.tsx
            stock-detail-table.tsx
          hooks/
            use-stocks.ts
          services/
            stock.service.ts
          models/
            stock.model.ts
            stock-det.model.ts

        products/
          (same pattern as users/)

        purchase-orders/
          components/
            purchase-order-table.tsx
            purchase-order-form.tsx
            purchase-order-detail-table.tsx
          hooks/
            use-purchase-orders.ts
          services/
            purchase-order.service.ts
          models/
            purchase-order.model.ts
            purchase-order-det.model.ts

        foreign-exchanges/
          (same pattern as users/)

      components/
        ui/
          data-table.tsx              # Generic CRUD table replacement
          data-table-toolbar.tsx
          slide-form.tsx              # Generic slide-in form drawer
          confirm-dialog.tsx
          loading-spinner.tsx
          empty-state.tsx
          page-header.tsx
          search-input.tsx
        layout/
          app-sidebar.tsx
          app-header.tsx
          app-shell.tsx
          nav-item.tsx

      lib/
        api/
          api-client.ts              # Axios/fetch wrapper with auth interceptor
          api-hooks.ts               # Generic hooks: useList, useGet, useCreate, etc.
        utils/
          format-currency.ts
          format-date.ts
          cn.ts                      # className utility
          validation.ts

      providers/
        theme-provider.tsx
        auth-provider.tsx

      config/
        roles.config.ts              # master / admin / employee route configs
        navigation.config.ts         # Sidebar nav items with icons
        api.config.ts

      styles/
        globals.css
        theme.ts                     # MUI theme (migrate from client/src/Theme.js)
```

---

## Database Schema (18 tables)

Migrate from Sequelize migrations to Prisma schema:

| Table | Key Relations |
|---|---|
| **User** | → Role (idRole) |
| **Role** | ← Users |
| **AuthToken** | → User (UserId) |
| **Permission** | (standalone) |
| **Customer** | → Sale |
| **Supplier** | ← Stock, PurchaseOrder |
| **Company** | ← License |
| **License** | → Company |
| **Currency** | ← ForeignExchange |
| **Module** | (standalone) |
| **Product** | → Tax, ↔ ForeignExchange (via ProductsForeignExchanges) |
| **Tax** | ← Product |
| **Batch** | ← Stock |
| **Stock** | → Product, Supplier, Batch, ← StockDet |
| **StockDet** | → Stock |
| **PurchaseOrder** | → Supplier, ← PurchaseOrderDet |
| **PurchaseOrderDet** | → PurchaseOrder, Product |
| **Sale** | → Customer, ← SalesDet |
| **SalesDet** | → Sale, Product |
| **AccountsPayable** | → PurchaseOrder |
| **AccountsReceivable** | → Sale |
| **ForeignExchange** | → Currency, ↔ Product (via ProductsForeignExchanges) |
| **ProductsForeignExchanges** | → Product, ForeignExchange |

---

## Route Mapping — Old → New

| Old Express Route | New NestJS Module | Old MobX Store | New Next.js Route |
|---|---|---|---|
| `POST /auth/login` | `auth` | `authStore` | `/(auth)/login` |
| `DELETE /auth/logout` | `auth` | `authStore` | — (API only) |
| `GET /auth/me` | `auth` | `authStore` | — (API only) |
| `GET/POST/PUT/DELETE /users/*` | `users` | `userStore` | `/(dashboard)/users` |
| `GET/POST/PUT/DELETE /customers/*` | `customers` | `customerStore` | `/(dashboard)/customers` |
| `GET/POST/PUT/DELETE /suppliers/*` | `suppliers` | `supplierStore` | `/(dashboard)/suppliers` |
| `GET/POST/PUT/DELETE /companies/*` | `companies` | `companyStore` | `/(dashboard)/companies` |
| `GET/POST/PUT/DELETE /taxes/*` | `taxes` | `taxStore` | `/(dashboard)/taxes` |
| `GET/POST/PUT/DELETE /batches/*` | `batches` | `batchStore` | `/(dashboard)/batches` |
| `GET/POST/PUT/DELETE /roles/*` | `roles` | `roleStore` | `/(dashboard)/roles` |
| `GET/POST/PUT/DELETE /stocks/*` | `stocks` | `stockStore` | `/(dashboard)/stocks` |
| `GET/POST/PUT/DELETE /purchase-orders/*` | `purchase-orders` | `purchaseOrderStore` | `/(dashboard)/purchase-orders` |
| `GET/POST/PUT/DELETE /products/*` | `products` | `productStore` | `/(dashboard)/products` |
| `GET/POST /foreign-exchanges/*` | `foreign-exchanges` | `sttForeignExchangeStore` | `/(dashboard)/foreign-exchanges` |

---

## API Contract Patterns

### Old Pattern (ad-hoc bilingual)
```json
{
  "record": { "id": 1, "firstName": "John" },
  "en": "User has been created",
  "es": "Usuario creado"
}
```

### New Pattern (standardized + i18n)
```json
// 201 POST /users
{
  "data": { "id": 1, "firstName": "John", "lastName": "Doe", ... },
  "message": "Usuario creado exitosamente",
  "statusCode": 201
}

// 400 Validation Error
{
  "data": null,
  "message": "Error de validación",
  "errors": [
    { "field": "userName", "constraints": ["El nombre de usuario ya existe"] }
  ],
  "statusCode": 400
}

// 200 List
{
  "data": [ ... ],
  "meta": { "total": 50, "page": 1, "pageSize": 20 },
  "message": null,
  "statusCode": 200
}
```

---

## Phases and Microtasks

---

### Phase 0 — Project Scaffolding

**Goal**: Initialize the monorepo, install tooling, verify both apps can boot.

#### Microtasks

- [ ] **0.1** Create `pnpm-workspace.yaml` at repo root defining `backend/` and `frontend/` as workspace packages
- [ ] **0.2** Create root `package.json` with workspace scripts (`dev`, `build`, `lint`, `typecheck`, `test`)
- [ ] **0.3** Create root `tsconfig.base.json` with shared TypeScript strict settings
- [ ] **0.4** Create root `.prettierrc` and `.eslintrc.cjs` with consistent rules
- [ ] **0.5** Scaffold NestJS project in `backend/` using `nest new backend --strict --package-manager pnpm` (or manual setup)
      - Install: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `prisma`, `@prisma/client`, `i18n` packages
      - Install dev: `prisma`, `@types/bcrypt`, `@types/passport-jwt`, `jest`, `ts-jest`
- [ ] **0.6** Scaffold Next.js project in `frontend/` using `create-next-app@latest frontend --typescript --eslint --app --src-dir --import-alias "@/*"`
      - Install: `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, `@mui/x-data-grid`, `axios`
- [ ] **0.7** Update root `.gitignore` for node_modules, `.env`, dist, `.next`, prisma sqlite files
- [ ] **0.8** Verify: `pnpm install` at root resolves both packages
- [ ] **0.9** Verify: `pnpm --filter backend start:dev` boots NestJS on port 4000
- [ ] **0.10** Verify: `pnpm --filter frontend dev` boots Next.js on port 3000

---

### Phase 1 — Database Schema + Shared Backend Layer

**Goal**: Write the full Prisma schema from existing migrations, create the shared NestJS infrastructure (Prisma service, repository interface, i18n service, guards, interceptors, pipes, decorators).

#### Microtasks

- [ ] **1.1** Write `backend/prisma/schema.prisma` with all 18 tables, relations, and enums (mirroring Sequelize models)
      - Use `datasource db` with provider `sqlite` for dev (with fallback env var for mysql)
      - Map tables: User, Role, AuthToken, Permission, Customer, Supplier, Company, License, Currency, Module, Product, Tax, Batch, Stock, StockDet, PurchaseOrder, PurchaseOrderDet, Sale, SalesDet, AccountsPayable, AccountsReceivable, ForeignExchange, ProductsForeignExchanges
- [ ] **1.2** Create `backend/prisma/seed.ts` that seeds roles (master/admin/employee), currencies, taxes, foreign exchanges, and a default admin user (mirroring `api/seeders/`)
- [ ] **1.3** Create `shared/prisma/prisma.service.ts` — extends `PrismaClient`, handles connection lifecycle (onModuleInit, enableShutdownHooks)
- [ ] **1.4** Create `shared/prisma/prisma.module.ts` — exports `PrismaService` globally
- [ ] **1.5** Create `shared/interfaces/repository.interface.ts` — generic `IRepository<T>` with:
      - `findAll(filter?)`, `findById(id)`, `findOne(filter)`, `create(data)`, `update(id, data)`, `delete(id)`, `count(filter?)`
- [ ] **1.6** Create `shared/interfaces/factory.interface.ts` — generic `IFactory<T, DTO>` with:
      - `createFromDto(dto: DTO): T`, optionally `createManyFromDto(dtos: DTO[]): T[]`
- [ ] **1.7** Create `shared/i18n/locales/en.json` — all English messages extracted from old controllers
- [ ] **1.8** Create `shared/i18n/locales/es.json` — all Spanish messages extracted from old controllers
- [ ] **1.9** Create `shared/i18n/i18n.service.ts` — `translate(key: string, lang?: string): string` and `translateWithParams(key, params, lang?): string`
- [ ] **1.10** Create `shared/i18n/i18n.module.ts` — exports `I18nService`
- [ ] **1.11** Create `common/guards/auth.guard.ts` — JWT strategy guard using passport-jwt, reads token from `Authorization: Bearer <token>` header
- [ ] **1.12** Create `common/guards/roles.guard.ts` — checks `req.user.role.slug` against allowed roles from `@Roles()` decorator metadata
- [ ] **1.13** Create `common/decorators/roles.decorator.ts` — `@Roles('master', 'admin')` sets metadata
- [ ] **1.14** Create `common/decorators/current-user.decorator.ts` — param decorator to inject `req.user`
- [ ] **1.15** Create `common/decorators/public.decorator.ts` — marks a route as public (skips auth guard), uses `SetMetadata`
- [ ] **1.16** Create `common/interceptors/transform.interceptor.ts` — wraps all responses in `{ data, message, statusCode }`, uses i18n service for messages
- [ ] **1.17** Create `common/filters/http-exception.filter.ts` — catches all exceptions, returns `{ data: null, message, errors, statusCode }`
- [ ] **1.18** Create `common/pipes/validation.pipe.ts` — uses `ValidationPipe` from `@nestjs/common` with whitelist, forbidNonWhitelisted, transform, and custom error formatting
- [ ] **1.19** Create `core/config/` files — `app.config.ts`, `database.config.ts`, `jwt.config.ts` using `@nestjs/config`
- [ ] **1.20** Register all shared providers in `app.module.ts` (PrismaModule, I18nModule, global guards, interceptors, pipes)
- [ ] **1.21** Run `npx prisma generate` and `npx prisma db push` to verify schema compiles
- [ ] **1.22** Verify: backend boots with `nest start --watch`, prisma connects to sqlite

---

### Phase 2 — Auth Module + User Module (Proof of Concept) ✅

**Goal**: Build auth and users modules end-to-end. This serves as the template for all other modules.  
**Status**: Completed. Auth and Users modules built, tested with curl, login/me/logout all work. (Repository interfaces were simplified to direct PrismaService usage per module — the full IRepository pattern was applied to Users module, other modules use PrismaService directly.)

#### Microtasks (completed, with detail notes)

- **Users module**: `Entity`, `CreateUserDto`, `UpdateUserDto`, `UserResponseDto` (with password @Exclude), `UserQueryDto`, `UsersController`, `UsersService`, `UsersModule`, `UserFactory` (bcrypt), `UserRepository` (full IRepository implementation)
- **Auth module**: `LoginDto`, `LoginResponseDto`, `AuthController`, `AuthService`, `AuthFactory` (JWT), `AuthModule`
- **Globals**: `AuthGuard` (global, opt-out via @Public), `RolesGuard`, `TransformInterceptor`, `HttpExceptionFilter`, `@CurrentUser`, `@Roles`, `@Public` decorators
- **Config**: `app.config.ts`, `database.config.ts`, `jwt.config.ts`
- **Verification**: Login + /me + /users CRUD tested with curl

---

### Phase 3 — Remaining Backend Modules ✅

**Goal**: Generate all remaining feature modules.  
**Status**: All 11 modules built (Roles, Customers, Suppliers, Companies, Taxes, Batches, Products, Stocks, PurchaseOrders, ForeignExchanges, Currencies). All endpoints verified.

#### Microtasks ✅

All modules follow the same pattern (entity → DTOs → service → controller → module). Note: all except Users use PrismaService directly (simplified pattern) rather than the full IRepository/IFactory.

| Module | Routes | Special Notes |
|--------|--------|--------------|
| Roles | GET /roles, GET /roles/:id | Read-only |
| Customers | POST/GET/GET:PATCH/DELETE | Soft delete (available: false) |
| Suppliers | POST/GET/GET/PATCH/DELETE | Soft delete |
| Companies | POST/GET/GET/PATCH/DELETE | Hard delete |
| Taxes | POST/GET/GET/PATCH/DELETE | Hard delete |
| Batches | POST/GET/GET/PATCH/DELETE | Hard delete |
| Products | POST/GET/GET/PATCH/DELETE | Soft delete, includes tax relation |
| Stocks | POST/GET/GET/PATCH/DELETE | Soft delete, 4 relation includes |
| Purchase Orders | POST/GET/GET/PATCH/DELETE | Cascading delete, nested details via Prisma relations |
| Foreign Exchanges | POST/GET/GET/PATCH/DELETE | Hard delete, includes currency relation |
| Currencies | GET /currencies, GET /currencies/:id | Read-only (added for frontend ForeignExchanges form) |

#### Backend Verification ✅
- All 13 modules (12 original + Currencies) registered in `app.module.ts`
- All compile with `tsc --noEmit`
- All lint clean (no errors, pre-existing warnings only)
- All endpoints return seeded data correctly

---

### Phase 4 — Backend Testing + Seed Data

**Goal**: Ensure quality with tests and populate development database with representative seed data.  
**Note**: Integration tests deferred to after all frontend pages are built (Phase 4b).

#### Microtasks — Seed Data ✅
- [x] **4.7** Update `backend/prisma/seed.ts` to include realistic seed data:
      - 3 roles (master, admin, employee)
      - 1 admin user (Greuddy Lozada / glozada / 000000)
      - 3 currencies (DOP, USD, EUR)
      - 2 taxes (ITBIS 18%, Exento)
      - 5 products (Laptop HP, Monitor LG, Teclado Redragon, Mouse Logitech, Webcam HD)
      - 2 customers (Juan Pérez, María González)
      - 2 suppliers (Distribuidora Nacional, Importadora del Caribe)
      - 1 company (GLAdmin Solutions SRL)
      - 2 batches (LOTE-2025-001, LOTE-2025-002)
      - 3 stock entries with stock details
      - 1 purchase order with 2 line items
      - 1 foreign exchange rate (60.50 DOP/USD)
- [x] **4.8** Run seed: `pnpm exec tsx prisma/seed.ts` from `backend/`

#### Microtasks — Integration Tests (pending)
- [ ] **4.1** Write integration tests for auth flow: login → access protected route → logout → access denied
- [ ] **4.2** Write integration tests for user CRUD with auth
- [ ] **4.3** Write integration tests for products with tax and foreign exchange relations
- [ ] **4.4** Write integration tests for purchase orders with details creation
- [ ] **4.5** Write integration tests for stocks with stock details (entry/exit)
- [ ] **4.6** Write integration tests for role-based access: master can access all, employee restricted
- [ ] **4.9** Verify: `pnpm --filter backend test` passes (unit + integration)
- [ ] **4.10** Verify: `pnpm --filter backend test:e2e` passes (if e2e tests defined)

---

### Phase 5 — Frontend Scaffolding + Auth ✅

**Goal**: Set up the Next.js project structure, create the API client layer, build the auth feature (login, token management, protected routes), and create the dashboard layout with sidebar navigation.

#### Microtasks ✅

- [x] **5.1** Create `lib/api/api-client.ts` — Axios instance with:
      - `baseURL` from env `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
      - Request interceptor that attaches `Authorization: Bearer <token>` from cookie/localStorage
      - Response interceptor that unwraps `{ data, message }` and handles 401 (redirect to login)
- [x] **5.3** Create `features/auth/models/auth.model.ts` — TypeScript interfaces: `LoginRequest`, `LoginResponse`, `AuthUser`, `AuthTokens`
- [x] **5.4** Create `features/auth/services/auth.service.ts` — `login(userName, password)`, `logout()`, `getMe()`
- [x] **5.5** Create `providers/auth-provider.tsx` — React context that:
      - Stores user + token in state
      - On mount: reads token from `localStorage`, calls `/auth/me` to validate
      - Exposes: `user`, `token`, `isAuthenticated`, `isLoading`, `login()`, `logout()`
- [x] **5.8** Create `features/auth/components/login-form.tsx` — MUI form with userName + password fields, submit calls `auth.login()`, shows errors (refactored to use `useI18n()`)
- [x] **5.10** Create `app/(auth)/login/page.tsx` — renders `<LoginForm />`
- [x] **5.11** Create `config/navigation.config.ts` — sidebar menu items with `key` field for i18n
- [x] **5.12** Create `config/roles.config.ts` — role definitions: master, admin, employee with permitted module slugs
- [x] **5.16** Create `app/(dashboard)/layout.tsx` — wraps children in sidebar layout, checks auth guard (refactored to use `useI18n()` for nav labels and logout)
- [x] **5.17** Create `app/(dashboard)/page.tsx` — redirects to `/dashboard`
- [x] **5.18** Create `app/(dashboard)/dashboard/page.tsx` — dashboard with 4 summary stat cards (refactored to use `useI18n()`)
- [x] **5.20** Create `providers/theme-provider.tsx` — wraps children in `ThemeProvider` with custom theme
- [x] **5.21** Create `app/layout.tsx` — root layout with `ThemeProvider` + `AuthProvider` + `I18nProvider`
- [x] **5.23** Verify: `pnpm --filter frontend dev` compiles without errors (Next.js 16 Turbopack)

---

### Phase 6 — Generic UI Components ✅

**Goal**: Build the reusable CRUD components that all feature pages will use.

#### Microtasks ✅

- [x] **6.1** Create `components/ui/data-table.tsx` — generic DataTable with:
      - Configurable columns (field, headerName, render function)
      - Actions column (edit, delete buttons)
      - Loading state + empty state
      - Pagination (server-side configurable)
- [x] **6.3** Create `components/ui/slide-form.tsx` — MUI Drawer panel that:
      - Slides in from right
      - Contains form children
      - Title, close button
      - Loading state
- [x] **6.4** Create `components/ui/confirm-dialog.tsx` — reusable confirmation dialog: title, message, confirm/cancel buttons, destructive variant
- [x] **6.6** Create `components/ui/index.ts` — barrel export for all UI components

---

### Phase 7 — Frontend Users Feature (Template) ✅

**Goal**: Build the users feature page fully to establish the pattern all other features will follow.

#### Microtasks ✅

- [x] **7.1** Create `features/users/models/user.model.ts` — `User` interface, `CreateUserRequest`, `UpdateUserRequest` matching backend DTOs
- [x] **7.2** Create `features/users/services/user.service.ts` — `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- [x] **7.3** Create `features/users/hooks/use-users.ts` — hook exposing `users`, `loading`, `error`, `loadUsers`, `createUser`, `updateUser`, `deleteUser`
- [x] **7.4-7.6** Create `features/users/components/users-page.tsx` — unified component with:
      - DataTable + SlideForm + ConfirmDialog (inline, not separate form/table components)
      - Role dropdown fetched from `/roles` via `apiClient`
      - Now refactored to use `useI18n()` for all labels
- [x] **7.7** Create `app/(dashboard)/users/page.tsx` — thin route wrapping UsersPage

---

### Phase 5b — Frontend i18n Infrastructure ✅

**Goal**: Set up a client-side i18n system mirroring the backend pattern.

#### Microtasks ✅

- [x] **5b.1** Create `i18n/locales/es.json` — Spanish translations for all modules (common, auth, dashboard, nav, users, customers, suppliers, companies, products, taxes, batches, stocks, purchaseOrders, foreignExchanges, roles, settings)
- [x] **5b.2** Create `i18n/locales/en.json` — English translations mirroring structure
- [x] **5b.3** Create `i18n/i18n.service.ts` — `translate(key, lang)`, `translateWithParams(key, params, lang)` functions matching backend I18nService pattern
- [x] **5b.4** Create `i18n/i18n-provider.tsx` — React context providing `{ t, tp, locale, setLocale }` via `useI18n()` hook
- [x] **5b.5** Create `i18n/index.ts` — barrel export
- [x] **5b.6** Update `app/layout.tsx` — wrap with `I18nProvider` (outermost, before ThemeProvider + AuthProvider)

### Phase 8 — Remaining Frontend Feature Pages ✅

**Goal**: Build the remaining 10 feature pages following the users pattern and i18n setup.

#### Microtasks ✅

- [x] **8.1** Build **Customers** feature: model, service, hooks, component with DataTable/SlideForm/ConfirmDialog, route page
- [x] **8.2** Build **Suppliers** feature: model, service, hooks, component, route page
- [x] **8.3** Build **Companies** feature: model, service, hooks, component, route page
- [x] **8.4** Build **Taxes** feature: model, service, hooks, component, route page
- [x] **8.5** Build **Batches** feature: model, service, hooks, component, route page
- [x] **8.6** Build **Products** feature: model, service, hooks, component (product-form with tax dropdown from `/taxes`), route page
- [x] **8.7** Build **Stocks** feature: model, service, hooks, component (stock-form with product/supplier/batch dropdowns), route page
- [x] **8.8** Build **Purchase Orders** feature: model, service, hooks, component (po-form with inline details array — add/remove product rows), route page
- [x] **8.9** Build **Roles** feature: model, service, hooks, component (read-only DataTable, no create/edit/delete), route page
- [x] **8.10** Build **Foreign Exchanges** feature: model, service, hooks, component (with currency dropdown from `/currencies`), route page
- [x] **8.10b** Add **GET /currencies** backend endpoint (read-only, follows Roles module pattern), register in `app.module.ts`

Each microtask includes:
- Model interfaces (entity + create/update request)
- Service with CRUD API calls
- Hook with CRUD state management
- Unified page component with DataTable + SlideForm + ConfirmDialog
- All labels via `useI18n()` (t and tp functions)
- Thin route page re-exporting the component
- All use Spanish locale keys from `es.json`

---

### Phase 9 — Migration Cleanup

**Goal**: Port remaining edge cases, remove legacy code, finalize testing.

#### Microtasks

- [ ] **9.1** Port **Dashboard** page — summary cards, charts (migrate from `client/src/pages/Dashboard.js` + `client/src/components/Charts/Deposits.js`)
- [ ] **9.2** Port **Welcome/Frame** pages if any unique layout logic remains
- [ ] **9.3** Add role-based filtering to all feature pages (master sees all, admin sees all, employee sees limited)
- [ ] **9.4** Verify all pages have proper loading, empty, and error states
- [ ] **9.5** Add **404** page (`app/not-found.tsx`)
- [ ] **9.6** Add **error** boundary (`app/error.tsx`)
- [ ] **9.7** Verify mobile/responsive layout for sidebar + data table
- [ ] **9.8** Add **breadcrumbs** component and wire into page-header
- [ ] **9.9** Audit all legacy API endpoints in `api/routes/` and `api/controllers/` against new endpoints — ensure full coverage
- [ ] **9.10** Audit all legacy MobX stores against new feature hooks — ensure all state management is covered
- [ ] **9.11** Audit all legacy axios.js service calls against new feature services
- [ ] **9.12** Archive `api/` and `client/` directories (or delete if confirmed)

---

### Phase 10 — Final Polish and Verification

**Goal**: Run full lint, type-check, test suite, and end-to-end verification across the monorepo.

#### Microtasks

- [ ] **10.1** Run `pnpm -r typecheck` across monorepo — fix any TypeScript errors
- [ ] **10.2** Run `pnpm -r lint` across monorepo — fix any lint errors
- [ ] **10.3** Run `pnpm -r test` across monorepo — all unit + integration tests pass
- [ ] **10.4** Run full manual E2E smoke test:
      - Start backend: `pnpm --filter backend start:dev`
      - Seed database: `npx prisma db seed`
      - Start frontend: `pnpm --filter frontend dev`
      - Visit `http://localhost:3000/login` → login with admin credentials
      - Navigate to each feature page → verify CRUD works
      - Verify role-based restrictions (login as employee, verify limited access)
      - Test logout → redirected to login
      - Test direct URL access without auth → redirected to login
- [ ] **10.5** Run Lighthouse/accessibility check on main pages (login, dashboard, users)
- [ ] **10.6** Verify backend API with curl/httpie on all endpoints
- [ ] **10.7** Check that .env.example and .env.local.example are documented
- [ ] **10.8** Update root README with new architecture overview and setup instructions
- [ ] **10.9** Final cleanup: remove unused dependencies, unused files, consolidate configs

---

## Verification Criteria

Each phase must be verified before proceeding to the next:

| Phase | Verification |
|---|---|
| Phase 0 | `pnpm install` succeeds, both apps boot |
| Phase 1 | Prisma schema compiles, backend boots with shared providers |
| Phase 2 | Auth + Users CRUD works end-to-end |
| Phase 3 | All 12 backend modules registered |
| Phase 4 | Seed data populates DB (integration tests pending) |
| Phase 5 | Login/logout flow works, protected routes redirect, sidebar renders |
| Phase 5b | Frontend i18n set up (es/en JSON, provider, translation hooks) |
| Phase 6 | DataTable + SlideForm + ConfirmDialog render and interact correctly |
| Phase 7 | Users CRUD from frontend works end-to-end (refactored to i18n) |
| Phase 8 | All 10 feature pages render and support CRUD (+ GET /currencies endpoint) |
| Phase 9 | No gaps between legacy and new code, archive done |
| Phase 10 | `pnpm -r typecheck`, `pnpm -r lint` pass, E2E smoke test |

---

## API Endpoint Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login with userName + password, returns JWT |
| DELETE | `/auth/logout` | Bearer | Invalidate current token |
| GET | `/auth/me` | Bearer | Get current authenticated user |

### Users
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/users` | Bearer | master, admin | Create user |
| GET | `/users` | Bearer | master, admin | List all users (paginated) |
| GET | `/users/:id` | Bearer | master, admin | Get user by ID |
| PUT | `/users/:id` | Bearer | master, admin | Update user |
| DELETE | `/users/:id` | Bearer | master | Delete user |

### Customers
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/customers` | Bearer | master, admin, employee | Create customer |
| GET | `/customers` | Bearer | master, admin, employee | List customers |
| GET | `/customers/:id` | Bearer | master, admin, employee | Get customer |
| PUT | `/customers/:id` | Bearer | master, admin, employee | Update customer |
| DELETE | `/customers/:id` | Bearer | master, admin | Delete customer |

### Suppliers
*(same CRUD pattern as customers)*

### Companies
*(same CRUD pattern)*

### Taxes
*(same CRUD pattern)*

### Batches
*(same CRUD pattern)*

### Products
*(same CRUD pattern, plus image upload)*

### Stocks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/stocks` | Bearer | Create stock with optional stock details |
| GET | `/stocks` | Bearer | List stocks (includes product, supplier, batch) |
| GET | `/stocks/:id` | Bearer | Get stock with details |
| PUT | `/stocks/:id` | Bearer | Update stock |
| DELETE | `/stocks/:id` | Bearer | Delete stock |
| POST | `/stocks/:id/details` | Bearer | Add stock detail entry/exit |
| GET | `/stocks/:id/details` | Bearer | Get stock details |

### Purchase Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/purchase-orders` | Bearer | Create PO with line items |
| GET | `/purchase-orders` | Bearer | List POs |
| GET | `/purchase-orders/:id` | Bearer | Get PO with details |
| PUT | `/purchase-orders/:id` | Bearer | Update PO |
| DELETE | `/purchase-orders/:id` | Bearer | Delete PO |

### Roles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/roles` | Bearer | List all roles |

### Currencies
| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/currencies` | Bearer | all | List currencies |
| GET | `/currencies/:id` | Bearer | all | Get currency by ID |

### Foreign Exchanges
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/foreign-exchanges` | Bearer | List exchange rates |
| POST | `/foreign-exchanges` | Bearer | Create exchange rate |

---

## Implementation Notes

- The legacy `api/` and `client/` directories remain untouched during migration — use them as reference for business logic, field definitions, and validation rules
- Each NestJS module follows the exact same file structure — once the first module is built, the remaining 11 are copy + adapt
- Each frontend feature follows the exact same pattern: `models` → `services` → `hooks` → `components/page` → route page
- The repository pattern means Prisma is swappable: implement the same interface with TypeORM/Drizzle/etc.
- Drop Electron support for now — if needed later, create a separate `desktop/` package that wraps the Next.js build
- **Frontend i18n**: Uses a custom client-side i18n system mirroring the backend pattern. Locale files at `frontend/src/i18n/locales/` (es.json + en.json). All page labels, table headers, form labels, and error messages use `useI18n()` hook with `t('module.section.key')` syntax. The locale can be switched at runtime via `setLocale('en')`.
- **Backend i18n**: NestJS `I18nService` at `backend/src/shared/i18n/`. API responses return `{ data, message: 'MODULE.ACTION' }` which gets translated via the `TransformInterceptor` based on `Accept-Language` header.
- **Seed user**: `glozada` / `000000` (role: Master)
- **API base URL**: `http://localhost:4000/api`
- **Prisma v6** is used (not v7) — run seed via `cd backend && pnpm exec tsx prisma/seed.ts`
