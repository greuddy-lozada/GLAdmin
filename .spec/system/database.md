# Database — Convenciones de Base de Datos

> **Motor:** PostgreSQL  
> **ORM:** Prisma  
> **Principio rector:** La base de datos es la última línea de defensa de la integridad de los datos.  
> Las constraints viven en la BD, no solo en la aplicación.

---

## 1. Convenciones de Nombres

### Tablas y Columnas

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case`, plural | `products`, `invoice_items` |
| Columnas | `snake_case`, singular | `created_at`, `tax_amount` |
| Llaves primarias | `id` (UUID v4) | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Llaves foráneas | `{tabla_singular}_id` | `company_id`, `customer_id` |
| Tablas pivote (M:N) | `{tabla1_singular}_{tabla2_singular}` | `invoice_tax_withholdings` |
| Índices | `idx_{tabla}_{columna}` | `idx_invoices_company_id` |
| Constraints únicas | `uq_{tabla}_{columna}` | `uq_invoices_control_number` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` (soft delete) | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

### Tipos de datos

| Dato | Tipo PostgreSQL | Prisma |
|---|---|---|
| ID primario | `UUID` | `@id @default(uuid())` |
| Texto corto (<255) | `VARCHAR(n)` | `String @db.VarChar(n)` |
| Texto largo | `TEXT` | `String @db.Text` |
| Montos financieros | `DECIMAL(18,4)` | `Decimal @db.Decimal(18,4)` |
| Fechas/Hora | `TIMESTAMPTZ` | `DateTime @db.Timestamptz()` |
| Booleanos | `BOOLEAN` | `Boolean` |
| Enumeraciones | `ENUM` nativo de PostgreSQL | `enum` en Prisma schema |
| JSON | `JSONB` | `Json @db.JsonB` |

---

## 2. UUIDs como Primary Keys

**Regla:** Todas las tablas usan `UUID v4` como primary key.  
**No se usan** IDs numéricos autoincrementales como PKs.

### Justificación
- Evita enumeración de recursos (seguridad).
- Permite generación offline/descentralizada.
- Facilita sincronización multi-dispositivo (plan futuro).
- Compatible con arquitectura de microservicios.

### Excepción
- **Secuenciales fiscales** (`invoice_number`, `control_number`) **SÍ son numéricos secuenciales** pero **NO son PKs**. Son columnas de negocio con constraint `UNIQUE`.

---

## 3. ⚖️ Esquema de Tablas Financieras (Inmutabilidad)

Toda tabla que almacena documentos con valor fiscal debe tener la siguiente estructura base:

```prisma
model Invoice {
  id            String    @id @default(uuid()) @db.Uuid
  companyId     String    @map("company_id") @db.Uuid
  customerId    String    @map("customer_id") @db.Uuid
  invoiceNumber String    @map("invoice_number") @db.VarChar(20)
  controlNumber String    @map("control_number") @db.VarChar(20)
  
  subtotal      Decimal   @db.Decimal(18,4)
  taxAmount     Decimal   @map("tax_amount") @db.Decimal(18,4)
  total         Decimal   @db.Decimal(18,4)
  
  status        InvoiceStatus @default(DRAFT)
  
  issuedAt      DateTime? @map("issued_at") @db.Timestamptz()
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz()
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz()    // Soft delete
  
  annulledAt    DateTime? @map("annulled_at") @db.Timestamptz()   // Fecha de anulación
  annulmentReason String? @map("annulment_reason") @db.Text       // Motivo legal de anulación
  
  // Relaciones
  company       Company   @relation(fields: [companyId], references: [id])
  customer      Customer  @relation(fields: [customerId], references: [id])
  items         InvoiceItem[]
  annulment     InvoiceAnnulment?  // Relación 1:1 con el registro de anulación
  creditNotes   CreditNote[]
  debitNotes    DebitNote[]
  taxWithholdings TaxWithholding[]
  
  @@map("invoices")
}
```

### Enum de estados de documento fiscal

```prisma
enum InvoiceStatus {
  DRAFT       // Borrador — editable
  ISSUED      // Emitida — INMUTABLE
  ANNULLED    // Anulada — INMUTABLE (solo cambió status + annulled_at + annulment_reason)
}
```

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

### Estructura

```
prisma/
├── schema.prisma
├── migrations/
└── seeds/
    ├── seed.ts                 # Entry point — ejecuta en orden
    ├── 01-companies.ts         # Empresas de prueba
    ├── 02-users.ts             # Usuarios con todos los roles
    ├── 03-products.ts          # Productos de ejemplo
    ├── 04-customers.ts         # Clientes de prueba
    └── 05-invoices.ts          # Facturas en distintos estados
```

### Reglas del Seed

1. **El seed debe ser idempotente.** Ejecutarlo 2 veces no debe duplicar datos. Usar `upsert` con claves únicas.
2. **Todos los roles deben tener al menos un usuario de prueba.**
3. **Las contraseñas en seed son siempre `Test123!`** (texto plano en seed, bcrypt en BD).
4. **El seed incluye datos fiscales ficticios pero realistas** (RIFs con formato válido, secuenciales que empiezan en 1).
5. **No incluir datos de producción ni referencias a empresas reales en seeds.**

### Comandos

```bash
# Aplicar seed
npx prisma db seed

# Reset completo (borra BD + migraciones + seed)
npx prisma migrate reset

# Reset y seed en un paso
pnpm run db:reset
```

---

## 6. Soft Delete

### Regla general

**Ningún registro se elimina físicamente (`DELETE`).** Todo usa soft delete con columna `deleted_at`.

### Excepciones (DELETE físico permitido)

- Tablas de sesiones/cache (Redis/TTL).
- Tokens de refresh expirados.
- Registros temporales (carritos de compra abandonados, borradores de más de 90 días).
- Logs rotados (después de archivado en cold storage).

### Implementación en Prisma

```typescript
// Middleware de Prisma para soft delete (aplica a modelos con deleted_at)
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    params.args.data = { deletedAt: new Date() };
  }
  return next(params);
});
```

---

## 7. Índices Obligatorios

Regla: **Toda columna usada en `WHERE`, `JOIN` o `ORDER BY` debe tener índice.**

| Tabla | Columnas indexadas | Tipo | Motivo |
|---|---|---|---|
| `invoices` | `company_id`, `status` | Compuesto | Filtro más común (facturas de mi empresa por estado) |
| `invoices` | `control_number` | Único | Búsqueda por número de control fiscal |
| `invoices` | `issued_at` | Simple | Ordenamiento cronológico |
| `products` | `company_id`, `deleted_at` | Compuesto | Listado de productos activos por empresa |
| `customers` | `company_id`, `rif` | Compuesto + Único | Búsqueda por RIF dentro de una empresa |
| `invoice_items` | `invoice_id` | Simple | JOIN al cargar factura completa |
| `users` | `email` | Único | Login |
| `refresh_tokens` | `user_id`, `expires_at` | Compuesto | Rotación y limpieza de tokens expirados |

---

*Referencia cruzada: [architecture.md](architecture.md) — [security.md](security.md)*
