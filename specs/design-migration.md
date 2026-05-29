# Design Migration: MUI v9 → Aceternity UI (shadcn + Tailwind)

## TL;DR

Replace Material-UI v9 with Aceternity UI (a shadcn/ui extension) + Tailwind CSS for a modern, animated, and lightweight design system. This removes ~300KB of MUI JS runtime and replaces it with utility-first CSS and copy-paste components.

---

## Rationale

| Concern | MUI | Aceternity/shadcn |
|---------|-----|-------------------|
| Bundle size | ~300KB gzip runtime | ~0KB runtime (CSS only) |
| Customization | `sx` prop + theme override | Tailwind classes + CSS variables |
| Animations | No built-in | Motion (Framer Motion) + SVG gooey |
| Modernity | Predictable, corporate | Cutting-edge, animated |
| Icons | 22 MUI icon imports | Lucide (tree-shakeable) |
| Dark mode | ThemeProvider + CssBaseline | `class` strategy + `next-themes` |

---

## Architecture

```
frontend/src/
  components/
    ui/                          # shadcn components (copied, editable)
      button.tsx
      input.tsx
      select.tsx
      switch.tsx
      label.tsx
      dialog.tsx
      sheet.tsx
      table.tsx
      card.tsx
      avatar.tsx
      dropdown-menu.tsx
      separator.tsx
      alert.tsx
      badge.tsx
      skeleton.tsx
      pagination.tsx
      data-table.tsx             # Custom wrapper over shadcn Table + Pagination
      confirm-dialog.tsx         # Custom wrapper over shadcn Dialog
      slide-form.tsx             # Custom wrapper over shadcn Sheet
      background-beams.tsx       # Aceternity component
     3d-card.tsx                 # Aceternity component

  lib/
    utils.ts                     # cn() helper (clsx + tailwind-merge)
    icons.ts                     # Centralized icon exports

  providers/
    theme-provider.tsx           # Now wraps next-themes + CSS variables
    auth-provider.tsx            # Unchanged

  app/
    layout.tsx                   # Root layout (no MUI wrappers)
    globals.css                  # Tailwind directives + shadcn CSS variables
    (auth)/login/page.tsx        # Uses shadcn + Aceternity
    (dashboard)/layout.tsx       # Tailwind sidebar + shadcn Sheet/DropdownMenu
    (dashboard)/dashboard/page.tsx  # shadcn Card + Aceternity 3d-card

  features/*/components/*.tsx    # All MUI replaced with shadcn + Tailwind
```

---

## Key Changes

### Styling: `sx` prop → Tailwind classes
```tsx
// Before (MUI)
<Box sx={{ display: 'flex', gap: 2, p: 3, flexDirection: 'column' }}>

// After (Tailwind)
<div className="flex flex-col gap-4 p-6">
```

### Layout containers: `Box` → `div`
- All MUI `Box` components become `<div>` with Tailwind utility classes
- `Grid` → CSS Grid (`grid grid-cols-1 md:grid-cols-3 gap-4`)

### Typography: `Typography` → semantic HTML
- `Typography variant="h4"` → `<h1 className="text-2xl font-bold">`
- `Typography variant="body1"` → `<p className="text-sm text-muted-foreground">`
- `Typography color="textSecondary"` → `text-muted-foreground`

### Forms: `TextField` → shadcn `Input` + `Label`
```tsx
// Before
<TextField label="Nombre" value={name} onChange={e => setName(e.target.value)} fullWidth />

// After
<div className="space-y-2">
  <Label htmlFor="name">Nombre</Label>
  <Input id="name" value={name} onChange={e => setName(e.target.value)} />
</div>
```

### Selects: `TextField select` → shadcn `Select`
```tsx
// Before
<TextField select value={roleId} onChange={handleChange}>
  {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
</TextField>

// After
<Select value={roleId} onValueChange={setRoleId}>
  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
  <SelectContent>
    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
  </SelectContent>
</Select>
```

### Switches
```tsx
// Before
<FormControlLabel control={<Switch checked={active} onChange={setActive} />} label="Activo" />

// After
<div className="flex items-center gap-2">
  <Switch checked={active} onCheckedChange={setActive} />
  <Label>Activo</Label>
</div>
```

### Icons: MUI Icons → Lucide
```tsx
// Before
import PeopleIcon from '@mui/icons-material/People';

// After
import { Users } from 'lucide-react';
```

---

## Component Mapping

### shadcn components to install

| Component | CLI Command | Replaces |
|-----------|-------------|----------|
| `button` | `npx shadcn@latest add button` | MUI Button |
| `input` | `npx shadcn@latest add input` | MUI TextField (text) |
| `select` | `npx shadcn@latest add select` | MUI Select/MenuItem |
| `switch` | `npx shadcn@latest add switch` | MUI Switch |
| `label` | `npx shadcn@latest add label` | MUI FormLabel |
| `dialog` | `npx shadcn@latest add dialog` | MUI Dialog (confirm-dialog) |
| `sheet` | `npx shadcn@latest add sheet` | MUI Drawer (slide-form + mobile nav) |
| `table` | `npx shadcn@latest add table` | MUI Table (data-table base) |
| `card` | `npx shadcn@latest add card` | MUI Paper/Card (dashboard) |
| `avatar` | `npx shadcn@latest add avatar` | MUI Avatar (user menu) |
| `dropdown-menu` | `npx shadcn@latest add dropdown-menu` | MUI Menu (user dropdown) |
| `separator` | `npx shadcn@latest add separator` | MUI Divider |
| `alert` | `npx shadcn@latest add alert` | MUI Alert |
| `badge` | `npx shadcn@latest add badge` | Dashboard stat indicators |
| `skeleton` | `npx shadcn@latest add skeleton` | MUI CircularProgress (loading) |
| `pagination` | `npx shadcn@latest add pagination` | MUI TablePagination |

### Aceternity components to install

| Component | CLI Command | Replaces |
|-----------|-------------|----------|
| `background-beams` | `npx shadcn@latest add @aceternity/background-beams` | Login background |
| `3d-card` | `npx shadcn@latest add @aceternity/3d-card` | Dashboard stat cards |

---

## Migration Phases

### Phase 0 — Base Setup
- Install Tailwind CSS + PostCSS
- Create tailwind.config.ts + postcss.config.mjs
- Replace globals.css with Tailwind directives + shadcn CSS variables
- Create lib/utils.ts with cn() helper
- Run shadcn init
- Add Aceternity registry

### Phase 1 — Install Components
- Install all shadcn components listed above
- Install Aceternity components
- Install lucide-react

### Phase 2 — Theme + Layout
- Rewrite providers/theme-provider.tsx (remove MUI, add next-themes)
- Rewrite app/layout.tsx (remove MUI wrappers)
- Rewrite app/(dashboard)/layout.tsx (Tailwind sidebar + shadcn components)
- Update config/navigation.config.ts (Lucide icons)

### Phase 3 — Shared UI Components
- Rewrite data-table.tsx (shadcn Table + Pagination wrapper)
- Rewrite confirm-dialog.tsx (shadcn Dialog wrapper)
- Rewrite slide-form.tsx (shadcn Sheet wrapper)

### Phase 4 — Login + Dashboard
- Rewrite features/auth/components/login-form.tsx (shadcn + Aceternity beams)
- Rewrite app/(dashboard)/dashboard/page.tsx (shadcn Card + Aceternity 3d-card)

### Phase 5 — Feature Pages (11 pages)
All follow the same template:
```tsx
// Template
'use client';
import { ... } from '@/hooks/use-feature';
import { DataTable } from '@/components/ui/data-table';
import { SlideForm } from '@/components/ui/slide-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
// ... shadcn form components
// All labels via useI18n()
```

### Phase 6 — Cleanup
- Remove `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid`, `@emotion/react`, `@emotion/styled`
- Remove unused MUI type packages
- Verify typecheck + build

---

## Theme

```tsx
// providers/theme-provider.tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

CSS variables defined in globals.css per shadcn convention (zinc base).

---

## Known Issues

Issues found during design audit (2026-05-22). All resolved as of 2026-05-25.

| # | Status | File | Issue | Fix |
|---|--------|------|-------|-----|
| 1 | ✅ | `src/app/(dashboard)/settings/page.tsx` | Settings page missing — nav config points to it, clicking "Configuración" gives 404 | Already existed, no action needed |
| 2 | ✅ | `src/features/roles/components/roles-page.tsx:16` | Missing i18n key `roles.field.description` in locale files | Already existed in both locales |
| 3 | ✅ | `src/features/purchase-orders/components/purchase-orders-page.tsx:212` | Wrong i18n key path: `purchaseOrders.field.details` should be `purchaseOrders.details` | Already using correct key |
| 4 | ✅ | `src/components/ui/data-table.tsx` | Hardcoded Spanish strings | Already using i18n |
| 5 | ✅ | `src/components/ui/confirm-dialog.tsx:46` | Hardcoded `Procesando...` | Already using `t('common.processing')` |
| 6 | ✅ | `src/components/ui/pagination.tsx` | Hardcoded `More pages` | Fixed → `t('common.morePages')` |
| 7 | ✅ | `src/features/purchase-orders/...` | Hardcoded `Agregar`, `Detalle` | Already using i18n |
| 8 | ✅ | `src/features/purchase-orders/...` | Icon size deviation | Already standard `mr-2 h-4 w-4` |
| 9 | ✅ | `src/app/page.module.css` | Orphaned file | Deleted |
| 10 | ✅ | `src/styles/` | Empty directory | Removed |
| 11 | 🔲 | Auth layout flex containers | Redundant nesting | Low priority, no visual issue |
| 12 | ✅ | DataTable native `<select>` | Should use shadcn `Select` | Fixed → replaced with shadcn Select |

---

## Verification

- `pnpm --filter frontend typecheck` — 0 errors
- `pnpm --filter frontend build` — succeeds
- Login page renders with animated background
- All 11 CRUD pages load, create/edit/delete work
- Sidebar renders with active route highlighting
- Mobile responsive (Sheet drawer for nav)
- Dark mode toggle works
- Sileo toasts still functional
