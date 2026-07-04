# Design System — Sistema de Diseño de Cuadra

> **Stack de UI:** Tailwind CSS v4 + shadcn/ui v4 + motion + lucide-react  
> **Principio rector:** Consistencia visual absoluta. Cada pantalla debe sentirse parte del mismo producto.

---

## 1. Tokens de Color — Paleta Corporativa

### Definición en Tailwind CSS v4

```css
/* frontend/src/app/globals.css */
@import "tailwindcss";

@theme {
  /* ── Colores de marca ── */
  --color-primary:        oklch(0.55 0.18 260);       /* Azul corporativo */
  --color-primary-light:  oklch(0.65 0.15 260);       /* Hover states */
  --color-primary-dark:   oklch(0.45 0.20 260);       /* Active/pressed */
  --color-primary-foreground: oklch(0.98 0 0);        /* Texto sobre primary */

  --color-secondary:      oklch(0.65 0.15 180);       /* Verde esmeralda */
  --color-secondary-light:oklch(0.75 0.12 180);
  --color-secondary-dark: oklch(0.55 0.17 180);
  --color-secondary-foreground: oklch(0.98 0 0);

  --color-accent:         oklch(0.60 0.18 40);        /* Ámbar/dorado para CTAs */
  --color-accent-light:   oklch(0.70 0.14 40);
  --color-accent-dark:    oklch(0.50 0.20 40);
  --color-accent-foreground: oklch(0.10 0.02 0);

  /* ── Superficies ── */
  --color-surface:        oklch(0.98 0 0);            /* Fondo de tarjetas (light) */
  --color-surface-hover:  oklch(0.95 0 0);
  --color-surface-dark:   oklch(0.20 0.01 0);         /* Fondo de tarjetas (dark) */
  --color-surface-dark-hover: oklch(0.25 0.01 0);

  /* ── Estados semánticos ── */
  --color-success:        oklch(0.50 0.18 145);       /* Verde confirmación */
  --color-warning:        oklch(0.65 0.17 85);        /* Ámbar advertencia */
  --color-destructive:    oklch(0.50 0.22 25);        /* Rojo error/eliminar */
  --color-info:           oklch(0.55 0.12 230);       /* Azul informativo */

  /* ── Bordes ── */
  --color-border:         oklch(0.88 0 0);            /* Bordes suaves (light) */
  --color-border-dark:    oklch(0.30 0.01 0);         /* Bordes suaves (dark) */
}
```

### Variables CSS para shadcn/ui (light/dark)

```css
:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.10 0.02 260);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.10 0.02 260);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.10 0.02 260);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-primary-foreground);
  --secondary: var(--color-secondary);
  --secondary-foreground: var(--color-secondary-foreground);
  --muted: oklch(0.95 0 0);
  --muted-foreground: oklch(0.50 0.02 260);
  --accent: var(--color-accent);
  --accent-foreground: var(--color-accent-foreground);
  --destructive: var(--color-destructive);
  --destructive-foreground: oklch(0.98 0 0);
  --border: var(--color-border);
  --input: var(--color-border);
  --ring: var(--color-primary);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.12 0.01 260);
  --foreground: oklch(0.90 0.01 0);
  --card: oklch(0.15 0.01 260);
  --card-foreground: oklch(0.90 0.01 0);
  --popover: oklch(0.15 0.01 260);
  --popover-foreground: oklch(0.90 0.01 0);
  --primary: var(--color-primary-light);
  --primary-foreground: oklch(0.10 0.02 260);
  --secondary: var(--color-secondary-light);
  --secondary-foreground: oklch(0.10 0.02 0);
  --muted: oklch(0.20 0.01 0);
  --muted-foreground: oklch(0.60 0.01 0);
  --accent: var(--color-accent-light);
  --accent-foreground: oklch(0.10 0.02 0);
  --destructive: oklch(0.55 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);
  --border: var(--color-border-dark);
  --input: var(--color-border-dark);
  --ring: var(--color-primary-light);
}
```

---

## 2. Estados de UI Obligatorios

### 2.1 Estados de Carga — Skeletons

**Regla:** Toda página que hace fetch de datos debe mostrar skeletons mientras carga, **nunca** un spinner infinito ni pantalla en blanco.

```tsx
// ✅ SKELETON — Preferido
import { Skeleton } from '@/components/ui/skeleton';

function ProductsPage() {
  const { products, isLoading } = useProducts();
  
  if (isLoading) return <ProductsTableSkeleton />;
  // ...
}

function ProductsTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />           {/* Barra de búsqueda */}
      <Skeleton className="h-8 w-32" />               {/* Botón crear */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />  {/* Filas */}
      ))}
    </div>
  );
}
```

**Tipos de skeleton por componente:**

| Componente | Skeleton |
|---|---|
| Tabla de datos | Filas de `h-12` una por cada fila esperada + skeleton para toolbar |
| Tarjeta (Card) | `h-48 w-full` (altura proporcional al contenido esperado) |
| Formulario | Campos de `h-10 w-full` + botón `h-10 w-24` |
| Gráfica | `h-64 w-full rounded-lg` (placeholder rectangular) |
| Sidebar avatar | `h-10 w-10 rounded-full` + `h-4 w-24` para nombre |

### 2.2 Estados Vacíos — Empty States

**Regla:** Cuando una lista/consulta retorna 0 resultados, mostrar un empty state con:
1. Icono representativo (lucide)
2. Mensaje descriptivo en español
3. Acción sugerida (botón CTA si aplica)

```tsx
import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

function EmptyProducts() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">{t('products.empty.title')}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        {t('products.empty.description')}
      </p>
      <Button>{t('products.create')}</Button>
    </div>
  );
}
```

**Empty states requeridos para:**

| Módulo | Icono | Mensaje |
|---|---|---|
| Productos | `PackageOpen` | "No hay productos registrados" |
| Clientes | `Users` | "No hay clientes registrados" |
| Facturas | `FileText` | "No hay facturas emitidas" |
| POS | `ShoppingCart` | "Agrega productos para iniciar una venta" |
| Reportes | `BarChart3` | "Selecciona un período para generar reportes" |
| Búsqueda sin resultados | `SearchX` | "No se encontraron resultados para tu búsqueda" |

### 2.3 Manejo Visual de Errores en Formularios

**Regla:** Errores de validación se muestran **inline**, debajo del campo correspondiente. Errores de red se muestran en un `Alert` superior.

```tsx
// ✅ Error inline (campo específico)
<div className="space-y-2">
  <Label htmlFor="rif">{t('customers.field.rif')}</Label>
  <Input id="rif" {...register('rif')} />
  {errors.rif && (
    <p className="text-sm text-destructive">{errors.rif.message}</p>
  )}
</div>

// ✅ Error de red / servidor (formulario completo)
{serverError && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{serverError}</AlertDescription>
  </Alert>
)}
```

---

## 3. Tipografía

| Nivel | Clase Tailwind | Uso |
|---|---|---|
| Título de página | `text-2xl font-bold tracking-tight` | Renderizado por dashboard layout (NO en feature pages) |
| Título de sección | `text-lg font-semibold` | Encabezados de cards, modales |
| Subtítulo | `text-sm text-muted-foreground` | Descripciones debajo de títulos |
| Texto body | `text-sm` | Texto general, tablas, formularios |
| Texto pequeño | `text-xs text-muted-foreground` | Metadatos, timestamps, notas al pie |
| Montos financieros | `font-mono tabular-nums` | Columnas de precios, totales (alineación numérica) |

---

## 4. Espaciado y Layout

| Elemento | Espaciado |
|---|---|
| Padding de página | `p-6` o `px-6 py-4` |
| Gap entre cards en grid | `gap-6` |
| Gap entre elementos en formulario | `gap-4` (vertical stack) |
| Padding interno de card | `p-6` |
| Margen inferior de toolbar | `mb-4` |

---

## 5. Animaciones

**Stack:** `motion` (framer-motion)

**Reglas:**
1. **Animaciones solo para feedback, nunca solo decorativas.**
2. **Duración máxima: 200ms.** Animaciones más largas hacen sentir lenta la app.
3. **Respetar `prefers-reduced-motion`.**

```tsx
// Transiciones estándar
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.15, ease: 'easeOut' },
};

// Respetar preferencias del sistema
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.15 }}
  // motion respeta prefers-reduced-motion por defecto
>
  {children}
</motion.div>
```

---

## 6. Responsive Design

**Breakpoints de Tailwind (mobile-first):**

| Breakpoint | Ancho | Dispositivo |
|---|---|---|
| `sm` | ≥ 640px | Tablets pequeñas, teléfonos landscape |
| `md` | ≥ 768px | Tablets |
| `lg` | ≥ 1024px | Laptops pequeñas |
| `xl` | ≥ 1280px | Escritorio estándar |
| `2xl` | ≥ 1536px | Pantallas grandes |

**Reglas responsive:**
1. **Mobile-first** en todos los componentes.
2. El sidebar colapsa automáticamente en `md` hacia abajo (modo overlay con hamburger).
3. DataTable usa `overflow-x-auto` en móvil (scroll horizontal para tablas anchas).
4. El POS usa layout de 2 columnas en `lg+` y single column en menores.

---

---

## 7. Accessibility (a11y)

**Objetivo:** WCAG 2.1 Nivel AA.

### Reglas obligatorias

#### 7.1 Contraste de color

| Relación | Aplica a |
|---|---|
| ≥ 4.5:1 | Texto normal (body, labels, placeholders) contra fondo |
| ≥ 3:1 | Texto grande (≥18px bold o ≥24px regular), iconos informativos, bordes de inputs |

**Validar con:** Chrome DevTools → Lighthouse → Accessibility, o extensión Axe.

#### 7.2 aria-label obligatorio

Todo elemento interactivo sin texto visible DEBE tener `aria-label`:

```tsx
// ✅ Botón de icono con aria-label
<Button variant="ghost" size="icon" aria-label={t('common.edit')}>
  <Pencil className="h-4 w-4" />
</Button>

// ✅ IconButton genérico (shadcn)
<IconButton aria-label={t('products.delete')}>
  <Trash2 className="h-4 w-4" />
</IconButton>

// ❌ Sin aria-label — el lector de pantalla no sabe qué hace
<Button variant="ghost" size="icon">
  <Pencil className="h-4 w-4" />
</Button>
```

#### 7.3 Focus visible

Todo elemento interactivo debe tener un anillo de focus visible. Usar el anillo de shadcn/ui:

```css
/* globals.css — ya incluido por shadcn/ui */
*:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}
```

**No remover el outline sin reemplazo.** `outline: none` sin un estilo de focus alternativo rompe accesibilidad.

#### 7.4 Navegación por teclado

| Acción | Tecla |
|---|---|
| Navegar entre elementos interactivos | `Tab` / `Shift+Tab` |
| Activar botón/enlace | `Enter` o `Space` |
| Cerrar modal/dialog | `Escape` |
| Navegar opciones de Select/Combobox | `↑` `↓` |
| Seleccionar opción | `Enter` |

**Check manual:** Recorrer toda la página solo con `Tab`. Cada elemento interactivo debe ser alcanzable y tener focus visible.

#### 7.5 Atributos ARIA en componentes clave

```tsx
// DataTable: role="table" con thead/tbody semántico
<table role="table" aria-label={t('products.table.label')}>
  <thead>...</thead>
  <tbody>...</tbody>
</table>

// Modal/Dialog: role="dialog" + aria-labelledby
<DialogContent role="dialog" aria-labelledby="dialog-title">
  <DialogTitle id="dialog-title">{t('products.create')}</DialogTitle>
</DialogContent>

// Alert/Toast: role="alert" para anuncios automáticos
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Loading: aria-busy
<div aria-busy="true" aria-label={t('common.loading')}>
  <Spinner />
</div>
```

#### 7.6 prefers-reduced-motion

Las animaciones con `motion` respetan esto por defecto. Para animaciones CSS/Tailwind:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### 7.7 Checklist de accesibilidad por feature

Antes de merge, verificar:

- [ ] Todos los inputs tienen `<Label>` asociado (htmlFor + id)
- [ ] Todos los icon buttons tienen `aria-label` con texto descriptivo
- [ ] Las imágenes decorativas tienen `alt=""`, las informativas tienen `alt` descriptivo
- [ ] El orden de `Tab` sigue el flujo visual lógico (no usar `tabIndex` > 0)
- [ ] Los mensajes de error están asociados al input vía `aria-describedby`
- [ ] La página es usable con zoom al 200%
- [ ] Los colores no son el único medio para transmitir información (ej: estado "emitido" vs "anulado" debe tener texto + color)

---

*Referencia cruzada: AGENTS.md (Component Patterns) | architecture.md*
