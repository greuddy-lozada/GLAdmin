# GLAdmin — Project Conventions

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

### Feature page structure
```
frontend/src/features/{module}/
  components/{module}-page.tsx   → Main page component
  hooks/use-{module}.ts          → Data fetching hook
  models/{module}.model.ts       → TypeScript interfaces
  services/{module}.service.ts   → API calls
```

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
