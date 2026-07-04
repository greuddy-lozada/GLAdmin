# Database Migration Plan — UUIDs + PostgreSQL

> **Estado:** Planificado, no ejecutado  
> **Fecha plan:** 2026-07-03  
> **Depende de:** Fase 3 (snake_case, soft delete, indexes, status) completada

---

## Contexto

La Fase 3 aplicó cambios seguros al schema: snake_case naming, soft delete, FK indexes, y status strings con `as const`. Quedan pendientes dos cambios que requieren reescritura masiva del código:

| Cambio | Impacto | Riesgo |
|---|---|---|
| UUID PKs (reemplazar `Int @id @default(autoincrement())` → `String @id @default(uuid())`) | 38 modelos, ~300 archivos | Alto |
| PostgreSQL (reemplazar `provider = "sqlite"` → `provider = "postgresql"`) | Schema, tipos, conexiones | Alto |

---

## 1. Migración a UUIDs

### Archivos afectados (estimado: ~300)

| Capa | Archivos | Cambio |
|---|---|---|
| Prisma Schema | `schema.prisma` | `Int @id @default(autoincrement())` → `String @id @default(uuid())` en 38 modelos. `Int` → `String` en todas las FKs. |
| Backend DTOs | ~48 DTOs | `@IsInt()` → `@IsUUID()` o `@IsString()`. Tipos `number` → `string`. |
| Backend Controllers | ~30 controllers | `@Param('id', ParseIntPipe)` → `@Param('id')` (string). |
| Backend Services | ~30 services | Parámetros `id: number` → `id: string`. Métodos `findUnique({ where: { id } })` siguen funcionando (Prisma acepta string). |
| Backend Guards | `context.service.ts` | `organizationId: number` → `organizationId: string` en `TenantContext`. |
| Frontend Types | ~18 `.model.ts` | `id: number` → `id: string`. |
| Frontend Hooks | ~20 hooks | `useState<number>` → `useState<string>`. Llamadas a API con IDs string. |
| Frontend DataTable | `data-table.tsx` | Genérico `<T extends { id: number }>` → `<T extends { id: string }>`. |
| Seeds | `seed.ts` | `id: 1` → `id: 'uuid-string'`. |
| Tests | `audit-log.service.spec.ts` | Ajustar IDs. |

### Estrategia de migración

```
1. Agregar columna uuid STRING UNIQUE a cada tabla (sin quitar id INT)
2. Migrar datos: UPDATE table SET uuid = generate_uuid()
3. Agregar FKs basadas en uuid
4. Actualizar código backend para usar uuid
5. Actualizar código frontend para usar uuid
6. Remover columnas id INT
7. Renombrar uuid → id
```

### Script de data migration (SQLite)

```sql
-- Fase 1: Agregar columna uuid
ALTER TABLE users ADD COLUMN uuid TEXT;
-- ... (repetir para cada tabla)

-- Fase 2: Poblar UUIDs (SQLite no tiene uuid(), usar hex(randomblob(16)))
UPDATE users SET uuid = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)));
-- ... (repetir para cada tabla)

-- Fase 3: Actualizar FKs
UPDATE refresh_tokens SET user_uuid = (SELECT uuid FROM users WHERE users.id = refresh_tokens.userId);
-- ... (repetir para cada FK)
```

### ⚠️ Riesgos

- **IDs expuestos en URLs**: Si algún frontend guarda URLs con IDs numéricos, esos bookmarks/enlaces se rompen.
- **Sync offline**: Dexie local DB usa IDs numéricos. La migración rompe la sincronización de datos offline pendientes.
- **Datos existentes**: Si hay datos reales en staging/producción, el script de data migration debe ser exhaustivamente testeado.

---

## 2. Migración a PostgreSQL

### Cambios en el schema

| Elemento | SQLite | PostgreSQL |
|---|---|---|
| Provider | `sqlite` | `postgresql` |
| IDs (post-UUID) | `String @default(uuid())` | `String @id @default(uuid()) @db.Uuid` |
| Montos financieros | `Float` | `Decimal @db.Decimal(18,4)` |
| Fechas | `DateTime` | `DateTime @db.Timestamptz()` |
| JSON | `String` | `Json @db.JsonB` |
| Booleans | `Boolean` (0/1) | `Boolean` (true/false) |
| Enums | N/A | `@db.VarChar` CHECK |

### Infraestructura necesaria

```yaml
# docker-compose.yml — agregar servicio PostgreSQL
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cuadra
      POSTGRES_PASSWORD: cuadra_dev
      POSTGRES_DB: cuadra_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Variables de entorno

```bash
# .env — cambiar DATABASE_URL
# De: DATABASE_URL="file:./dev.db"
# A:  DATABASE_URL="postgresql://cuadra:cuadra_dev@localhost:5432/cuadra_dev"
```

### Estrategia de migración de datos (SQLite → PostgreSQL)

```
1. Levantar PostgreSQL con Docker
2. Exportar datos de SQLite: sqlite3 dev.db .dump > data.sql
3. Convertir sintaxis SQLite → PostgreSQL (herramienta: pgloader o script manual)
4. Importar a PostgreSQL: psql -d cuadra_dev -f data_pg.sql
5. Aplicar migraciones de Prisma en PostgreSQL
6. Actualizar DATABASE_URL y provider en schema.prisma
7. Ejecutar Prisma generate + migrate
8. Testear todos los endpoints
```

### Herramienta recomendada: pgloader

```bash
# pgloader puede migrar SQLite → PostgreSQL automáticamente
pgloader sqlite://dev.db postgresql://cuadra:cuadra_dev@localhost:5432/cuadra_dev
```

---

## 3. Orden recomendado de ejecución

```
1. PostgreSQL primero (infraestructura)
   ├── Agregar Docker Compose + DATABASE_URL
   ├── Migrar schema a tipos PostgreSQL (Decimal, JsonB, Timestamptz)
   └── Migrar datos existentes
   
2. UUIDs después (sobre PostgreSQL ya funcionando)
   ├── Agregar columnas uuid tipo UUID nativo de PG
   ├── Data migration script
   └── Actualizar código backend + frontend
```

---

## 4. Checklist Pre-Migración

- [ ] Backup completo de la BD actual
- [ ] Todos los tests pasan en la versión actual (SQLite + Int IDs)
- [ ] Script de data migration testeado en entorno aislado
- [ ] Rollback plan documentado (restaurar backup + revertir código)
- [ ] Comunicación al equipo (downtime estimado: 2-4 horas)
- [ ] Staging migrado primero, validado, luego producción

---

*Referencia: [audit-report-2026-07-03.md](../audit-report-2026-07-03.md) — Fase 3*
