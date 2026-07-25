# Módulo Caja — Especificación Técnica y Funcional

Control de caja para entornos con múltiples cajeros: apertura/cierre de turno,
arqueo con efectivo contado, detección de sobrantes/faltantes, y reportes de corte.

---

## 1. Lógica de Negocio

### 1.1 Concepto

Un negocio tiene una o más **Cajas** (puntos de venta físicos/lógicos).
Cada **Cajero** (usuario con rol employee+) inicia su turno **abriendo** una caja
con un monto de efectivo inicial (fondo para cambio). Durante el turno, todas las
ventas de ese cajero se asocian automáticamente a esa apertura de caja.
Al finalizar el turno, el cajero **cierra** la caja: cuenta el efectivo físico,
lo registra, y el sistema calcula la diferencia contra el saldo esperado.

### 1.2 Reglas de Negocio

- Solo un admin/manager (minLevel 60+) puede **crear/editar/desactivar** cajas.
- Cualquier usuario (minLevel 40+) puede abrir una caja, pero **solo una apertura activa por usuario a la vez**.
- El POS requiere una caja abierta para procesar cobros. Si no hay, muestra un diálogo de apertura.
- Una apertura de caja pertenece a un usuario + una caja + una organización.
- Todas las ventas (Sale) durante una apertura registran `cajaAperturaId`.
- Al cerrar:
  - `esperado = fondoInicial + Σ ventas_efectivo - Σ egresos`
  - El cajero ingresa el efectivo contado físicamente
  - `diferencia = contado - esperado` (positivo = sobrante, negativo = faltante)
  - La apertura pasa a estado `cerrada` y no puede reabrirse.
- Una caja puede tener múltiples aperturas en paralelo (cajeros distintos en cajas distintas).

### 1.3 Flujo Completo

```
Admin:       Crear Caja "Caja Principal" → Caja activa

Cajero:      Abrir Caja "Caja Principal" → registra fondo inicial $20
             └── POS habilita cobros
             └── Venta 1: $15 efectivo → saldo esperado: $35
             └── Venta 2: $10 efectivo → saldo esperado: $45
             └── Cerrar Caja
                  └── Cajero cuenta: $44
                  └── Diferencia: -$1 (faltante)
                  └── Corte generado
```

---

## 2. Modelo de Datos

### 2.1 Prisma Schema

```prisma
enum CajaAperturaStatus {
  abierta
  cerrada
}

model Caja {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String        @db.Uuid
  name           String
  code           String        // código corto único por organización
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  aperturas      CajaApertura[]

  organization   Organization  @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, code])
  @@map("cajas")
}

model CajaApertura {
  id             String             @id @default(uuid()) @db.Uuid
  cajaId         String             @db.Uuid
  userId         String             @db.Uuid
  organizationId String             @db.Uuid
  initialCash    Decimal            @default(0) @db.Decimal(18,4)
  status         CajaAperturaStatus @default(abierta)
  openedAt       DateTime           @default(now())
  closedAt       DateTime?
  notes          String?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  caja           Caja               @relation(fields: [cajaId], references: [id])
  user           User               @relation(fields: [userId], references: [id])
  organization   Organization       @relation(fields: [organizationId], references: [id])
  sales          Sale[]
  cortes         CorteCaja[]

  @@map("caja_aperturas")
}

model CorteCaja {
  id              String    @id @default(uuid()) @db.Uuid
  cajaAperturaId  String    @db.Uuid
  organizationId  String    @db.Uuid
  expectedCash    Decimal   @db.Decimal(18,4)  // fondoInicial + ventasEfectivo - egresos
  countedCash     Decimal   @db.Decimal(18,4)  // efectivo contado físicamente
  difference      Decimal   @db.Decimal(18,4)  // counted - expected (±)
  closedById      String    @db.Uuid
  notes           String?
  closedAt        DateTime  @default(now())
  createdAt       DateTime  @default(now())

  cajaApertura    CajaApertura @relation(fields: [cajaAperturaId], references: [id])
  closedBy        User         @relation(fields: [closedById], references: [id])
  organization    Organization @relation(fields: [organizationId], references: [id])

  @@map("corte_cajas")
}
```

### 2.2 Cambios en modelos existentes

```prisma
// Sale — agregar campo
model Sale {
  // ... campos existentes ...
  cajaAperturaId    String?   @db.Uuid @map("caja_apertura_id")

  cajaApertura      CajaApertura? @relation(fields: [cajaAperturaId], references: [id])

  @@index([cajaAperturaId])
}
```

### 2.3 Sync (Dexie)

Las cajas y aperturas deben sincronizarse para operación offline:

- `Caja` se incluye en el pull del sync engine (tabla `cajas`)
- `CajaApertura` se sincera como `cajaAperturas`
- Las aperturas cerradas en local se pushean al servidor
- `CorteCaja` se crea en el servidor al cerrar (no requiere sync local porque se cierra online)

---

## 3. API Backend

### 3.1 Endpoints

| Método | Ruta | MinLevel | Descripción |
|--------|------|----------|-------------|
| `GET` | `/cajas` | manager | Listar cajas activas de la organización |
| `GET` | `/cajas/:id` | manager | Obtener caja por ID |
| `POST` | `/cajas` | manager | Crear caja |
| `PATCH` | `/cajas/:id` | manager | Actualizar caja |
| `DELETE` | `/cajas/:id` | manager | Desactivar caja (soft delete) |
| `POST` | `/cajas/:id/abrir` | employee | Abrir caja (body: `{ initialCash, notes? }`) |
| `POST` | `/cajas-apertura/:id/cerrar` | employee | Cerrar apertura (body: `{ countedCash, notes? }`) |
| `GET` | `/cajas-apertura` | employee | Listar aperturas (query: `?status=abierta&userId=...`) |
| `GET` | `/cajas/mi-apertura-activa` | employee | Obtener apertura activa del usuario actual |

### 3.2 DTOs

```typescript
// POST /cajas
class CreateCajaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

// PATCH /cajas/:id
class UpdateCajaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// POST /cajas/:id/abrir
class AbrirCajaDto {
  @IsNumber()
  @Min(0)
  initialCash: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// POST /cajas-apertura/:id/cerrar
class CerrarCajaDto {
  @IsNumber()
  @Min(0)
  countedCash: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
```

### 3.3 Abrir Caja — Algoritmo

```
1. Validar que Caja existe y está activa (isActive = true)
2. Validar que el usuario no tiene otra apertura activa (status = abierta)
3. Crear CajaApertura con:
   - cajaId, userId, organizationId (del context)
   - initialCash, status = abierta, openedAt = now()
4. Retornar CajaApertura creada
```

### 3.4 Cerrar Caja — Algoritmo

```
INPUT: aperturaId, { countedCash, notes }

1. Obtener CajaApertura con sus ventas (payments where method = Cash)
2. Validar: apertura.status === abierta
3. Calcular:
   - totalVentasEfectivo = Σ sales.payments[method=Cash].amount (en Bs.)
   - expectedCash = apertura.initialCash + totalVentasEfectivo
   - difference = countedCash - expectedCash
4. Transacción:
   - Actualizar CajaApertura: status = cerrada, closedAt = now(), notes
   - Crear CorteCaja: { expectedCash, countedCash, difference, ... }
5. Retornar CorteCaja
```

---

## 4. Frontend

### 4.1 Estructura

```
frontend/src/features/caja/
  components/
    caja-page.tsx            → CRUD de cajas (admin/manager)
    selector-caja.tsx        → Selector al abrir caja (dialog)
    apertura-activa.tsx      → Badge/indicador en POS "Caja: Caja 1"
    cerrar-caja.tsx          → Diálogo de cierre con arqueo
    corte-view.tsx           → Resumen del corte (print)
  hooks/
    use-caja.ts              → Data fetching hook
  models/
    caja.model.ts            → Interfaces TS
  services/
    caja.service.ts          → API calls
```

### 4.2 Páginas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/cajas` | `caja-page` | CRUD de cajas (minLevel manager+) |
| `(en POS)` | `selector-caja` | Modal al iniciar POS sin caja abierta |
| `(en POS)` | `apertura-activa` | Badge en toolbar indicando caja activa |
| `(en POS)` | `cerrar-caja` | Modal para cerrar caja con arqueo |

### 4.3 Integración con POS

1. Al cargar `pos-page.tsx`:
   - Llamar a `GET /cajas/mi-apertura-activa`
   - Si no hay apertura activa → mostrar `selector-caja.tsx` (modal)

2. En `PosToolbar`:
   - Agregar badge/indicador: `⏱️ Caja: Principal` (solo lectura, informativo)
   - Botón "Cerrar Caja" que abre `cerrar-caja.tsx`

3. Al procesar pago (handlePayment):
   - Si hay apertura activa → asignar `cajaAperturaId` a la Sale

4. Al cerrar caja (en POS o standalone):
   - Fetch expectedCash del backend
   - Cajero ingresa countedCash
   - Confirmación con resumen: esperado vs contado vs diferencia
   - Si hay diferencia, mostrar visual (rojo si faltante, verde si sobrante)

### 4.4 Corte / Reporte de Cierre

El corte de caja debe mostrar:

```
CAJA: Principal
CAJERO: Juan Pérez
APERTURA: 25/07/2026 08:00
CIERRE: 25/07/2026 18:00

Fondo Inicial:              Bs. 20.00
Ventas Efectivo:            Bs. 1,245.00
Esperado:                   Bs. 1,265.00
Contado:                    Bs. 1,260.00
Diferencia:                 Bs. -5.00 (FALTANTE)

Ventas del turno: 23
Total ventas (todos métodos): Bs. 2,340.00
```

---

## 5. Sync / Offline

- `Caja` y `CajaApertura` se agregan al pull del sync engine.
- Las aperturas cerradas requieren conexión (el cierre se hace online).
- Si el usuario está offline y necesita cerrar, se difiere el cierre hasta que reconecte.

**V2:** Cierre offline con push diferido.

---

## 6. Reports (módulo existente)

Agregar reportes:

| Reporte | Tipo | Descripción |
|---------|------|-------------|
| `corte_caja` | Corte de caja individual | Reporte detallado de un cierre específico |
| `resumen_caja` | Resumen por cajero | Ventas, esperado, contado, diferencia por cajero en un rango |

---

## 7. MVP vs V2

| Funcionalidad | MVP | V2 |
|--------------|-----|----|
| CRUD Cajas | ✅ | — |
| Abrir/Cerrar caja | ✅ | — |
| Asociar ventas a apertura | ✅ | — |
| Arqueo (esperado vs contado) | ✅ | — |
| Corte de caja individual | ✅ | — |
| Reporte de corte (print) | ✅ | — |
| Indicador en POS | ✅ | — |
| Egresos/Ingresos manuales durante turno | — | ✅ |
| Desglose por denominación | — | ✅ |
| Transferencias entre cajas | — | ✅ |
| Corte consolidado (todas las cajas) | — | ✅ |
| Cierre offline diferido | — | ✅ |

---

## 8. Estructura de Archivos (Backend)

```
backend/src/modules/caja/
  caja.module.ts
  caja.controller.ts
  caja.service.ts
  dto/
    create-caja.dto.ts
    update-caja.dto.ts
    abrir-caja.dto.ts
    cerrar-caja.dto.ts
```

---

## 9. Pruebas

| Tipo | Cobertura |
|------|-----------|
| Unit (service) | Abrir caja (validaciones: caja activa, usuario sin apertura activa), Cerrar caja (cálculo expectedCash, diferencia) |
| E2E | Flujo completo: crear caja → abrir → vender en POS → cerrar → verificar corte |
| Sync | Caja y aperturas en pull |
