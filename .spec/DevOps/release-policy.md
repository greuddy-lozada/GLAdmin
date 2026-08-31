# Release Policy — Política de Entregas a Producción

> **Principio rector:** Ningún código llega a producción sin pasar por staging y validación humana.  
> Un bug en Cuadra puede significar un error fiscal para un cliente — no hay margen para "hotfixes a ciegas".

---

## 1. Criterios de Aceptación para Producción (DoR — Definition of Ready)

### Checklist obligatorio pre-merge a `main`

- [ ] **TypeScript strict:** 0 errores de tipo (`pnpm typecheck`)
- [ ] **Lint:** 0 warnings (`pnpm lint`)
- [ ] **Tests unitarios:** todos pasan (`pnpm test`)
- [ ] **Tests E2E** (flujos críticos): todos pasan (`pnpm test:e2e`)
- [ ] **Build de producción:** exitoso sin errores (`pnpm build`)
- [ ] **Nuevas migraciones de BD:** revisadas y testeadas en staging; clasificadas additive vs expand/contract vs destructiva ([database.md](../system/database.md) §4)
- [ ] **Contrato de sync:** si cambia `/api/sync/push` o el payload de sale, el release es expand/contract — no el mismo instante que el frontend ([deployment.md](deployment.md) §7)
- [ ] **Variables de entorno nuevas:** documentadas en `.env.example`
- [ ] **i18n:** llaves nuevas existen en `es.json` y `en.json` con la misma estructura
- [ ] **Code review:** aprobado por al menos 1 reviewer
- [ ] **Sin regresiones visuales:** las pantallas modificadas coinciden con el design system

### Checklist adicional para features que tocan facturación/contabilidad

- [ ] **Regla de inmutabilidad contable:** no se añadió ningún `UPDATE` sobre tablas financieras con estado `issued`
- [ ] **Secuenciales fiscales:** se respeta el orden y no se generan saltos
- [ ] **Cálculos de IVA/ISLR:** verificados con valores de prueba conocidos
- [ ] **Formato de RIF:** validado en frontend y backend

---

## 2. Entornos

| Entorno | Rama | BD | Propósito |
|---|---|---|---|
| **Development** | `feat/*`, `fix/*` | Local (Docker) | Desarrollo diario |
| **Staging** | `main` | `cuadra_staging` | Validación pre-producción |
| **Production** | `main` (tagged) | `cuadra_prod` | Entorno real de clientes |

### Reglas de entornos

1. **Development y Staging usan datos ficticios.** Prohibido usar datos reales de clientes en staging.
2. **Producción nunca comparte BD con staging.**
3. **Los seeds solo existen en development.** Staging y producción no tienen seeds.
4. **Staging se resetea semanalmente** (BD limpia + seed mínimo para smoke tests).

### Ventana de deploy (producción)

El stack actual es **un** contenedor backend. Un deploy corta el API unos segundos o minutos. Detalle: [deployment.md](deployment.md) §7.

| Superficie | ¿El usuario nota el corte? |
|---|---|
| POS (caja) | No, si el hueco es corto. Cobra en Dexie; sync reintenta al volver. |
| Admin / dashboard / reportes | Sí. Requests fallan hasta `/api/health` 200. |

Reglas:

1. Producción se despliega **fuera de horario de caja**, salvo hotfix (§6).
2. Avisar al local: corte de sync ~1–2 min; la caja sigue.
3. No mezclar en el mismo release de día: restart + migración no-additive + cambio de `/api/sync/*`.
4. Staging (testers, IP) no tiene esta restricción de horario.

---

## 3. Smoke Tests Post-Deploy

### Automatizados (ejecutados por CI/CD inmediatamente después del deploy a staging/producción)

```typescript
// Estructura esperada de smoke tests (backend/tests/smoke/)
describe('Smoke Tests — Funcionalidad Crítica', () => {
  
  test('[AUTH] POST /api/auth/login — Login exitoso con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cuadra.test', password: 'Test123!' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('[AUTH] POST /api/auth/login — Login rechazado con credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cuadra.test', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('[HEALTH] GET /api/health — Endpoint de salud responde', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
  });

  test('[PRODUCTS] GET /api/products — Lista productos (autenticado)', async () => {
    const token = await getAuthToken('admin@cuadra.test');
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('[POS] La página del POS carga sin errores (frontend e2e)', async () => {
    // Test de Playwright o Cypress
    await page.goto('/pos');
    await page.waitForSelector('[data-testid="pos-layout"]');
    expect(await page.isVisible('[data-testid="product-search"]')).toBe(true);
  });
});
```

### Manuales (ejecutados por el QA / desarrollador responsable del release)

| # | Flujo | Pasos | Resultado esperado |
|---|---|---|---|
| 1 | Login | Entrar con credenciales de admin | Dashboard visible, sidebar con módulos del rol |
| 2 | CRUD Producto | Crear → Editar → Eliminar (soft) un producto | Toast de éxito en cada paso |
| 3 | Factura completa | Crear factura borrador → agregar items → emitir → ver PDF | PDF generado, factura en estado ISSUED |
| 4 | Anular factura | Abrir factura emitida → anular con motivo | Factura en estado ANNULLED, campos inmutables intactos |
| 5 | POS | Abrir POS → buscar producto → agregar a carrito → cobrar | Factura creada, carrito vacío, foco en búsqueda |
| 6 | Logout | Cerrar sesión → intentar acceder a /dashboard | Redirigido a /login, token inválido |

---

## 4. Estrategia de Rollback

### Rollback de aplicación (sin cambios de BD)

```
1. Detectar fallo (alerta de error rate > 5% o smoke test fallido)
2. Notificar en #cuadra-alerts (Slack/Discord)
3. Ejecutar rollback:
   git checkout <último-tag-estable>
   docker compose build && docker compose up -d
4. Ejecutar smoke tests contra la versión rollbackeada
5. Si smoke tests pasan → rollback exitoso
6. Si smoke tests fallan → ESCALAR (el rollback no funcionó, intervención manual)
```

### Rollback con migraciones de BD

```
⚠️ ESCENARIO CRÍTICO — La migración ya se aplicó en producción

1. Detener tráfico inmediatamente (modo mantenimiento)
2. Evaluar si la migración es reversible:
   a. Migración solo agregó columnas/tablas → NO hacer rollback de BD (es seguro)
   b. Migración modificó/eliminó columnas → aplicar migración reversa inmediatamente
3. Restaurar backup de BD si la migración reversa no es posible
4. Rollback de aplicación al tag anterior
5. Smoke tests + verificación manual de integridad de datos
6. Restaurar tráfico
```

Por eso las migraciones de producción deben ser **expand/contract** ([database.md](../system/database.md) §4): un drop o rename en el mismo deploy que el código nuevo no tiene rollback limpio. Rollback de app **nunca** deshace `prisma migrate deploy`.

### Tiempos objetivo

| Evento | Tiempo máximo |
|---|---|
| Detección de fallo | 2 minutos (alertas automáticas) |
| Decisión (rollback vs hotfix) | 5 minutos |
| Ejecución de rollback (sin BD) | 3 minutos |
| Ejecución de rollback (con BD) | 15 minutos |
| Comunicación a usuarios | 5 minutos después de detectado |

---

## 5. Versionado y Tags

### Esquema: SemVer

```
v<MAJOR>.<MINOR>.<PATCH>

MAJOR: Cambios que rompen compatibilidad (API, BD, contratos)
MINOR: Features nuevos, cambios no-rompedores
PATCH: Bug fixes, hotfixes
```

### Proceso de release

```bash
# 1. Asegurarse que main está al día y CI pasó
git checkout main && git pull

# 2. Bump de versión (manual — decidido por el equipo)
npm version patch   # Bug fixes
npm version minor   # Features
npm version major   # Breaking changes

# 3. Push del tag
git push --follow-tags

# 4. GitHub Actions detecta el tag y despliega a producción
```

### Changelog

Cada release debe incluir un changelog en el cuerpo del release de GitHub:

```markdown
## v1.2.0 — 2026-07-03

### ✨ Features
- [FEAT-42] Módulo de retenciones de IVA (Providencia SENIAT)
- [FEAT-43] Exportación de libro de ventas a CSV

### 🐛 Bug Fixes
- [FIX-101] El secuencial fiscal no se reiniciaba al cambiar de año fiscal
- [FIX-102] Error al generar PDF con montos > 1.000.000 Bs

### 📦 Dependencias
- NestJS 10.4 → 10.5
- Prisma 5.x → 6.x

### ⚠️ Breaking Changes
- Ninguno
```

---

## 6. Política de Hotfix

Un hotfix es un fix crítico que no puede esperar al ciclo normal de release.

### ¿Qué califica como hotfix?

- La app está caída (usuarios no pueden acceder).
- Error en cálculo fiscal (facturas con montos incorrectos).
- Vulnerabilidad de seguridad explotable.
- Pérdida o corrupción de datos.

### Proceso de hotfix

```
1. Crear branch: git checkout -b hotfix/<descripción> desde main
2. Implementar fix + tests
3. PR directo a main (salta staging si el riesgo es aceptable)
4. Desplegar a staging primero (si es posible sin exponer el bug)
5. Smoke tests en staging
6. Deploy a producción
7. Merge main → develop (para no perder el fix en features en curso)
8. Post-mortem: documentar qué falló y cómo prevenirlo
```

Un hotfix **sí corta el API** (un solo backend). Se despliega igual porque el bug es peor que el hueco. Avisar a caja: sync ~1–2 min; pueden seguir cobrando. No relajar expand/contract: un hotfix con drop de columna sigue siendo escenario crítico de BD.

---

*Referencia cruzada: [deployment.md](deployment.md) | [database.md](../system/database.md) | [security.md](../system/security.md)*
