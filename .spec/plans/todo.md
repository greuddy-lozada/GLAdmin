# Infrastructure & UX Plan — Backlog Técnico ✅ COMPLETADO

> **status:** `done`  
> **Estado:** ✅ Todos los items implementados (1 abortado por decisión técnica)
> **Fecha:** Julio 2026
> **Última actualización:** 18 Julio 2026

> Agentes: no reimplementar. Referencia histórica / operacional si se necesita contexto de Redis/cache.

---

## Lista Original y Estado Final

| # | Item | Estado | Resolución |
|---|------|--------|------------|
| 1 | Connection pooling | ✅ **Completado** | `DATABASE_CONNECTION_LIMIT=5` documentado en `.env.example` (Task 1.1) |
| 2 | Cache layout (Redis) | ✅ **Completado** | `CacheService` + `ioredis` + fallback in-memory. Integrado en ProductsService, ExchangeRatesService, TenantMiddleware |
| 3 | Pruebas de carga (K6) | ✅ **Completado** | 4 scripts K6 (smoke, products-read, pos-sale, sync-pull) + npm scripts |
| 4 | Security filters | ✅ **Completado** | Throttle tiers, SanitizePipe, Permissions-Policy middleware, audit 401/403 |
| 5 | Zod validation | ✅ **Completado** | env.ts, productSchema, customerSchema con RIF regex, `.passthrough()` |
| 6 | Boneyard library | ❌ **Abortado** | Spike técnico: compatible con React 19 + Next 16 + Turbopack, pero requiere staging server o auth bypass para snapshot. Abortado en favor de skeletons shadcn existentes (cumplen spec) |
| 7 | 3D immersive styling | ✅ **Completado** | `.card-3d` + `.tilt-layer` utilities en globals.css, aplicado a login, dashboard BentoGridItem, POS ProductCard |
| 8 | Tables to cards on mobile | ✅ **Completado** | `DataTable` con dual rendering (table + MobileCardList), skeleton loading en cards |

---

## 1. Connection Pooling — Cierre

### Task 1.1 — Documentar variable

**Archivo:** `backend/.env.example`

```bash
# Database (PostgreSQL local via Podman)
DATABASE_URL="postgresql://cuadra:cuadra_dev@localhost:5432/cuadra_dev"
DATABASE_CONNECTION_LIMIT=5
```

Verificar que `backend/.env` local también la tenga. Nada más — el pooling ya lo gestiona el driver de Postgres vía Prisma.

---

## 2. Cache Layout (Redis)

### Decisión de diseño

| Decisión | Valor | Justificación |
|---|---|---|
| Cliente | `ioredis` + `CacheService` propio (~60 líneas) | `cache-manager` + adapters agregan superficie sin valor para 3 casos de uso. ponytail: un servicio pequeño, control total |
| Patrón | Cache-aside (read-through manual) | Invalidación explícita en CUD. Sin magia |
| Fallback | `Map` in-memory si `REDIS_URL` no está seteada | Dev local sin Redis funciona igual. Graceful degradation (AGENTS.md) |
| Redis caído | Try/catch → pasa a BD, log warning | El cache nunca tumba la app |

### Casos de uso (TTL)

| Dato | TTL | Invalidación |
|---|---|---|
| Exchange rate del día | 5 min | Al crear/actualizar `ExchangeRateDay` |
| Catálogo de productos por org (`products:list:{orgId}:{page}`) | 5 min | CUD en `ProductsService` |
| Plan + módulos por org (`plan:{orgId}`) | 10 min | Al aprobar `SubscriptionPayment` o degradar plan |

### Plan

#### Fase 1 — Infra
1. `pnpm --filter backend add ioredis`
2. `docker-compose.yml`: agregar servicio `redis:7-alpine` (puerto 6379, volume `redis_data`)
3. `backend/.env.example`: `REDIS_URL="redis://localhost:6379"`
4. Documentar comando Podman en `deployment.md`: `podman run -d --name cuadra-redis -p 6379:6379 redis:7-alpine`

#### Fase 2 — CacheService
5. Crear `backend/src/shared/cache/cache.module.ts` (global)
6. Crear `backend/src/shared/cache/cache.service.ts`:
   - `get<T>(key): Promise<T | null>`, `set(key, value, ttlSeconds)`, `del(pattern)`
   - Constructor: si `REDIS_URL` existe → `new Redis(url)` con `lazyConnect`, `maxRetriesPerRequest: 1`; si no → `Map` con expiración por timestamp
   - Todo método envuelto en try/catch → log + `null` (nunca lanza)

#### Fase 3 — Integración
7. `exchange-rates.service.ts`: cachear tasa del día (`rate:day:{orgId}`), invalidar en `update`
8. `products.service.ts` `findAll`: cachear página, invalidar en `create/update/remove`
9. `PlanLevelGuard` / plan lookup: cachear `plan:{orgId}`, invalidar en `subscription-payment.service.ts#review` y `subscription-lifecycle.service.ts`

#### Fase 4 — Tests
10. `cache.service.spec.ts`: get/set/expiración/del, fallback in-memory, Redis caído → retorna null sin lanzar

**Archivos:** ~7 nuevos/modificados.

---

## 3. Pruebas de Carga (K6)

### Plan

#### Fase 1 — Setup
1. Instalar K6 (binario, documentado — no es dependencia pnpm): `sudo dnf install k6` o `brew install k6`
2. Crear `load/` en raíz del monorepo (no es workspace package; K6 corre los scripts directo)

#### Fase 2 — Scripts
3. `load/lib/auth.js` — helper: login → `{ accessToken }` reutilizable
4. `load/smoke.k6.js` — 1 VU, 1 min: health + login + GET /api/products (sanity check del entorno)
5. `load/products-read.k6.js` — rampa 0→50 VUs en 2 min, sostenido 5 min: GET /api/products paginado
6. `load/pos-sale.k6.js` — 20 VUs, 5 min: flujo POS (login → GET products → POST /api/sales) — **apunta a staging, nunca a prod**
7. `load/sync-pull.k6.js` — 30 VUs: GET /api/sync/pull (endpoint crítico del offline-first)

#### Fase 3 — Thresholds (de `performance.md` §1)

```javascript
// En cada script
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
};
```

#### Fase 4 — Integración
8. Root `package.json`: `"test:load": "k6 run load/smoke.k6.js"`, `"test:load:pos": "k6 run load/pos-sale.k6.js"`
9. Documentar en `deployment.md`: cómo correr contra local (`pnpm dev` arriba) y contra staging
10. Verificación: `k6 run load/smoke.k6.js` pasa con thresholds en verde contra local

**Archivos:** ~6 nuevos. Los scripts de carga contra staging son prerequisito del Soft Launch Alpha (`product-strategy.md` roadmap).

---

## 4. Security Filters — Full Hardening Pass

### 4.1 Throttle tiers (`security.md` §6)

**Archivos:** `products.controller.ts`, `customers.controller.ts`, `sales.controller.ts`, `sync.controller.ts`

- GET listados (`products`, `customers`): ya cubiertos por el global 100/min — sin cambio
- Escrituras POS/ventas: `@Throttle({ default: { limit: 30, ttl: 60000 } })` en `POST/PATCH` de `sales.controller.ts`
- Sync (alta frecuencia legítima): verificar que el global no estrangula el sync offline; si sí, `@Throttle({ default: { limit: 120, ttl: 60000 } })` documentando el porqué
- Reports: tier 10/min **cuando exista el módulo** — anotado, no implementar ahora (YAGNI)

### 4.2 Sanitización de inputs

**Decisión:** pipe global propio en vez de `class-sanitizer` (paquete estancado). `class-transformer` ya está instalado.

**Archivo nuevo:** `backend/src/common/pipes/sanitize.pipe.ts`

- Recorre recursivamente el body: `trim()` a todos los strings, elimina null bytes (`\0`)
- **Nunca toca** campos llamados `password`, `token`, `secret`, `currentPassword`, `newPassword`
- NO hace escaping HTML — eso rompe datos legítimos (nombres con `&`, razones sociales). XSS se previene con output encoding de React (automático) + CSP (ya activa). Decisión documentada aquí y en `security.md`
- Registrar en `main.ts` antes del `ValidationPipe`

**Tests:** `sanitize.pipe.spec.ts` — trim recursivo, null bytes, campos de password intactos, objetos anidados.

### 4.3 Permissions-Policy header

Helmet 8 ya no incluye este módulo. En `main.ts`, después de `helmet()`:

```typescript
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
```

### 4.4 Audit log de accesos denegados

**Archivo:** `backend/src/common/filters/http-exception.filter.ts`

- En el catch, si status es 401 o 403 → `AuditLogService.log({ action: 'ACCESS_DENIED', userId?, ip, path, status })`
- Fire-and-forget (`.catch()` con log) — el audit nunca rompe la respuesta de error
- Campos: timestamp, IP, path, método, userId si hay token válido, status. **Sin** body (puede contener passwords)

**Tests:** extender tests del filter — 403 registra audit, 500 no registra, fallo de audit no altera la respuesta.

### 4.5 Actualizar spec

- `security.md` §6: marcar tiers implementados, documentar decisión de sanitización (trim, no escaping) y Permissions-Policy manual

**Archivos:** ~8 modificados/creados + tests.

---

## 5. Zod Validation (Frontend)

### Decisión de diseño

| Capa | Herramienta | Por qué |
|---|---|---|
| Backend DTOs | class-validator (sin cambio) | Spec mandatorio (AGENTS.md) |
| Frontend env vars | Zod | Fallar rápido al arrancar si falta `NEXT_PUBLIC_API_URL` |
| Frontend API boundary | Zod `.parse()` en services | Contrato frontend↔backend verificado en runtime; drift detectado en dev, no en prod |
| Formularios | Zod schemas reutilizando los del modelo | Validación UX inmediata (backend sigue siendo fuente de verdad) |

### Plan

#### Fase 1 — Setup + env
1. `pnpm --filter frontend add zod`
2. Crear `frontend/src/config/env.ts`: schema zod para `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`; exportar objeto parseado. Importar en `api-client.ts` reemplazando `process.env` directo

#### Fase 2 — API boundary (piloto: products + customers)
3. En `products/models/product.model.ts`: `productSchema = z.object({...})` + `type Product = z.infer<typeof productSchema>` (el schema ES el modelo — una sola fuente)
4. En `products/services/product.service.ts`: `productSchema.array().parse(res.data.data)` en findAll; `productSchema.parse()` en getById/create/update
5. Igual para `customers` (model + service)
6. Estrategia de error: `.parse()` lanza → el catch del hook muestra `module.error.load`. En dev, el error de zod en consola dice exactamente qué campo driftó

#### Fase 3 — Formularios críticos
7. `CreateProductSchema` (zod) validando en el form antes del submit — mensajes vía keys i18n existentes
8. `CreateCustomerSchema` con regex de RIF `/^[JVEGP]-\d{5,9}-\d{1}$/` (espejo del backend)

#### Fase 4 — Rollout incremental
9. Resto de módulos (sales, POS, auth) se migran al tocarse — regla: todo archivo de modelo editado desde ahora incluye su schema zod. No hacer PR masivo (blast radius)

**Tests:** `env.test.ts` (falla sin var), `product.service.test.ts` con MSW (payload válido pasa, payload con drift lanza).

**Archivos:** ~10 modificados/creados en fases 1–3.

---

## 6. Boneyard — Skeleton Screens Automáticos ❌ ABORTADO

> **Decisión:** La librería es técnicamente compatible con React 19 + Next 16 + Turbopack, pero el workflow de captura requiere un servidor staging sin auth o un bypass de autenticación. El valor marginal sobre los skeletons manuales de shadcn no justifica la complejidad operativa en este momento.

### Resultado del Spike (18 Julio 2026)

| Paso | Resultado | Detalle |
|------|-----------|---------|
| `pnpm add boneyard-js` | ✅ | Instalación exitosa v1.9.0 |
| TypeScript type resolution | ✅ | `import { Skeleton } from 'boneyard-js/react'` compila sin errores |
| JSX component compilation | ✅ | `<Skeleton>` con props `name`, `loading`, `children`, `fixture` funciona |
| CLI runs `boneyard-js build` | ✅ | Playwright se lanza, navega páginas, maneja redirects |
| Snapshot auth-gated pages | ❌ | Dashboard pages redirigen a `/login`; `/login` redirige a `/login/` (trailing slash). Sin auth en headless browser, no se puede capturar |
| Bones generados | ❌ | `boneyard: nothing captured` — sin página accesible con `<Skeleton>` montado |

### Decisión

**Abortar.** Los skeletons manuales de shadcn (`@/components/ui/skeleton`) cumplen el spec (`design-system.md` §2.1) sin dependencia adicional, sin paso de build, y sin necesidad de staging server. Revisitar boneyard si:
- Se despliega un staging server accesible sin auth, o
- Se implementa un bypass de auth para herramientas de desarrollo

---

## 7. 3D Immersive Styling (CSS-only)

### Decisión

Cero dependencias. Utilities CSS con `perspective`, `transform-style: preserve-3d`, tilt on hover. Bundle impact: ~0.5KB de CSS. Respeta `prefers-reduced-motion` (obligatorio, `design-system.md` §7.6) y duración ≤200ms (§5).

### Plan

#### Fase 1 — Utilities en `frontend/src/app/globals.css`

```css
@utility card-3d {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  transform-style: preserve-3d;
  &:hover {
    transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

@utility tilt-layer {
  transform: translateZ(20px);
}

@media (prefers-reduced-motion: reduce) {
  .card-3d, .card-3d:hover { transform: none; transition: none; }
}
```

#### Fase 2 — Aplicación (sutil, feedback no decoración)
1. Login card (`(auth)/login`) — primera impresión
2. KPI cards del dashboard (`dashboard-bento`) — `card-3d` + `tilt-layer` en el número
3. POS `ProductCard` — hover tilt muy leve (≤2deg, no distraer en uso intensivo)
4. Landing (`app/page.tsx`): parallax simple con `translateZ` en hero si existe

#### Fase 3 — Verificación
5. Lighthouse: sin regresión de performance/CLS (CSS transforms no mueven layout)
6. DevTools → Rendering → `prefers-reduced-motion` emulado: animaciones off
7. Checklist a11y: el tilt nunca aplica a elementos con texto pequeño denso (legibilidad)

**Archivos:** 1 modificado (globals.css) + ~4 componentes tocados (una clase cada uno).

---

## 8. Tables → Cards on Mobile

### Decisión de diseño

`DataTable` renderiza dos vistas: tabla (`hidden md:block`) y cards (`md:hidden`). En modo card **todas** las columnas se muestran como pares label/valor — el flag `responsive: 'desktop'` deja de ocultar datos en móvil (ese flag se depreca; las cards tienen espacio vertical).

### Estructura de card (por fila)

```
┌─────────────────────────────┐
│ {col[0] render}  ← título   │  text-sm font-semibold
│ Label2: Valor2              │  text-xs muted label / text-sm valor
│ Label3: Valor3              │
│ ─────────────               │
│              [✏️] [🗑️]      │  acciones, justify-end
└─────────────────────────────┘
```

### Plan

**Archivo:** `frontend/src/components/ui/data-table.tsx` (único componente afectado — todas las páginas lo heredan)

1. Extraer el contenido de celda a un helper compartido (mismo `flexRender` para tabla y card)
2. Agregar `MobileCardList` interno: mapea `table.getRowModel().rows`, primera columna visible = título, resto = label (`headerName`, `text-xs text-muted-foreground`) + valor
3. Acciones (edit/delete) al pie de la card con los mismos `aria-label`
4. Contenedor: `<div className="md:hidden space-y-3">` para cards; wrapper de tabla existente pasa a `hidden md:block`
5. Skeleton móvil: cards con `Skeleton` (no filas de tabla) cuando `loading`
6. Paginación: footer compartido, fuera del toggle de vistas
7. `EmptyState` igual en ambas vistas (ya existe)
8. i18n: labels ya vienen traducidos en `column.headerName` — cero strings nuevos salvo ninguno

**Tests:** `data-table.test.tsx` — renderiza cards en viewport móvil (mock `matchMedia`), todas las columnas presentes como label/valor, acciones disparan `onEdit`/`onDelete`.

**Migración de páginas:** ninguna — es transparente. El flag `responsive` queda deprecated (JSDoc `@deprecated`), se limpia de las páginas al tocarlas.

**Archivos:** 1 modificado + 1 test nuevo.

---

## Ejecución Final

Todos los items fueron implementados en el orden: 1.1 → §4 → §2 → §3 → §5 → §8 → §7 → §6 (abortado).

---

## Riesgos y Mitigaciones — Post-hoc

| Riesgo | Resultado |
|---|---|
| `boneyard-js` incompatible con React 19 / Next 16 Turbopack | Compatible, pero abortado por complejidad operativa (auth-gated pages). Fallback: shadcn skeletons |
| Redis agrega fricción al setup de dev | Mitigado: fallback in-memory sin `REDIS_URL`. Redis opcional |
| Cache stale muestra tasa de cambio vieja | Mitigado: TTL 5 min + invalidación explícita en CUD |
| Sanitize pipe corrompe datos legítimos | Mitigado: solo trim + null bytes. Passwords excluidos. Tests passing |
| Throttle 30/min estrangula POS legítimo | Pendiente de medir con K6 contra staging |
| Zod drift check rompe pantallas en prod | Mitigado: `.passthrough()` en schemas de respuesta |
| Cards móvil: columnas con `render` complejo | Implementado: mismo render que tabla en formato card |

---

*Referencia cruzada: [security.md](../system/security.md) | [performance.md](../system/performance.md) | [design-system.md](../UI-UX/design-system.md) | [deployment.md](../DevOps/deployment.md) | [implementation-priorities.md](implementation-priorities.md)*
