# Shadcn UI V4. Migration & Visual Consistency

## TL;DR

Alinear todos los componentes de la UI con la estructura oficial de shadcn v4. Ajustar el theme (bordes, sombras) para que se vean más sólidos, reestructurar el padding de Cards, y reemplazar el DataTable custom por una implementación con `@tanstack/react-table` con sorting y paginación tipo shadcn.

---

## Problemas identificados — Estado

| # | Área | Problema | Estado |
|---|------|----------|--------|
| 1 | Theme | `--border`/`--input` eran `transparent`. No se veían los bordes | ✅ `oklch(0.82 0.02 250)` (light) / `oklch(0.32 0.03 250)` (dark) |
| 2 | Card | Doble padding al usar `p-6`/`py-6` en CardContent | ✅ Se quitó `py-6` redundante en settings page |
| 3 | Table | Header sin fondo distintivo | ✅ Ya tenía `bg-muted/50` desde shadcn v4 |
| 4 | DataTable | Sin sorting, paginación, loading states | ✅ Ya tenía TanStack sorting + skeletons. Se reemplazó native `<select>` por shadcn `Select` |
| 5 | SlideForm | Botón de cerrar duplicado | ✅ Previo |
| 6 | Placeholders | Texto hardcodeado en español en Selects | ✅ Previo |

### Theme (globals.css)

Se actualizaron los valores de `--border` y `--input` de `transparent` a:
- Light: `oklch(0.82 0.02 250)`
- Dark: `oklch(0.32 0.03 250)`

También se cambió `body { font-family: Arial }` → `font-family: var(--font-sans)`.

### Card (card.tsx)

Se evaluó mover `py-6` a subcomponentes pero causa doble espaciado (Card `gap-6` + `py-6` en cada subcomponente). Mejor: mantener `py-6` en Card y eliminar duplicación en consumidores. Se quitó `py-6` redundante en `settings/page.tsx`.

### Table + DataTable

- TableHeader ya tenía `bg-muted/50` de shadcn v4 — no requería cambio
- DataTable ya usaba `@tanstack/react-table` con sorting y skeletons
- Native `<select>` reemplazado por shadcn `Select` + `SelectTrigger`/`SelectContent`/`SelectItem`
- `PaginationEllipsis`: hardcoded "More pages" → `t('common.morePages')` con clave i18n agregada

- `pnpm --filter frontend typecheck` — 0 errors
- `pnpm --filter frontend build` — 15 rutas compilan
- Login page: card se ve con padding correcto
- Dashboard: stat cards con padding correcto y 3D-card funcional
- Tablas CRUD: header con fondo, sorting funcional, paginación con Pagination component
- Settings page: card con padding correcto

---

## Archivos a modificar

| Archivo | Phase |
|---------|-------|
| `frontend/src/app/globals.css` | 1 |
| `frontend/src/components/ui/card.tsx` | 2 |
| `frontend/src/components/ui/table.tsx` | 3 |
| `frontend/src/components/ui/data-table.tsx` | 3 |
| `frontend/package.json` | 3 (new dep) |
