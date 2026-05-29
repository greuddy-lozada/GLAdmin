# Aceternity Sidebar Migration

## Steps

### Step 1 — Create `sidebar.tsx`

**File:** `frontend/src/components/ui/sidebar.tsx`

Componentes con animación vía `motion`:
- `Sidebar` — context provider con `open` / `setOpen` / `animate`
- `SidebarBody` — `motion.div` con width animado (260px ↔ 64px), overflow-x-hidden
- `SidebarLink` — Link con icon + label animado (opacity/width según open state)

### Step 2 — Rewrite `layout.tsx`

**File:** `frontend/src/app/(dashboard)/layout.tsx`

- Reemplazar `<aside>` con `<Sidebar>` + `<SidebarBody>`
- Logo "GLAdmin" / user name en el header del sidebar
- Nav items con `SidebarLink`, active highlight
- Avatar + DropdownMenu (logout) al pie del sidebar
- Remover avatar duplicado del top-right en desktop
- Mantener mobile header + Sheet sin cambios

### Step 3 — Typecheck

```bash
pnpm -r typecheck
```
