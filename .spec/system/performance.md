# Performance — Límites y Baselines de Rendimiento

> **Principio rector:** El rendimiento es una feature, no una optimización posterior.  
> Si una pantalla tarda más de 3 segundos en ser interactiva, el usuario se va.

---

## 1. Backend — Límites por Request

| Métrica | Límite | Medición |
|---|---|---|
| Tiempo de respuesta P50 | ≤ 100ms | OpenTelemetry / pino con `responseTime` |
| Tiempo de respuesta P95 | ≤ 200ms | Igual |
| Tiempo de respuesta P99 | ≤ 500ms | Solo queries pesadas (reportes, exportaciones) |
| Queries Prisma por request | ≤ 10 queries | `prisma.$on('query')` counter por request |
| Tamaño máximo de payload response | ≤ 1MB | Content-Length header |
| Conexiones simultáneas de BD (pool) | ≤ 20 | `connection_limit` en DATABASE_URL |

### Regla anti-N+1

```typescript
// ❌ N+1 — una query por cada venta
const sales = await prisma.sale.findMany();
for (const sale of sales) {
  sale.details = await prisma.salesDet.findMany({
    where: { idSale: sale.id },
  });
}

// ✅ include
const sales = await prisma.sale.findMany({
  include: { details: true },
});
```

**Detección automática:** La regla `≤ 10 queries por request` en staging/producción atrapa N+1. Si un endpoint dispara más de 10 queries, se loggea warning y se abre issue.

### Timeouts

| Capa | Timeout |
|---|---|
| HTTP request (NestJS) | 30 segundos |
| Prisma query | 10 segundos |
| Generación de reportes | 60 segundos (background job) |
| Exportación de datos | 120 segundos (streaming) |

---

## 2. Frontend — Bundle Size

| Métrica | Límite | Medición |
|---|---|---|
| JS total por ruta (gzip) | ≤ 150 KB | `@next/bundle-analyzer` |
| CSS total por ruta (gzip) | ≤ 30 KB | Igual |
| First Load JS (cualquier ruta) | ≤ 200 KB | Igual |
| Lighthouse Performance Score | ≥ 90 | CI con Lighthouse CI |
| Largest Contentful Paint (LCP) | ≤ 2.5s | Lighthouse |
| First Input Delay (FID) / INP | ≤ 100ms | Lighthouse |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | Lighthouse |

### Reglas de bundle

1. **No importar librerías completas.** Usar imports con nombre:
   ```typescript
   // ❌ MAL
   import _ from 'lodash';
   
   // ✅ BIEN
   import debounce from 'lodash/debounce';
   ```

2. **Lazy loading obligatorio para features no-visibles en carga inicial:**
   ```typescript
   // POS, Reportes, Contabilidad solo cargan cuando se navega a ellos
   const PosPage = dynamic(() => import('@/features/pos/components/pos-page'), {
     loading: () => <PosPageSkeleton />,
   });
   ```

3. **Iconos de lucide: import individual, nunca barrel.**
   ```typescript
   // ❌ MAL
   import { Package, User, File } from 'lucide-react';
   
   // ✅ BIEN
   import Package from 'lucide-react/dist/esm/icons/package';
   import User from 'lucide-react/dist/esm/icons/user';
   // O usar el plugin de tree-shaking si está configurado
   ```

4. **Imágenes: usar `next/image` siempre.** No `<img>` nativo.

---

## 3. Base de Datos — Índices y Query Performance

### Queries que DEBEN tener índice

| Patrón | Ejemplo |
|---|---|
| `WHERE organization_id = X AND status = Y` | índice compuesto en `sales` |
| `WHERE rif = X` | `uq_customers_company_rif` |
| `WHERE email = X` (login) | `uq_users_email` |
| `ORDER BY created_at DESC` | `idx_{tabla}_created_at` |
| `WHERE deleted_at IS NULL` (soft delete) | `idx_{tabla}_deleted_at` |

### Verificación periódica

```sql
-- Encontrar queries lentas (PostgreSQL)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- más de 100ms promedio
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Encontrar tablas sin índices en columnas frecuentes
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 1000  -- Muchos escaneos secuenciales
ORDER BY seq_scan DESC;
```

---

## 4. Caching Strategy

| Capa | Qué se cachea | TTL | Invalidación |
|---|---|---|---|
| **NestJS (in-memory)** | Sesiones de usuario activas | Duración del token | Logout, cambio de contraseña |
| **Frontend (SWR/React Query)** | Respuestas de GET | 30 segundos (stale) | Refetch en focus, mutate después de POST/PATCH/DELETE |
| **Frontend (localStorage)** | Configuración de usuario (tema, shortcuts) | Indefinido | Al cambiar settings |
| **HTTP (CDN)** | Assets estáticos (fuentes, iconos) | 1 año (versionado por hash) | Nuevo build |
| **Prisma Accelerate / cache** | Queries de solo lectura (catálogo de productos) | 5 minutos | Al crear/editar/eliminar producto |

---

## 5. Monitoreo de Performance en CI

```yaml
# Lighthouse CI config
ci:
  collect:
    url:
      - http://localhost:3000/login
      - http://localhost:3000/dashboard
      - http://localhost:3000/pos
    numberOfRuns: 3
  assert:
    assertions:
      categories:performance:
        - error
        - minScore: 0.9
      categories:accessibility:
        - error
        - minScore: 0.9
      categories:best-practices:
        - error
        - minScore: 0.9
      first-contentful-paint:
        - warn
        - maxNumericValue: 2000
      largest-contentful-paint:
        - error
        - maxNumericValue: 3000
  upload:
    target: temporary-public-storage
```

---

## 6. Qué hacer cuando se rompe un límite

| Alerta | Acción inmediata | Responsable |
|---|---|---|
| P95 > 200ms | Revisar queries lentas con `pg_stat_statements`. Agregar índices faltantes. | Backend lead |
| Bundle > 150KB | Ejecutar `@next/bundle-analyzer`. Identificar dependencias pesadas. Evaluar lazy loading. | Frontend lead |
| Queries/request > 10 | Revisar código por N+1. Agregar `include` en Prisma. | Backend dev |
| Lighthouse < 90 | Auditoría manual con Chrome DevTools. Revisar imágenes sin optimizar, JS bloqueante. | Frontend dev |
| DB pool agotado | Revisar conexiones no liberadas. Aumentar pool solo si es justificado. | Backend dev + DevOps |

---

*Referencia cruzada: [database.md](database.md) — [architecture.md](architecture.md) — [deployment.md](../DevOps/deployment.md)*
