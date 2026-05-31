# Audit Fixes

Correcciones identificadas en la auditoría combinada de **React Doctor** (71/100) y **Code Review**. Todas deben resolverse antes de producción.

---

## 🔴 Critical — Bloquean producción

### 1. Multi-tenant isolation bypass vía `x-organization-id`

**Archivo:** `backend/src/modules/tenant/tenant.middleware.ts:59-68`

**Problema:** El header `x-organization-id` tiene prioridad sobre el JWT `orgId` sin verificar que el usuario sea miembro de la org solicitada. Un usuario de org A puede enviar `x-organization-id: <orgB_id>` y operar en org B.

**Fix:** Extraer `userId` del JWT, buscar `UserOrganization` para verificar membresía antes de aceptar el org ID. Usar `orgId` del JWT como source of truth a menos que se solicite una alternativa verificada.

---

### 2. Sync engine nunca se inicializa — offline sync muerto

**Archivos:**
- `frontend/src/lib/sync/sync-engine.ts`
- `frontend/src/lib/sync/network-status.ts`

**Problema:** `syncEngine.start()` y `networkStatus.start()` nunca se llaman desde ningún componente, layout, hook o provider. No hay pull periódico, no se hace push de mutaciones encoladas, no hay BroadcastChannel leader election, no hay health pings. El POS offline escribe a Dexie pero las mutaciones quedan encoladas para siempre.

**Fix:**
1. Llamar `syncEngine.start()` y `networkStatus.start()` desde `AuthProvider` después de autenticación exitosa.
2. Llamar `syncEngine.onOrgSwitch()` desde `AuthProvider.selectOrg()`.
3. Verificar que el `SyncIndicator` refleje el estado real.

---

### 3. Offline PIN SHA-256 sin salt — crackeable

**Archivos:**
- `frontend/src/features/auth/components/pin-setup.tsx:29-33`
- `frontend/src/features/auth/components/pin-unlock.tsx:25-28`

**Problema:** PIN de 4-6 dígitos (10K-1M posibilidades) hasheado con SHA-256 puro, sin salt, sin iteraciones, almacenado en IndexedDB accesible desde cualquier página del mismo origen. Un atacante con acceso al disco precomputa todos los hashes y matchea instantáneamente.

**Fix:**
1. Usar PBKDF2 o argon2id con salt aleatorio almacenado junto al hash.
2. Limitar intentos de PIN con exponential backoff en localStorage/IndexedDB.
3. Como mínimo, usar `crypto.subtle.importKey` + `deriveBits` con salt aleatorio.

---

### 4. JWT secret hardcodeado como fallback

**Archivo:** `backend/src/app.module.ts:51`

**Problema:** `process.env.JWT_SECRET ?? 'gladmin-dev-secret'` — si se despliega sin `JWT_SECRET`, todos los tokens son forgeables con un string conocido.

**Fix:** Lanzar error en startup si `JWT_SECRET` no está definido en producción (`NODE_ENV === 'production'`). Mantener el fallback solo en development.

---

### 5. `Role.slug` sin constraint `@unique`

**Archivo:** `backend/prisma/schema.prisma:17`

**Problema:** Slugs duplicados (ej. dos `master`) harían ambiguo el RolesGuard — `user.role?.slug` matchea cualquiera que Prisma devuelva primero.

**Fix:** Agregar `@unique` a `slug` en el modelo `Role`. Requiere migración.

---

### 6. Refresh endpoint — DoS por bcrypt en loop

**Archivo:** `backend/src/modules/auth/auth.service.ts:190-205`

**Problema:** `refresh` busca TODOS los `RefreshToken` no expirados y hace `bcrypt.compare()` en loop. Con 100 usuarios activos = 100 bcrypts por refresh. Un atacante puede martillar `/auth/refresh` con tokens basura.

**Fix:** Almacenar una clave de lookup no-secreta (prefijo del token, o UUID `tokenId`) para encontrar la fila exacta con una query, luego verificar con bcrypt una sola vez.

---

## 🟠 Important — Deben corregirse antes de producción

### 7. Sin rate limiting en auth

**Archivo:** `backend/src/modules/auth/auth.controller.ts`

**Problema:** Login, refresh, change-password y setup sin rate limiting. Brute-force de contraseñas sin impedimento.

**Fix:** Agregar `@nestjs/throttler` o rate limiter basado en Redis. Mínimo: 5 intentos/minuto por IP en login.

---

### 8. Stock decrement fuera de transacción DB

**Archivo:** `backend/src/modules/sales/sales.service.ts:18-53`

**Problema:** La venta se crea y luego el stock se decrementa en llamadas separadas. Un crash entre ambas deja la venta registrada pero el stock intacto. Si el create de venta funciona pero el decrement falla, el inventario queda inconsistente.

**Fix:** Envolver ambas operaciones en `this.prisma.$transaction`.

---

### 9. Sync endpoints sin `@Roles`

**Archivo:** `backend/src/modules/sync/sync.controller.ts`

**Problema:** El sync controller no tiene `@Roles()` ni `@MinLevel()`. Cualquier usuario autenticado puede hacer pull de todos los datos de productos/clientes/suppliers y push de mutaciones.

**Fix:** Agregar `@MinLevel(ROLE_LEVEL.employee)` como mínimo o `@Roles('master', 'executive', 'manager', 'employee')`.

---

### 10. `beforeunload` no bloquea navegación

**Archivo:** `frontend/src/lib/sync/sync-engine.ts:249-255`

**Problema:** El conteo asíncrono de pendientes resuelve después de que el handler retorna. `event.returnValue` debe setearse sincrónicamente en `beforeunload`. La promesa resuelve después de que el browser ya decidió descargar. El warning nunca se muestra.

**Fix:** Usar un flag sucio sincrónico (seteado en enqueue, limpiado en push) y verificarlo directamente.

---

### 11. BroadcastChannel leader election con race condition

**Archivo:** `frontend/src/lib/sync/sync-engine.ts:208-214`

**Problema:** Usa `setTimeout(1000)` para declarar liderazgo después de postear al canal. Múltiples tabs abriendo dentro de 1 segundo se vuelven todas líderes.

**Fix:** Usar `sessionStorage` como lock o hacer que los tabs declaren intención y esperen acknowledgment.

---

### 12. Sin CSRF protection

**Archivo:** `backend/src/main.ts`

**Problema:** CORS configurado con `credentials: true` pero sin token CSRF, sin `SameSite` en cookies, sin validación de `Origin`/`Referer`. Mitigado parcialmente por JWT en header `Authorization`.

**Fix:** Agregar `SameSite=Strict` a cookies si se usan, o implementar double-submit cookie pattern para operaciones state-changing.

---

### 13. Upload de comprobantes PagoMovil no implementado

**Archivo:** `specs/deferred-work.md §3` + `backend/src/modules/pago-movil/`

**Problema:** El campo `proofImage` existe en el modelo pero no hay endpoint de upload, no hay directorio de storage, no hay ruta de serving. Solo se puede ingresar URL manualmente.

**Fix:** Implementar endpoint de upload con multer, almacenar en `uploads/` o cloud storage, servir con ruta estática o signed URL.

---

### 14. Anti-patrón `Object.assign` en Prisma middleware

**Archivo:** `backend/src/shared/prisma/prisma.service.ts:49`

**Problema:** `Object.assign(this, extended)` reemplaza la instancia de PrismaClient después de `super()`. La documentación de Prisma recomienda retornar `this.$extends(...)` dentro del constructor. Funciona hoy pero es frágil entre versiones.

**Fix:** Refactorizar para usar `$extends` como retorno del constructor, o crear el cliente extendido en `OnModuleInit`.

---

## 🟡 Minor

### 15. `as any` residuales (5)
- `stocks.service.ts:25`
- `suppliers.service.ts:17`
- `taxes.service.ts:17`
- `withholdings.service.ts:40`
- `purchase-orders.service.ts:29`

**Fix:** Tipar correctamente los DTOs de creación con `Prisma.XCreateInput` o interfaces explícitas.

---

### 16. `organizationId: 1` hardcodeado en sync pull
**Archivo:** `frontend/src/lib/sync/sync-engine.ts:66,77,86-95`

**Problema:** Todo registro en el pull recibe `organizationId: 1`. La DB local de Dexie guarda el org ID incorrecto.

**Fix:** Usar el `orgId` del contexto de autenticación actual.

---

### 17. SQLite `strftime` rompe en PostgreSQL
**Archivo:** `backend/src/modules/dashboard/dashboard.service.ts:73`

**Problema:** Raw query con `strftime` solo funciona en SQLite. En PostgreSQL falla.

**Fix:** Usar Prisma query builder con `date_trunc` para PostgreSQL o abstraer la función de fecha.

---

### 18. IDs hardcodeados en seed
**Archivo:** `backend/prisma/seed.ts`

**Problema:** Usa `upsert` con IDs explícitos (1,2,3,...) que pueden conflictuar con autoincrement si el contador de secuencia se atrasa.

**Fix:** Usar patrón `findFirst` + `create` en lugar de `upsert` con IDs fijos, o usar `findUnique` con campo único (name/slug).

---

### 19. Sin endpoint `/health`
**Problema:** Solo existe `/api/sync/health`. Falta un health check estándar que verifique conectividad de DB.

**Fix:** Agregar `GET /api/health` en un HealthController que haga `prisma.$queryRaw` SELECT 1.

---

### 20. PIN setup sin opción de skip/dismiss
**Archivo:** `frontend/src/features/auth/components/pin-setup.tsx`

**Problema:** El modal fuerza al usuario a configurar PIN sin opción de omitir. Si cierra el tab a medio setup, queda trabado en el próximo login.

**Fix:** Agregar botón "Omitir" o "Configurar después".

---

### 21. `networkStatus` URL hardcodeada
**Archivo:** `frontend/src/lib/sync/network-status.ts:25`

**Problema:** Usa `/api/sync/health` directamente en lugar de usar `API_URL` de variables de entorno.

**Fix:** Usar `process.env.NEXT_PUBLIC_API_URL` o la URL configurada.

---

## 🩺 React Doctor — Issues priorizados

### Errores (2)

| Regla | Archivo | Fix |
|-------|---------|-----|
| `require-reduced-motion` | `package.json` | Agregar `useReducedMotion()` de framer-motion o media query CSS `prefers-reduced-motion` |
| `effect-needs-cleanup` | `src/lib/sync/hooks/use-sync-status.ts:10` | Retornar cleanup function del `useEffect` con `on(...)` |

### Warnings de alto impacto (agrupados)

| Categoría | Cantidad | Prioridad |
|-----------|----------|-----------|
| `use-lazy-motion` (ahorra ~30KB) | 7 | Alta |
| `no-array-index-key` | 7 | Alta |
| `no-array-index-as-key` | 6 | Alta |
| `button-has-type` | 6 | Alta |
| `click-events-have-key-events` + `no-static-element-interactions` | 6 | Alta |
| `nextjs-no-client-side-redirect` | 4 | Media |
| `no-react19-deprecated-apis` (useContext → use()) | 4 | Media |
| `exhaustive-deps` | 2 | Media |
| `design-no-redundant-size-axes` (w-N h-N → size-N) | 56 | Baja |
| `prefer-useReducer` | 18 | Baja |
| `unused-file` | 11 | Baja |
| `async-await-in-loop` | 10 | Baja |
| `no-derived-state` | 9 | Baja |
| `unused-export` | 9 | Baja |

---

## Secuencia recomendada

1. **Sprint 1 — Security blockers:** Fix #1 (isolation bypass), #3 (PIN salt), #4 (JWT secret)
2. **Sprint 2 — Sync alive:** Fix #2 (sync engine init), #10 (beforeunload), #11 (leader election), #16 (orgId hardcodeado)
3. **Sprint 3 — Data integrity:** Fix #5 (Role.slug unique), #6 (refresh DoS), #8 (stock transaction), #17 (strftime → PostgreSQL)
4. **Sprint 4 — Hardening:** Fix #7 (rate limiting), #9 (sync roles), #12 (CSRF), #14 (Prisma anti-pattern)
5. **Sprint 5 — Polish + React Doctor:** Fix #13 (upload), #15 (as any), #19 (health), #20 (PIN skip), #21 (networkStatus URL), errores de react-doctor, warnings de alto impacto
6. **Sprint 6 — Code quality:** Warnings restantes de react-doctor (size-axes, useReducer, unused files, etc.)
