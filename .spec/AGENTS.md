# AGENTS.md — Instrucciones para Agentes de IA

> **Este archivo define el comportamiento esperado de cualquier agente de IA (OpenCode, Codex, Copilot, etc.) que trabaje en Cuadra.**  
> Para las reglas de arquitectura, consulta [.spec/system/architecture.md](.spec/system/architecture.md).  
> Para las reglas de seguridad, consulta [.spec/system/security.md](.spec/system/security.md).

---

## Project Rules (`.spec/`)

El directorio `.spec/` es la fuente de verdad del proyecto. Contiene especificaciones de sistema, negocio, features, UI/UX y DevOps.

### Qué leer (lectura dirigida — obligatorio)

1. [.spec/README.md](.spec/README.md) — índice + jerarquía de verdad.  
2. Este archivo (`AGENTS.md`) — patrones de código.  
3. Si tocas un módulo con feature spec → [.spec/features/{módulo}.md](features/) (`products`, `pos`, `sales`, `sync`, `reports`).
4. Según la tarea: `system/architecture.md`, `system/database.md`, `system/security.md`, `system/multi-tenancy.md`, `system/plan-gating.md`, `system/api-conventions.md`.  
5. **UI / pantallas:** [UI-UX/patterns.md](UI-UX/patterns.md) (qué layout/estado usar) + [UI-UX/design-system.md](UI-UX/design-system.md) (tokens).

**Cuando el usuario diga "lee las reglas del proyecto" / "read the project rules":** lee documentos marcados `current` bajo `.spec/` **excluyendo** `.spec/audit/` y planes `obsolete`. No leas planes `done`/`obsolete` salvo que la tarea sea histórica.

**Conflictos:** feature spec > system > UI patterns/design-system > business roadmap > plans. Actualiza feature spec y/o `UI-UX/patterns.md` en el mismo PR que cambia dominio o inventa un patrón UI.

Mapa completo: [.spec/README.md](.spec/README.md).

---

## Stack

- Monorepo: `pnpm workspaces` (backend + frontend)
- Backend: NestJS + Prisma + class-validator
- Frontend: Next.js App Router + Tailwind v4 + shadcn/ui v4
- Animation: `motion` (framer-motion)
- Icons: `lucide-react`
- Theme: `next-themes` (class strategy)

---

## i18n — Multi-language

### Location
- `frontend/src/i18n/locales/es.json` (default / Spanish-first)
- `frontend/src/i18n/locales/en.json`

### Usage rules
- **Every** hardcoded user-facing string must use `t()` or `tp()` from `useI18n()`.
- Import: `import { useI18n } from '@/i18n'`
- Destructure: `const { t, tp } = useI18n()`
- `t('module.key')` for simple strings.
- `tp('module.key', { param: value })` for strings with `{{param}}` placeholders.
- Group keys by module: `products.created`, `products.field.name`, `products.error.save`.
- Error keys: `module.error.{save,load,delete}`.
- Success keys: `module.{created,updated,deleted}`.
- Both `es.json` and `en.json` must be kept in sync — same structure, same keys.

---

## Sileo Toast Notifications

### Setup
- `Toaster` is rendered globally in `frontend/src/app/layout.tsx`.
- All feature pages import: `import { sileo } from 'sileo'`.

### Patterns

**Success after create:**
```tsx
await service.create(data);
sileo.success({ description: t('module.created') });
```

**Success after update:**
```tsx
await service.update(id, data);
sileo.success({ description: t('module.updated') });
```

**Success after delete:**
```tsx
await service.delete(id);
sileo.success({ description: t('module.deleted') });
```

**Error handling (catch block):**
```tsx
catch { setError(t('module.error.save')); }
```
Errors are displayed via inline `<Alert variant="destructive">` in the form, NOT via sileo.

---

## Component Patterns

Catálogo canónico de layouts/estados: [.spec/UI-UX/patterns.md](UI-UX/patterns.md).  
No inventar pantallas fuera de Adopted; si hace falta un patrón nuevo, documentarlo ahí en el mismo PR.

### Feature page structure
```
frontend/src/features/{module}/
  components/{module}-page.tsx   → Main page component
  hooks/use-{module}.ts          → Data fetching hook
  models/{entity}.model.ts       → Zod/TS models (ej. product.model.ts)
  services/{entity}.service.ts   → API calls (ej. product.service.ts)

backend/src/modules/{module}/    → NestJS vertical slice (NO backend/src/features/)
```
Dominio de ventas = módulo `sales` (no inventar `invoices`). Contratos: `.spec/features/`.

### DataTable columns
```tsx
const columns: Column<Entity>[] = [
  { field: 'id', headerName: t('module.field.id') },
  { field: 'name', headerName: t('module.field.name') },
  { render: (row) => row.related?.name ?? '', headerName: t('module.field.related') },
];
```

### Form pattern
- Use `SlideForm` (shadcn Sheet) for create/edit.
- Use `ConfirmDialog` for delete confirmation.
- Always use shadcn components: `Input`, `Select`, `Switch`, `Label`, `Button`.
- Never use native `<select>` or raw HTML inputs.

### Duplicate title rule
- The dashboard layout (`(dashboard)/layout.tsx`) already renders the page title from `navigationConfig`.
- Feature pages must NOT render their own `<h1>` title.
- Feature pages only render the content area (DataTable, form, etc.).

### Input Focus
- `autoFocus` en el primer input de formularios críticos (login, PIN, búsquedas POS, ProductSearch, CustomerSearch).
- `useRef` + `.focus()` programático después de operaciones asíncronas (ej: después de agregar producto, refocar ProductSearch).
- En POS: CustomerSearch y ProductSearch exponen `inputRef` para atajo de teclado.
- Priorizar flujo continuo sin mouse — el usuario nunca debe necesitar el mouse para empezar a escribir.

### Keyboard Shortcuts
- Hook compartido `useHotkey` en `frontend/src/hooks/use-hotkey.ts`. Lookup: `overrides de Dexie` > `defaults` de `shortcuts.ts`.
- Hotkeys modales (Ctrl/⌘) — nunca interferir con input nativo (inputs/textarea/select). Excepto Escape que siempre funciona.
- Escape siempre cierra el modal/dialog más cercano.
- Documentar shortcuts visualmente: tooltip o badge en botones (ej: "Buscar (Ctrl+P)").
- `preventDefault` para evitar que el browser capture el atajo.
- Shortcuts se configuran en `frontend/src/config/shortcuts.ts` y son personalizables desde Settings > Shortcuts.

---

## Sidebar

- Aceternity `Sidebar` component with animated expand/collapse.
- Desktop: `onMouseEnter`/`onMouseLeave` hover-to-expand.
- Mobile: hamburger button in top bar + animated fullscreen overlay.
- Navigation items use lucide icons via `iconMap` in layout.
- Logout is a `SidebarLink` at the end of the nav section.
- User avatar + name at the bottom of the sidebar.

---

## TypeScript & Validation

- Backend uses `class-validator` + NestJS `ValidationPipe` with:
  - `whitelist: true` — strips unknown properties
  - `forbidNonWhitelisted: true` — rejects unknown properties
  - `transform: true` — auto-transform types
- Frontend model interfaces must match backend DTOs.
- Any field sent by the frontend must have a corresponding decorator in the backend DTO.

---

## Planning & Requirements

- **Why before what before how.** Start with business requirements (the problem, the user, success criteria). Then product requirements (features, flows, priorities). Only then design & technical requirements.
- **MVP-first.** Strip non-essential features. Build the smallest version that delivers real value and tests a core assumption. Extra ideas go to a "Version 2" log — not the current scope.
- **Definition of Done (DoD).** Every feature must have a clear, objective checklist before coding starts: code generated, manually tested locally, error handling verified, merged into main.
- **Trade-offs are deliberate.** Write down the compromise: e.g., slower but cheaper database, faster but more expensive hosting. Never let trade-offs happen by accident.
- **Cost of Ownership.** Software costs money after launch. Calculate ongoing operational costs: API tokens, database hosting, domain renewals, cloud compute. Document them.
- **Scope creep is resisted.** If a request arrives mid-sprint, log it for the next cycle. Do not let the MVP scope expand silently.

---

## Thinking Disciplines

- **Edge case thinking.** Before merging, ask: "What if the user clicks twice? What if the network drops mid-upload? What if the input is empty, negative, or absurdly large?"
- **Production thinking.** Code for failure. Assume the database will go down, the third-party API will timeout, and the user's connection will drop. Handle those paths explicitly.
- **Technical debt is tracked.** Shortcuts taken to ship faster must be written down (prefer `.spec/` notes or project debt log under `docs/`). Untracked debt breaks systems silently.
- **Right-sized prompting.** Break work into the smallest meaningful units. Ask for one function, one component, one endpoint — not an entire module.
- **Blast radius.** Before changing a function, ask: "How many other features will break if this fails?" Prefer isolated, narrow-impact code.
- **Documentation as you go.** Record architectural decisions, API structures, and environment setups while the context is fresh.
- **Analysis paralysis is a trap.** Recognize when planning becomes procrastination. Ship, observe, iterate.
- **Rubber ducking.** Explain the problem aloud (or to the AI). Verbalizing frequently reveals the solution before you finish the sentence.

---

## Reliability

- **Never swallow exceptions.** Every `catch` block must either recover, retry, or surface the error to the user/logs. Empty catch blocks are forbidden.
- **Idempotency for write operations.** A payment retry, a sync push, a form resubmission — performing the operation multiple times must yield the same result as once. Use idempotency keys.
- **Retry with exponential backoff.** For transient failures (network, rate limits), retry with increasing delays: 1s, 2s, 4s, 8s, then fail permanently.
- **Rate limiting.** Every public endpoint must have a maximum request threshold per user/IP. Prevents abuse and protects the database.
- **Timeouts and circuit breakers.** External calls (APIs, databases) must have a deadline. If a service is completely down, stop calling it temporarily to save your own resources.
- **Graceful degradation.** If a non-essential feature fails (avatar upload, analytics), the rest of the application must remain fully functional.
- **Webhooks must be secure and idempotent.** Verify signatures, acknowledge receipt immediately, process asynchronously. Replay the same event should not double-process.

---

## Execution (Async & Performance)

- **UI must never block.** Heavy operations (data fetching, file processing, sync) run asynchronously. The user sees a loading state, never a frozen screen.
- **Cache aggressively.** Store copies of frequently-requested, slow-changing data in fast temporary storage. Invalidate cache when the underlying data changes.
- **Race conditions are silent corrupters.** Wrap interdependent writes in transactions. Use optimistic locking or version fields for concurrent updates.
- **Pagination is mandatory.** Every list endpoint must paginate. Never return unbounded datasets. Default page size 20, maximum 100.
- **Batch operations.** Bundle multiple database writes or API calls into a single transaction block to reduce round-trips and improve throughput.
- **Database indexes are not optional.** Every column used in `WHERE`, `JOIN`, or `ORDER BY` clauses — especially on large tables — must have a corresponding index.
- **Long-running processes go to background jobs.** Operations taking more than a few seconds (report generation, bulk email, video processing) run in a separate worker, not on the web server.
- **Stream large responses.** When returning large datasets or files, use streaming or chunked transfer so the client can start processing immediately.

---

## Infrastructure & DevOps

- **Secrets live in environment variables.** API keys, database passwords, JWT secrets — never in source code, never in git history. Use `.env` files excluded by `.gitignore`.
- **Migrations are versioned and immutable.** Once a database migration is committed and applied, never edit it retroactively. Create a new migration instead.
- **Dependency management.** Use a lockfile (`pnpm-lock.yaml`). Audit dependencies periodically for vulnerabilities. Pin exact versions, not ranges.
- **CI/CD pipeline.** Every push must pass typecheck + lint + tests before it can be merged. Deployments are automated from the main branch.
- **Backups are tested.** Automated database backups run on a schedule. A restore drill must be performed periodically to confirm backups actually work.
- **Configuration is separate from code.** Environment-specific settings (URLs, feature flags, limits) live in config files, not hardcoded in logic.
- **GitHub Issues for every task.** Bugs and features are tracked as GitHub Issues. Pull Requests reference the Issue they close. Use GitHub Projects for roadmap visualization.

---

## Testing & Quality

- **TypeScript strict mode everywhere.** No `any` without explicit justification. Types are the first line of defense against runtime errors.
- **Automated testing is not optional.** Unit tests for business logic, integration tests for API endpoints, E2E tests for critical user flows.
- **Regression tests before release.** Run the full test suite before every deployment. A passing suite yesterday does not mean a passing suite today.
- **Linting with zero warnings.** ESLint must be configured and enforced. Warnings are treated as errors in CI. No bypass comments unless justified in review.
- **Mock external services in tests.** Tests must never depend on live third-party APIs. Use mocks, stubs, or local emulators for databases, payment gateways, and email services.
- **Browser DevTools are the debugging foundation.** Master the Network, Console, Elements, and Performance panels. They answer 80% of frontend bugs.
- **Readiness checklist before launch.** Accessibility audit, SEO metadata, responsive breakpoints, performance scores (Lighthouse), and security headers — all verified.

---

## Observability & Security

- **Structured logging replaces `console.log`.** Logs must include timestamp, severity, context, and a message. Never log secrets, tokens, or PII.
- **Authentication verifies identity; Authorization verifies permissions.** Keep these concerns separate. AuthN happens once at the boundary. AuthZ checks happen at every sensitive operation.
- **Security-first coding.** Treat every input field, URL parameter, API payload, and file upload as malicious until validated. Validate type, length, format, and range.
- **SQL injection is prevented by parameterized queries.** Never concatenate user input into SQL strings. Use your ORM's parameterization (Prisma handles this by default — never use `$queryRaw` with string interpolation).
- **Audit logging for sensitive operations.** Record who did what and when for: user creation/deletion, role changes, payment operations, data exports. Logs must be append-only and immutable.
- **PII is encrypted and isolated.** Personally Identifiable Information (email, phone, address, tax ID) must be encrypted at rest. Never log PII. Minimize PII collection to what is strictly necessary.
- **Rate limiting is a security layer.** Limit login attempts (5/min), password resets (3/hour), and API requests per endpoint. Use short windows for auth, longer windows for data endpoints.
- **Prompt injection is a real threat.** If any LLM feature is added, inputs must be sandboxed. Never allow user input to alter system instructions. Validate and sanitize all LLM-bound data.
- **Cost observability.** Monitor API spend, cloud compute, and database usage in real time. Set budget alerts to prevent runaway bills.

---

*Referencia cruzada: [architecture.md](.spec/system/architecture.md) | [security.md](.spec/system/security.md) | [database.md](.spec/system/database.md)*
