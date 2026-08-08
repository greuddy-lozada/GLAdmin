# Database — Convenciones de Base de Datos

> **status:** `current` · Última verificación: 2026-08-08  
> **Motor:** PostgreSQL  
> **ORM:** Prisma (`backend/prisma/schema.prisma`)  
> **Principio rector:** La base de datos es la última línea de defensa de la integridad de los datos.  
> Las constraints viven en la BD, no solo en la aplicación.

---

## 1. Convenciones de Nombres

### Tablas y Columnas

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case`, plural | `products`, `sales`, `sale_details` |
| Columnas | `snake_case`, singular | `created_at`, `total_tax` |
| Llaves primarias | `id` (UUID v4) | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Tenant FK | `organization_id` | Multi-tenant obligatorio en entidades de negocio |
| Llaves foráneas | `id_{tabla_singular}` o `{tabla_singular}_id` | `id_product`, `organization_id` — **seguir el patrón ya usado en el modelo** |
| Tablas pivote (M:N) | `{tabla1}_{tabla2}` | `products_exchange_rates` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` (soft delete) | |

### Tipos de datos

| Dato | Tipo PostgreSQL | Prisma |
|---|---|---|
| ID primario | `UUID` | `@id @default(uuid()) @db.Uuid` |
| Texto corto (<255) | `VARCHAR(n)` | `String @db.VarChar(n)` |
| Texto largo | `TEXT` | `String` / `@db.Text` |
| Montos financieros | `DECIMAL(18,4)` | `Decimal @db.Decimal(18,4)` |
| Fechas/Hora | `TIMESTAMP` / `TIMESTAMPTZ` | `DateTime` |
| Booleanos | `BOOLEAN` | `Boolean` |
| JSON | `JSONB` | `Json` |

---

## 2. UUIDs como Primary Keys

**Regla:** Todas las tablas de negocio usan `UUID` como primary key.  
**No se usan** IDs numéricos autoincrementales como PKs.

### Justificación
- Evita enumeración de recursos (seguridad).
- Permite generación offline/descentralizada (sync / Dexie).
- Facilita sincronización multi-dispositivo.

### Excepción
- Secuenciales de negocio (`code` de venta, etc.) pueden ser strings/números de negocio pero **no** son PKs.

---

## 3. Documentos financieros (Inmutabilidad)

El dominio de venta en código es **`Sale`** (`sales`), no un módulo `invoices`.  
Toda tabla con valor contable/fiscal debe respetar inmutabilidad tras emisión (ver [security.md](security.md)).

Campos base típicos (patrón):

```prisma
model Sale {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid
  status         String?   @default("DRAFT")
  amount         Decimal?  @db.Decimal(18,4)
  amountUsd      Decimal?  @map("amount_usd") @db.Decimal(18,4)
  totalTax       Decimal?  @map("total_tax") @db.Decimal(18,4)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")
  annulledAt     DateTime? @map("annulled_at")
  annulmentReason String?  @map("annulment_reason")
  // ...
  @@map("sales")
}
```

Estados relevantes: `DRAFT` (editable) → emitida/cobrada (inmutable) → anulada (solo status + motivo; montos intactos).

---

## 4. Migraciones

### Flujo obligatorio

```
1. Editar schema.prisma
2. Generar migración:  npx prisma migrate dev --name describe_el_cambio
3. Revisar la migración SQL generada en prisma/migrations/
4. Si la migración toca datos existentes: AÑADIR script de data migration manual
5. Testear en local:       npx prisma migrate reset  (reinicia + aplica todas + seed)
6. Testear en staging:     pnpm run db:migrate:staging
7. Merge a main → CI aplica automáticamente en staging. PRD requiere aprobación manual.
```

### Reglas de Migraciones

1. **Las migraciones son inmutables.** Una vez commiteada y aplicada en staging/producción, jamás se edita. Si hay error → nueva migración que lo corrija.
2. **Cada migración hace UNA sola cosa.** No mezclar "agregar tabla X" con "modificar columna Y" en la misma migración.
3. **Las migraciones deben ser reversibles** siempre que sea posible. Incluir `--create-only` y revisar el SQL generado.
4. **No usar `prisma migrate dev` en producción.** Solo `prisma migrate deploy`.
5. **Data migrations** (modificar datos existentes) van en un script separado, NO en la migración de schema.

---

## 5. Seeds de Datos de Prueba

Seeds viven bajo `backend/prisma/` (entry `seed` configurado en package). Incluyen orgs, users, products, customers, sales de ejemplo.

### Reglas del Seed

1. **El seed debe ser idempotente.** Ejecutarlo 2 veces no debe duplicar datos. Usar `upsert` con claves únicas.
2. **Todos los roles deben tener al menos un usuario de prueba.**
3. **Las contraseñas en seed son siempre `Test123!`** (texto plano en seed, bcrypt en BD).
4. **No incluir datos de producción ni referencias a empresas reales en seeds.**

### Comandos

```bash
npx prisma db seed
npx prisma migrate reset
pnpm run db:reset
```

---

## 6. Soft Delete

### Regla general

**No eliminar físicamente** registros de negocio con historial. Preferir:

1. `deletedAt` vía extension Prisma en `PrismaService` (modelos en la lista `softDeleteModels`), **o**
2. Flags de dominio (ej. Productos: `DELETE /api/products/:id` setea `available: false` — ver [features/products.md](../features/products.md)).

No todos los modelos tienen `deletedAt`. Consultar `schema.prisma` + lista en `prisma.service.ts` antes de asumir.

### Excepciones (DELETE físico permitido)

- Tablas de sesiones/cache (Redis/TTL).
- Tokens de refresh expirados.
- Registros temporales (carritos abandonados, borradores viejos).
- Logs rotados tras archivado.

---

## 7. Índices Obligatorios

Regla: **Toda columna usada en `WHERE`, `JOIN` o `ORDER BY` debe tener índice.**

Índices reales de productos (referencia):

| Tabla | Columnas indexadas | Motivo |
|---|---|---|
| `products` | `organization_id` | Tenant |
| `products` | `(organization_id, available)` | Listado activos |
| `products` | `(organization_id, updated_at)` | Sync |
| `products` | `code`, `id_tax`, `id_brand`, `id_category`, `deleted_at` | Lookups / soft-delete |
| `sales` | `organization_id` (+ status según queries) | Listados por org |
| `users` | email / login fields | Auth |
| `refresh_tokens` | user + expiry | Rotación |

Al agregar queries nuevas, verificar índices en el mismo PR.

---

*Referencia cruzada: [architecture.md](architecture.md) — [security.md](security.md) — [features/products.md](../features/products.md)*
