# Audit Report — Diseño y Layout (Tipografía + Contenedores)

> **Fecha:** 2026-07-03  
> **Reglas auditadas:** `.spec/UI-UX/design-system.md` §3 (Tipografía y Legibilidad) + §8 (Grids, Contenedores y Layout)  
> **Alcance:** Frontend (Next.js + Tailwind + shadcn/ui)

---

## Resumen Ejecutivo

| Área | Hallazgos Críticos | Hallazgos Altos | Hallazgos Medios | Hallazgos Bajos |
|---|---|---|---|---|
| Tipografía (§3) | 2 | 2 | 3 | 1 |
| Layout (§8) | 0 | 2 | 2 | 2 |
| Datos financieros (§3.11) | 2 | 2 | 1 | 0 |
| **TOTAL** | **4** | **6** | **6** | **3** |

**Hallazgos sistémicos:** Tres utilidades de diseño definidas en el spec **nunca se han usado** en la implementación: `tabular-nums` (0 usos), `leading-relaxed` (0 usos), `max-w-prose` (0 usos).

---

## 1. Tipografía (§3) — 8 hallazgos

### 🔴 Críticos

| ID | Regla violada | Descripción | Ubicación |
|---|---|---|---|
| TYP-01 | §3.2 — Labels `font-semibold` | **~70 labels** de formulario sin `font-semibold`. Todos los `<Label>` en feature pages (products, customers, suppliers, companies, purchase-orders, payment-modal) carecen de peso. | 7 archivos, ~70 líneas |
| TYP-02 | §3.11, §3.13.7 — `tabular-nums` | **0 usos de `tabular-nums` en todo el código.** ~40 posiciones de montos financieros (`.toFixed()`) muestran dígitos proporcionales que no se alinean visualmente en columnas. | 12 archivos (ver tabla abajo) |

### 🟠 Altos

| ID | Descripción |
|---|---|
| TYP-03 | **0 usos de `leading-relaxed`** en todo `features/`. ~25 `<p>` y bloques de texto descriptivo que deberían usar `leading-relaxed` según §3.1 y §3.5. |
| TYP-04 | **0 usos de `max-w-prose`** en todo `features/`. Los bloques de texto descriptivo (instrucciones de pago, descripciones) no tienen límite de ancho de lectura. |

### 🟡 Medios

| ID | Descripción |
|---|---|
| TYP-05 | 5 códigos/números de control (`code`, `controlNumber`) sin `font-mono` en: `products-page.tsx:74`, `purchase-orders-page.tsx:134,534`, `recent-orders-panel.tsx:42`, `products-page.tsx:258`. |
| TYP-06 | 2 bloques con `text-center` de más de 2 líneas: `payment-modal.tsx:87` (4-5 líneas), `receipt-dialog.tsx:36` (5 líneas). §3.13.5 prohíbe centrar texto > 2 líneas. |
| TYP-07 | 1 uso de `uppercase` con `font-medium` en vez de `font-semibold`: `shortcuts-page.tsx:129`. |

### 🟢 Bajo

| ID | Descripción |
|---|---|
| TYP-08 | `billing-cash.tsx:46` y `billing-pago-movil.tsx:116` — párrafos instruccionales multi-línea sin `leading-relaxed`. |

---

## 2. Layout y Contenedores (§8) — 6 hallazgos

### 🟠 Altos

| ID | Regla violada | Descripción | Ubicación |
|---|---|---|---|
| LAY-01 | §8.9 — Grid overflow | `BentoGrid` usa `md:grid-cols-3` pero `dashboard-bento.tsx:31` usa `md:col-span-4`. Span excede columnas — el item desborda a la siguiente fila. | `dashboard-bento.tsx:31` |
| LAY-02 | §8.2 — Contenedor ausente | **7 páginas** sin `max-w-*` explícito: products, purchase-orders, pago-movil-transactions, pago-movil-config, shortcuts, billing, admin-orgs. La spec exige container type definido. | 7 feature pages |

### 🟡 Medios

| ID | Descripción |
|---|---|
| LAY-03 | `sync/conflicts-page.tsx:33,42` — usa `container mx-auto` (Tailwind container implícito) en vez de `max-w-*` explícito. §8.9: "mx-auto sin max-w-*" es anti-patrón. |
| LAY-04 | `pos-toolbar.tsx:22` — toolbar usa `mb-4` (16px). §8.6 exige `mb-6` (24px) para toolbar→contenido. |

### 🟢 Bajos

| ID | Descripción |
|---|---|
| LAY-05 | `billing-page.tsx:68,93` — `gap-4` a nivel de página. §8.6: entre secciones debe ser `gap-6`. |
| LAY-06 | §8.4 nesting (✅ 0 violaciones). §8.6 padding bottom (✅ 0 violaciones). §8.6 text touching edges (✅ 0 violaciones). |

---

## 3. Datos Financieros (§3.11) — 5 hallazgos

### 🔴 Críticos

| ID | Regla violada | Descripción |
|---|---|---|
| FIN-01 | §3.11, §3.7 — `text-right` | **14 montos** en summary sections y cards sin `text-right`. En `flex justify-between`, el span del monto (lado derecho) debe tener `text-right` explícito. |
| FIN-02 | §3.11 — `tabular-nums` | Duplicado de TYP-02: **0 usos** en todo el proyecto. Cada `.toFixed()` muestra dígitos proporcionales. |

### 🟠 Altos

| ID | Descripción |
|---|---|
| FIN-03 | 5 total displays sin `text-primary`: `sale-summary.tsx:42,53`, `payment-modal.tsx:88`, `purchase-orders-page.tsx:713`, `receipt-dialog.tsx:39`. §3.11: totales deben ser `text-primary font-bold`. |
| FIN-04 | `purchase-orders-page.tsx:703` — total principal usa `font-semibold` en vez de `font-bold`. §3.11 exige `font-bold` para totales. |

### 🟡 Medio

| ID | Descripción |
|---|---|
| FIN-05 | `purchase-orders-page.tsx:164` — monto de retención negativo en DataTable sin `text-destructive`. Renderizado como string plano sin clase de color. |

---

## 4. Archivos con más violaciones

| Archivo | TYP | LAY | FIN | Total |
|---|---|---|---|---|
| `purchase-orders-page.tsx` | 6 | 1 | 6 | **13** |
| `sale-summary.tsx` | 6 | — | 3 | **9** |
| `payment-modal.tsx` | 7 | — | 2 | **9** |
| `products-page.tsx` | 3 | 1 | 1 | **5** |
| `receipt-dialog.tsx` | 3 | — | 2 | **5** |
| `billing-pago-movil.tsx` | 3 | 1 | 1 | **5** |
| `customers-page.tsx` | 1 | 1 | — | **2** |
| `dashboard-bento.tsx` | 1 | 1 | — | **2** |
| `pos-toolbar.tsx` | — | 1 | — | **1** |

---

## 5. Priorización de Correcciones

### 🔥 Prioridad 1 — DataTable (corrige ~40 violaciones de una vez)

Modificar `components/ui/data-table.tsx` para:
1. Columnas declaradas como numéricas automáticamente reciban `text-right tabular-nums`
2. Agregar prop `isNumeric?: boolean` a la interfaz `Column<T>`

### 🔥 Prioridad 2 — `tabular-nums` + `text-right` en montos (12 archivos, ~40 posiciones)

Agregar `tabular-nums` a todo `.toFixed()` y `text-right` a todo monto en summary.

### ⚡ Prioridad 3 — Labels `font-semibold` (7 archivos, ~70 labels)

Opción A: Modificar el componente `<Label>` base de shadcn para que `font-semibold` sea default.  
Opción B: Agregar `className="font-semibold"` a cada `<Label>` en feature pages.

### ⚡ Prioridad 4 — `text-primary` en totales (5 posiciones)

### ⚡ Prioridad 5 — Grid fix en BentoGrid (1 línea)

Cambiar `md:grid-cols-3` → `md:grid-cols-6` o ajustar spans.

### 📋 Prioridad 6 — `max-w-*` en 7 páginas sin contenedor

### 📋 Prioridad 7 — `leading-relaxed` y `max-w-prose` en bloques de texto

---

*Generado contra `.spec/UI-UX/design-system.md` §3 + §8. Julio 2026.*
