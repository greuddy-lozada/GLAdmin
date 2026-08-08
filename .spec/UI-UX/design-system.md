# Design System — Sistema de Diseño de Cuadra

> **status:** `current`  
> **Stack de UI:** Tailwind CSS v4 + shadcn/ui v4 + motion + lucide-react  
> **Principio rector:** Consistencia visual absoluta. Cada pantalla debe sentirse parte del mismo producto.  
> **Patrones de pantalla (CRUD, empty, POS, rejected):** ver [patterns.md](patterns.md) antes de diseñar una vista nueva.

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

## 3. Tipografía y Legibilidad

> **Principio:** El contraste tipográfico se logra combinando **peso + tamaño + color**, nunca solo uno de los tres.  
> La jerarquía visual guía al ojo del usuario hacia la información más importante sin esfuerzo.

---

### 3.1 Escala Tipográfica Completa

| Clase | Tamaño | Peso | Altura de línea | Tracking | Uso |
|---|---|---|---|---|---|
| `text-xs` | 0.75rem | `font-normal` | `leading-normal` | `tracking-normal` | Metadatos, timestamps, badges pequeños, notas al pie |
| `text-sm` | 0.875rem | `font-normal` | `leading-relaxed` | `tracking-normal` | Body text principal, filas de tabla, labels de formulario, descripciones |
| `text-sm font-medium` | 0.875rem | `font-medium` | `leading-relaxed` | `tracking-normal` | Valores numéricos en celdas, datos destacados en cards |
| `text-sm font-semibold` | 0.875rem | `font-semibold` | `leading-normal` | `tracking-normal` | Labels de campos, encabezados de columna en tablas |
| `text-base` | 1rem | `font-normal` | `leading-relaxed` | `tracking-normal` | Texto descriptivo largo (>2 líneas), párrafos en modales |
| `text-base font-semibold` | 1rem | `font-semibold` | `leading-snug` | `tracking-normal` | Subtítulos dentro de cards, nombres de sección |
| `text-lg` | 1.125rem | `font-semibold` | `leading-snug` | `tracking-normal` | Títulos de cards, encabezados de sección, títulos de modales |
| `text-lg font-bold` | 1.125rem | `font-bold` | `leading-tight` | `tracking-tight` | Totales financieros, KPIs, números grandes de resumen |
| `text-xl` | 1.25rem | `font-semibold` | `leading-tight` | `tracking-tight` | Títulos de página secundarios, encabezados de reportes |
| `text-2xl` | 1.5rem | `font-bold` | `leading-tight` | `tracking-tight` | Título de página principal (renderizado por dashboard layout) |
| `text-3xl` | 1.875rem | `font-bold` | `leading-tight` | `tracking-tight` | Pantalla de login, landing, KPIs hero |
| `text-4xl` | 2.25rem | `font-bold` | `leading-tight` | `tracking-tighter` | Solo para pantallas de bienvenida o excepciones |

---

### 3.2 Jerarquía de Pesos — Contraste por Grueso

El peso de fuente (`font-weight`) es la herramienta principal de jerarquía. Regla: **a mayor importancia, mayor peso y tamaño.**

| Peso | Clase Tailwind | Cuándo usarlo |
|---|---|---|
| **Bold** (700) | `font-bold` | Títulos de página, totales, KPIs, números de resumen, encabezados de factura |
| **Semibold** (600) | `font-semibold` | Labels de formularios, encabezados de sección, títulos de cards, nombres de columnas en DataTable |
| **Medium** (500) | `font-medium` | Valores destacados, nombres de entidades, enlaces de navegación |
| **Normal** (400) | `font-normal` | Body text, descripciones, párrafos, mensajes de ayuda, valores secundarios |
| **Light** (300) | `font-light` | Solo para metadata muy secundaria o estética decorativa (evitar en datos críticos) |

**Regla práctica:** Para cualquier par label-valor, el label es `font-semibold` y el valor es `font-normal`. La diferencia de peso crea jerarquía sin depender del color.

---

### 3.3 Contraste Tipográfico por Rol

Cada componente de UI tiene un patrón de contraste definido:

#### Label + Valor (formularios, cards de detalle)

```tsx
// ✅ Label arriba, valor abajo — jerarquía clara
<div>
  <Label className="text-sm font-semibold text-foreground">
    {t('customers.field.name')}
  </Label>
  <p className="text-sm font-normal text-muted-foreground mt-1">
    {customer.name}
  </p>
</div>

// ✅ Label izquierda, valor derecha — espacio controlado
<div className="flex justify-between items-baseline">
  <span className="text-sm font-semibold text-foreground">Subtotal</span>
  <span className="text-sm font-medium text-foreground tabular-nums">Bs. 1,250.00</span>
</div>
```

#### Dato financiero destacado

```tsx
// ✅ Total — máximo contraste: tamaño grande, bold, color primario
<p className="text-lg font-bold text-primary tracking-tight tabular-nums">
  Bs. 15,000.00
</p>
```

#### Texto descriptivo (párrafos)

```tsx
// ✅ Máximo 65 caracteres por línea, altura de línea relajada
<p className="text-sm text-muted-foreground leading-relaxed max-w-prose">
  {t('products.description')}
</p>
```

---

### 3.4 Jerarquía de Color Textual

| Prioridad | Clase | Uso |
|---|---|---|
| **Primario** | `text-foreground` | Contenido principal: nombres, valores, datos |
| **Secundario** | `text-muted-foreground` | Descripciones, ayuda contextual, valores secundarios |
| **Terciario** | `text-muted-foreground/60` | Placeholders, hints, "Sin datos", metadata muy secundaria |
| **Enlace** | `text-primary font-medium hover:underline` | Enlaces y acciones navegables |
| **Énfasis** | `text-primary font-semibold` | Valores destacados: totales, KPIs, números importantes |
| **Error** | `text-destructive` | Mensajes de error, montos negativos, alertas |
| **Éxito** | `text-success` | Confirmaciones, estados positivos |
| **Advertencia** | `text-warning` | Alertas, vencimientos próximos |

**Regla:** Nunca usar solo color para diferenciar jerarquía. Un valor destacado debe ser `text-primary font-semibold`, no solo `text-primary`. Un error debe ser `text-destructive font-medium`, no solo `text-destructive`.

---

### 3.5 Altura de Línea (Line Height)

| Clase | Valor | Cuándo usarlo |
|---|---|---|
| `leading-tight` | 1.25 | Títulos, headings, KPIs, números grandes (1-2 líneas) |
| `leading-snug` | 1.375 | Subtítulos, encabezados de sección, texto en cards |
| `leading-normal` | 1.5 | Tablas, listas, formularios, contenido denso |
| `leading-relaxed` | 1.625 | Body text, párrafos descriptivos (>2 líneas), modales con texto explicativo |

**Regla:** A mayor longitud de texto, mayor altura de línea. Párrafos de más de 3 líneas siempre usan `leading-relaxed`.

---

### 3.6 Ancho Máximo de Lectura

Para optimizar la comprensión lectora, limitar el ancho de bloques de texto:

| Contexto | Clase | Caracteres aprox. |
|---|---|---|
| Texto descriptivo, párrafos | `max-w-prose` (~65ch) | 60-70 caracteres |
| Cards con descripción | `max-w-[65ch]` | 60-70 caracteres |
| Modales de texto largo | `max-w-prose` | 60-70 caracteres |
| Labels y valores cortos | Sin restricción | < 40 caracteres |
| DataTable | Ancho completo con `overflow-x-auto` | Variable |

**Regla:** El ojo humano lee cómodamente entre 45 y 75 caracteres por línea. Bloqueos de texto > 80 caracteres dificultan el seguimiento visual.

---

### 3.7 Alineación de Texto

| Contexto | Alineación | Clase |
|---|---|---|
| Títulos, headings | Izquierda | `text-left` (default) |
| Body text, párrafos | Izquierda | `text-left` |
| Montos financieros en tabla | **Derecha** | `text-right` |
| Cifras en moneda | **Derecha** | `text-right tabular-nums` |
| Números de control, códigos | **Derecha** o centro si es corto | `text-right font-mono` |
| Empty states | Centro | `text-center` |
| Badges, chips | Centro | `text-center` |

**Prohibido:** `text-justify` — crea ríos de espacio blanco y reduce legibilidad.

---

### 3.8 Ritmo Vertical y Separación

| Elemento | Separación | Clase sugerida |
|---|---|---|
| Entre párrafos consecutivos | 1rem | `space-y-4` en contenedor |
| Entre secciones distintas | 1.5rem | `space-y-6` o `gap-6` |
| Label → su valor | 0.25rem | `mt-1` |
| Título de sección → contenido | 1rem | `mb-4` |
| Toolbar → tabla | 0.75rem | `mb-3` o `mb-4` |
| Card header → card content | Borde o padding | `border-b pb-4` |

---

### 3.9 Enlaces y Texto Interactivo

```tsx
// ✅ Enlace estándar
<a href="#" className="text-sm font-medium text-primary hover:underline">
  {t('common.viewDetails')}
</a>

// ✅ Enlace externo con icono
<a href={url} target="_blank" rel="noopener noreferrer"
   className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
  <ExternalLink className="h-3.5 w-3.5" />
  {label}
</a>

// ✅ Breadcrumb
<nav className="flex items-center gap-1 text-sm text-muted-foreground">
  <a href="/dashboard" className="hover:text-foreground">Inicio</a>
  <ChevronRight className="h-3.5 w-3.5" />
  <span className="text-foreground font-medium">Productos</span>
</nav>
```

---

### 3.10 Listas

```tsx
// ✅ Lista con bullets
<ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 leading-relaxed">
  <li>Facturas emitidas no pueden ser modificadas</li>
  <li>Use notas de crédito para corregir montos</li>
</ul>

// ✅ Lista ordenada (pasos, instrucciones)
<ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2 leading-relaxed">
  <li>Seleccione el período fiscal</li>
  <li>Verifique los totales calculados</li>
  <li>Confirme la generación del reporte</li>
</ol>
```

---

### 3.11 Tipografía de Datos Financieros

```tsx
// ✅ Monto en tabla — derecha, tabular-nums, monospace opcional
<span className="text-sm tabular-nums text-right">
  Bs. {amount.toFixed(2)}
</span>

// ✅ Total en factura — grande, bold, tracking-tight
<p className="text-lg font-bold text-primary tracking-tight tabular-nums">
  Bs. {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
</p>

// ✅ Monto negativo — color destructive
<span className="text-sm font-medium text-destructive tabular-nums">
  -Bs. {Math.abs(amount).toFixed(2)}
</span>

// ✅ Código / número de control — monospace
<code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
  {controlNumber}
</code>

// ✅ Columna numérica en DataTable — alineación consistente
const columns: Column<Invoice>[] = [
  {
    field: 'total',
    headerName: t('sales.field.total'),
    render: (row) => (
      <span className="font-mono tabular-nums">
        Bs. {row.total.toFixed(2)}
      </span>
    ),
  },
];
```

---

### 3.12 Texto con Icono de Soporte

```tsx
// ✅ Badge de estado — peso medium + icono pequeño
<span className="inline-flex items-center gap-1 text-xs font-medium text-success">
  <CheckCircle2 className="h-3 w-3" />
  {t('common.active')}
</span>

// ✅ Mensaje de ayuda — muted, más pequeño
<p className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
  <span>{t('products.help.code')}</span>
</p>
```

---

### 3.13 Reglas Generales de Legibilidad

1. **No más de 3 niveles de jerarquía visual en una misma pantalla** (título → sección → body).
2. **No usar solo color para transmitir información** — siempre acompañar con peso, tamaño o icono.
3. **El contraste entre texto principal y fondo debe ser ≥ 4.5:1** (WCAG AA). Verificar con DevTools.
4. **No usar `text-justify`** — crea espacios irregulares entre palabras.
5. **No centrar texto de más de 2 líneas** — el ojo pierde el punto de inicio de cada línea.
6. **No usar mayúsculas sostenidas** — reducen la legibilidad. Usar `font-semibold` en vez de `uppercase`.
7. **Los números SIEMPRE usan `tabular-nums`** cuando aparecen en columnas o listas alineables.
8. **El texto descriptivo NUNCA debe tener más de 75 caracteres por línea** — usar `max-w-prose`.

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

---

## 8. Grids, Contenedores y Layout Profesional

> **Principio:** Cada elemento vive dentro de un contenedor con un propósito definido.  
> El espacio vacío no es un error — es una herramienta de diseño que jerarquiza la información.

---

### 8.1 Sistema de Grid Base

Cuadra usa un grid de **12 columnas** como estándar para layouts complejos. Para listas de cards se prefiere `auto-fill`.

```tsx
// ✅ Grid de 12 columnas — dashboards, layouts complejos
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-8">Contenido principal</div>
  <div className="col-span-4">Sidebar / resumen</div>
</div>

// ✅ Grid responsivo de cards — se adapta al ancho disponible
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <ProductCard key={item.id} {...item} />)}
</div>

// ✅ Auto-fill — la cantidad de columnas se calcula sola
<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
  {items.map(item => <StatCard key={item.id} {...item} />)}
</div>
```

#### Reglas de gap según contexto

| Gap | Clase | Cuándo |
|---|---|---|
| 8px | `gap-2` | Filas inline (toolbar, chips, badges, breadcrumb) |
| 16px | `gap-4` | Grid de cards, filas de formulario multi-columna, skeleton loaders |
| 24px | `gap-6` | Separación entre secciones mayores, dashboard widgets |
| 32px | `gap-8` | Separación entre módulos distintos en una misma página |

---

### 8.2 Tipos de Contenedor y Anchos Máximos

| Tipo | Clase | Ancho máx | Cuándo usarlo |
|---|---|---|---|
| **Full-width** | `w-full` | Sin límite | DataTable con muchas columnas, reportes, dashboard |
| **Wide** | `max-w-6xl` | 72rem (1152px) | Formularios extensos, páginas de detalle con mucha info |
| **Standard** | `max-w-4xl` | 56rem (896px) | Páginas CRUD con formulario + tabla |
| **Narrow** | `max-w-3xl` | 48rem (768px) | Flujos enfocados: POS, wizard, configuración |
| **Compact** | `max-w-2xl` | 42rem (672px) | Páginas de settings, perfil de usuario |
| **Auth** | `max-w-md` | 28rem (448px) | Login, registro, setup, recuperación de contraseña |
| **Dialog** | `max-w-sm` / `max-w-lg` | 24rem / 32rem | Modales, confirmaciones, PIN |

```tsx
// ✅ Página CRUD estándar — wide container
<div className="max-w-6xl mx-auto px-6 py-4">
  <Toolbar />
  <DataTable />
</div>

// ✅ Flujo enfocado — narrow container
<div className="max-w-3xl mx-auto p-6">
  <WizardForm />
</div>

// ✅ Auth — compact centered card
<div className="max-w-md mx-auto mt-20 p-6">
  <LoginForm />
</div>
```

---

### 8.3 Plantillas de Layout de Página

#### 8.3.1 Toolbar + DataTable (CRUD estándar)

**Usar en:** productos, clientes, proveedores, categorías, impuestos, roles, usuarios.

```
┌──────────────────────────────────────────────┐
│ [Crear Nuevo]                    [Buscar...] │  ← Toolbar: flex justify-between mb-6
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │  ID  │ Nombre    │ Precio │ Acciones    │ │  ← DataTable: rounded-md overflow-x-auto
│ │  ... │ ...       │ ...    │ [✏️] [🗑️]  │ │
│ └──────────────────────────────────────────┘ │
│            ← 1-10 de 50 →                    │  ← Paginación
└──────────────────────────────────────────────┘
```

```tsx
function CrudPage() {
  return (
    <SlideForm open={...} title={...} panel={<Form />}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">{t('module.title')}</h2>
        <Button onClick={handleCreate}>{t('module.create')}</Button>
      </div>
      {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}
      <DataTable columns={columns} rows={data} ... />
    </SlideForm>
  );
}
```

#### 8.3.2 Dashboard Grid (Bento KPI + Charts)

**Usar en:** página principal de dashboard.

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Ventas Hoy  │  Clientes    │  Productos   │  Órdenes     │  ← KPI row: 4 cards, grid-cols-4
│  Bs. 15,000  │  142 activos │  350 en inv. │  12 pend.    │
├──────────────────────────────┬──────────────┤
│                              │  Stock Alerts │              │  ← 2/3 + 1/3 split
│  Ventas (gráfica)            │  ⚠ Bajo      │              │
│                              │  ⚠ Agotado   │              │
├──────────────────────────────┴──────────────┤
│  Órdenes Recientes (tabla completa)         │              │  ← Full-width section
└─────────────────────────────────────────────┘
```

```tsx
function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Ventas Hoy" value="Bs. 15,000" />
        <KpiCard title="Clientes" value="142" />
        <KpiCard title="Productos" value="350" />
        <KpiCard title="Órdenes" value="12" />
      </div>
      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><SalesChart /></div>
        <div className="lg:col-span-1"><StockAlerts /></div>
      </div>
      {/* Full-width table */}
      <RecentOrders />
    </div>
  );
}
```

#### 8.3.3 Split Panel (Maestro-Detalle)

**Usar en:** POS, edición de factura, vista previa de documento.

```
┌──────────────────────┬──────────────────────────┐
│                      │                          │
│  Lista principal     │  Panel de detalle        │
│  (60% width)         │  (40% width)             │
│                      │                          │
│  - Item 1            │  Nombre: ...             │
│  - Item 2            │  Precio: ...             │
│  - Item 3            │  Cantidad: ...           │
│                      │                          │
└──────────────────────┴──────────────────────────┘
```

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
  <div className="lg:col-span-2 overflow-y-auto">
    <MainList />
  </div>
  <div className="lg:col-span-1 border-l pl-6">
    <DetailPanel />
  </div>
</div>
```

#### 8.3.4 Stack Vertical (Flujo paso a paso)

**Usar en:** setup, wizard de configuración, checkout.

```tsx
<div className="max-w-2xl mx-auto space-y-8 py-8">
  <Step title="Paso 1: Información básica">
    <BasicInfoForm />
  </Step>
  <Step title="Paso 2: Configuración fiscal">
    <TaxConfigForm />
  </Step>
  <Step title="Paso 3: Confirmación">
    <ConfirmationSummary />
  </Step>
</div>
```

---

### 8.4 Jerarquía de Cards

Tres niveles de card, del más prominente al más sutil:

| Nivel | Clases | Uso |
|---|---|---|
| **Card Primaria** | `rounded-xl border border-border bg-card p-6 shadow-sm` | Widgets de dashboard, tarjetas principales de contenido, KPI cards |
| **Card Secundaria** | `rounded-lg border bg-card p-5` | Sub-secciones dentro de SlideForm, cards informativas |
| **Card Muted** | `rounded-lg border bg-muted/30 p-4` | Resúmenes financieros, secciones de cálculo, notas, sub-secciones anidadas |

```tsx
// ✅ Card Primaria — widget de dashboard
<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Ventas del Mes</h3>
  <p className="text-3xl font-bold text-primary tracking-tight">Bs. 45,200.00</p>
</div>

// ✅ Card Secundaria — formulario dentro de SlideForm
<div className="bg-background rounded-xl p-5 space-y-5">
  <FormFields />
</div>

// ✅ Card Muted — sub-sección de cálculo
<div className="rounded-lg border bg-muted/30 p-4">
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">Subtotal</span>
    <span className="font-medium tabular-nums">Bs. 1,200.00</span>
  </div>
</div>
```

**Regla de nesting:** Máximo **2 niveles** de cards anidadas. Una Card Primaria puede contener Cards Muted. Una Card Muted **no** debe contener otra card.

```
✅ Card Primaria
   ├── Card Muted (permitido)
   └── Card Muted (permitido)
   ❌ Card Muted → Card Muted → Card Muted (prohibido)
```

---

### 8.5 Layout de Formularios

#### 8.5.1 Stack Vertical (estándar)

```tsx
// 90% de los formularios usan este patrón
<div className="space-y-4">
  <div className="space-y-2">
    <Label>{t('field.name')}</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>{t('field.email')}</Label>
    <Input type="email" />
  </div>
  <Button type="submit">{t('common.save')}</Button>
</div>
```

#### 8.5.2 Dos Columnas (formularios densos)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>{t('customers.field.firstName')}</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>{t('customers.field.lastName')}</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>{t('customers.field.email')}</Label>
    <Input type="email" />
  </div>
  <div className="space-y-2">
    <Label>{t('customers.field.phone')}</Label>
    <Input type="tel" />
  </div>
</div>
```

#### 8.5.3 Secciones agrupadas (formularios largos)

```tsx
<div className="space-y-6">
  {/* Sección 1 */}
  <fieldset className="border-b pb-6">
    <legend className="text-base font-semibold mb-4">
      {t('section.basicInfo')}
    </legend>
    <div className="space-y-4">
      <FormFields />
    </div>
  </fieldset>
  {/* Sección 2 */}
  <fieldset className="border-b pb-6">
    <legend className="text-base font-semibold mb-4">
      {t('section.fiscalInfo')}
    </legend>
    <div className="space-y-4">
      <FormFields />
    </div>
  </fieldset>
</div>
```

#### 8.5.4 Inline Row (campos cortos relacionados)

```tsx
// Moneda + monto — siempre juntos
<div className="flex items-end gap-3">
  <div className="space-y-2 w-32">
    <Label>{t('field.currency')}</Label>
    <Select>...</Select>
  </div>
  <div className="space-y-2 flex-1">
    <Label>{t('field.amount')}</Label>
    <Input />
  </div>
</div>
```

---

### 8.6 Espaciado y "Breathing Room"

El espacio negativo es tan importante como el contenido.

| Regla | Descripción |
|---|---|
| **Mínimo vital** | Nunca menos de `gap-4` (16px) entre elementos que no están lógicamente agrupados |
| **Separación de secciones** | ≥ `gap-6` (24px) o `border-b` entre secciones distintas |
| **Padding interior** | Todo contenedor con contenido tiene ≥ `p-4` (16px) de padding interior |
| **Borde no pegado** | El texto nunca toca el borde del contenedor — mínimo `px-4` o `p-4` |
| **Toolbar → contenido** | `mb-6` (24px) — la separación más grande de la página |
| **Entre cards del mismo grupo** | `gap-4` (16px) |
| **Entre grupos de cards** | `gap-6` o `space-y-6` (24px) |
| **Label → valor** | `mt-1` (4px) o `space-y-1` |
| **Último elemento → borde inferior** | ≥ `pb-4` — nunca dejar el último elemento sin espacio abajo |

```tsx
// ✅ Buen espaciado — cada sección respira
<div className="space-y-8">
  <section>
    <h2 className="text-lg font-semibold mb-4">Título de sección</h2>
    <div className="grid grid-cols-3 gap-4">
      <Card />
      <Card />
      <Card />
    </div>
  </section>
  <section>
    <h2 className="text-lg font-semibold mb-4">Otra sección</h2>
    <DataTable />
  </section>
</div>
```

---

### 8.7 Layout Responsive

| Breakpoint | Columnas de grid | Sidebar | Container |
|---|---|---|---|
| **Base (< 640px)** | 1 columna | Oculto (overlay con hamburger) | `px-4` padding |
| **sm (≥ 640px)** | 1-2 columnas | Overlay | `px-6` padding |
| **md (≥ 768px)** | 2-3 columnas | Colapsado (íconos) | `px-6 md:px-8` |
| **lg (≥ 1024px)** | 3-4 columnas | Expandido (texto + íconos) | `px-6 md:px-8` |
| **xl (≥ 1280px)** | 4-6 columnas | Expandido | `max-w-6xl mx-auto` opcional |
| **2xl (≥ 1536px)** | 6-8 columnas | Expandido | `max-w-7xl mx-auto` opcional |

```tsx
// ✅ Grid responsivo completo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// ✅ Sidebar-aware: el contenido principal tiene margen izquierdo solo en desktop
<main className={cn(
  "transition-all duration-200",
  sidebarExpanded ? "md:ml-64" : "md:ml-16"
)}>
  {children}
</main>
```

---

### 8.8 Altura de Contenedores

| Contexto | Altura | Clase |
|---|---|---|
| Widget KPI pequeño | 8rem | `h-32` |
| Widget KPI grande | 10rem | `h-40` |
| Card con gráfica | 16rem | `h-64` |
| Card con tabla pequeña (≤ 5 filas) | 12rem | `h-48` |
| Tabla scrollable | Altura calculada | `h-[calc(100vh-12rem)]` |
| Panel SlideForm | Full height | `h-full` |
| Modal content | Auto + max | `max-h-[85vh] overflow-y-auto` |

---

### 8.9 Anti-Patrones

| ❌ Anti-patrón | ✅ Corrección |
|---|---|
| Grid con más columnas que el breakpoint (ej: `md:grid-cols-3` con items `md:col-span-4`) | Ajustar grid o spans para que sumen ≤ columnas totales |
| Cards dentro de cards dentro de cards | Máximo 2 niveles de nesting |
| `mx-auto` sin `max-w-*` | Siempre combinar con `max-w-*` |
| Formulario full-width en pantalla grande | Usar `max-w-4xl mx-auto` para formularios > 800px |
| Elementos sueltos sin contenedor padre | Todo elemento visual pertenece a una card o sección |
| `text-justify` en cualquier texto | Nunca justificar — causa ríos de espacio blanco |
| `overflow-hidden` en el body o html | Usar `overflow-hidden` solo en contenedores específicos, no en raíz |
| Padding diferente en elementos hermanos del mismo nivel | Mismo padding horizontal para items del mismo nivel jerárquico |
| Texto pegado al borde del contenedor | Mínimo `p-4` o `px-4` en todo contenedor con texto |

---

*Referencia cruzada: AGENTS.md (Component Patterns) | architecture.md*
