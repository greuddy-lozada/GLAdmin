# Layout Fixes — Spacing & Alignment Audit

## TL;DR

Four spacing/alignment issues in the dashboard layout that make the UI feel cramped and misaligned. Each has a clear microtask fix.

---

## Issue 1 — Sidebar nav pegado a la izquierda

**File:** `frontend/src/app/(dashboard)/layout.tsx:123`

**Problema:** Los botones de navegación tienen `justify-start gap-3`, el icono empieza pegado al borde izquierdo del botón. Aunque el sidebar tiene `md:p-6`, la distancia visual desde el borde del sidebar hasta el texto no es suficiente.

**Fix:** En el `renderNav`, cuando `collapsed === false`, agregar `pl-2` a los botones para que el icono tenga más separación del borde izquierdo del sidebar.

```tsx
// expanded
className="justify-start gap-3 pl-2"
```

---

## Issue 2 — Main content pegado al sidebar

**File:** `frontend/src/app/(dashboard)/layout.tsx:150`

**Problema:** El `<main>` arranca inmediatamente después del borde del sidebar. El `p-6` del div interior da 24px, pero visualmente el contenido principal se siente pegado al sidebar.

**Fix:** Agregar `md:pl-8` al `<main>` para que el contenido no arranque pegado al borde del sidebar.

```tsx
<main className="flex-1 overflow-auto pt-14 md:pt-0 md:pl-8">
```

---

## Issue 3 — Dashboard cards no centradas

**File:** `frontend/src/app/(dashboard)/dashboard/page.tsx:11`

**Problema:** El `CardContent` usa `flex items-start gap-4` — el icono está a la izquierda y el texto a su derecha. Como las cards ocupan todo el ancho de su celda del grid, el contenido queda pegado a la izquierda de la card.

**Fix:** Cambiar a `items-center` para centrar verticalmente icono y texto, y opcionalmente `justify-center` si se quiere centrar horizontalmente todo el contenido.

```tsx
<CardContent className="flex items-center gap-4 p-6">
```

---

## Issue 4 — Profile button pegado a top-right

**File:** `frontend/src/app/(dashboard)/layout.tsx:153`

**Problema:** El contenedor del avatar tiene `justify-end` sin padding derecho ni superior propio. Solo el `p-6` del padre lo separa del borde.

**Fix:** Agregar `gap-4` y opcionalmente `pr-0` al contenedor, o mejor, usar `space` con padding/margin en el botón mismo. También considerar mover el botón para que tenga `mr-2` o similar.

```tsx
<div className="hidden md:flex md:items-center md:justify-end md:mb-6 md:gap-4">
```

Además, el botón en mobile header también necesita `mr-2` para no estar pegado al borde derecho.

---

## Microtasks — Estado

| # | Archivo | Cambio | Estado |
|---|---------|--------|--------|
| 1 | `sidebar.tsx` | Agregar `pl-2` a SidebarLink (expandidos) | ✅ `pl-2` agregado a `SidebarLink` |
| 2 | `layout.tsx` | Agregar `md:pl-8` al `<main>` | ✅ `md:pl-8` agregado |
| 3 | `dashboard/page.tsx` | Cambiar `items-start` → `items-center` en StatCard | ✅ Ya era `items-center` |
| 4 | `layout.tsx` | Agregar `md:gap-4` al avatar | 🔲 Baja prioridad, layout actual es aceptable |
