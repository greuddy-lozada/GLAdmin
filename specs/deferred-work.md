# Deferred Work

Items identified during multi-tenant implementation that were deferred for later.

## 1. E2E Verification

Start backend + frontend and test the full user flow:

### Auth Flow
- [ ] Login returns orgs list for multi-org users
- [ ] Single-org users auto-select org
- [ ] Org picker displays correctly
- [ ] Selecting org updates JWT and redirects to dashboard
- [ ] Refreshing page persists org selection

### Admin Flow
- [ ] Admin users page lists only users in current org
- [ ] Creating a user assigns to current org + creates UserOrganization
- [ ] Max users enforcement blocks over-limit creation
- [ ] Admin orgs CRUD works
- [ ] Admin plans CRUD works
- [ ] Admin invites CRUD works

### Pago Movil Flow
- [ ] Config creation and update
- [ ] Transaction submission
- [ ] Manager review (approve/reject)
- [ ] Status badges display correctly

### Billing Flow
- [ ] Plan list loads
- [ ] Stripe checkout redirects (requires STRIPE_SECRET_KEY)
- [ ] Success/cancel URL handling
- [ ] Plan change reflected after webhook

### Bootstrap Flow
- [ ] Fresh DB shows setup wizard (requires DB reset)
- [ ] Setup creates org + admin user + returns JWT
- [ ] Duplicate email/slug throws proper errors
- [ ] After setup, redirects to dashboard

## 2. Production Deployment

### Infrastructure
- [ ] Switch from SQLite to PostgreSQL
- [ ] Create Dockerfile for backend (NestJS)
- [ ] Create Dockerfile for frontend (Next.js standalone)
- [ ] Create docker-compose.yml (backend + frontend + postgres)
- [ ] Add health check endpoints
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure secrets management (DB URL, JWT secret, Stripe keys)

### Build & Deploy
- [ ] Configure `next.config.mjs` for standalone output
- [ ] Set up PostgreSQL with Prisma migrations (not push)
- [ ] Configure CORS for production domains (or keep Next.js rewrites)
- [ ] Set up SSL/TLS
- [ ] Configure logging (pino)
- [ ] Set up error monitoring (Sentry)

### Performance
- [ ] Add pagination to DataTable components
- [ ] Add search/filter to admin pages
- [ ] Optimize Prisma queries (select only needed fields)
- [ ] Add database indexes for organizationId + commonly filtered fields

## 3. Pago Movil Proof Image Upload

- [ ] Implement file upload endpoint (multer or similar)
- [ ] Store uploaded images in `uploads/` directory or cloud storage
- [ ] Serve images via a static route or signed URL
- [ ] Add file type + size validation
- [ ] Show proofImage in transaction detail view

## 4. Stripe Webhook Reliability

- [ ] Add idempotency key handling
- [ ] Implement webhook retry with queue (Bull or similar)
- [ ] Add webhook secret verification with proper error logging
- [ ] Create webhook dashboard in admin panel

## 5. Tests

- [ ] Set up testing framework (Jest/Vitest per spec at `specs/testing-strategy.md`)
- [ ] Unit tests for Guards (AuthGuard, RolesGuard, FeatureGuard, PlanGuard)
- [ ] Unit tests for middleware (TenantMiddleware, Prisma middleware)
- [ ] Integration tests for auth flow (login, select-org, refresh)
- [ ] Integration tests for admin CRUD endpoints
- [ ] E2E tests for org-picker flow
- [ ] E2E tests for multi-tenant data isolation

## 6. API Documentation

- [ ] Set up Swagger/OpenAPI per `specs/api-documentation.md`
- [ ] Generate frontend API client types from OpenAPI spec
- [ ] Document all multi-tenant endpoints

## 7. Observability

- [ ] Add structured logging with pino (per `specs/observability-monitoring.md`)
- [ ] Add request ID tracing for tenant context debugging
- [ ] Add metrics: active orgs, users per org, plan distribution
- [ ] Set up health check endpoints (database, Stripe connectivity)

## 8. Multi-Currency Venezuela

- [ ] Implement BCV rate auto-fetch per `specs/multi-currency-venezuela.md`
- [ ] IVA/ISLR withholding rules with dual currency
- [ ] Fiscal period management
- [ ] Pago Movil exchange rate sync

## 9. Frontend Polish

- [ ] Add loading skeletons to DataTable
- [ ] Add empty states with illustrations
- [ ] Add error boundary for each feature page
- [ ] Responsive mobile layout for admin pages
- [ ] Org switcher dropdown in sidebar header
- [ ] Plan badge/indicator on dashboard
- [ ] Audit all pages for missing i18n strings
