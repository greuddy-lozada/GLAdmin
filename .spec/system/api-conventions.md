# API Conventions — Contratos y Estándares de API

> **Principio rector:** Toda respuesta de la API sigue la misma estructura predecible.  
> Un frontend que conoce el formato puede manejar cualquier endpoint sin sorpresas.

---

## 1. Formato de Respuesta Estándar

### Éxito — Colección (listas paginadas)

```json
{
  "data": [
    { "id": "uuid", "name": "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### Éxito — Recurso individual

```json
{
  "data": {
    "id": "uuid",
    "name": "...",
    "createdAt": "2026-07-03T12:00:00.000Z"
  }
}
```

### Éxito — Operación sin retorno (delete, bulk actions)

```json
{
  "data": null,
  "meta": {
    "message": "Factura anulada exitosamente"
  }
}
```

### Error

```json
{
  "error": {
    "code": "INVOICE_001",
    "message": "La factura ya fue emitida y no puede modificarse",
    "details": [
      { "field": "status", "reason": "El estado actual es 'issued', solo se permite 'draft'" }
    ]
  }
}
```

### Reglas del envelope

1. **`data`**: siempre presente (puede ser `null`, objeto o array).
2. **`meta`**: presente en respuestas de colección (paginación) y operaciones sin retorno (mensaje). Ausente en recurso individual.
3. **`error`**: solo presente en respuestas 4xx y 5xx. Contiene `code`, `message` y opcionalmente `details`.

---

## 2. Códigos HTTP por Escenario

| Código | Significado | Cuándo usarlo |
|---|---|---|
| `200 OK` | Éxito genérico | GET de recurso individual, PATCH exitoso |
| `201 Created` | Recurso creado | POST exitoso |
| `204 No Content` | Éxito sin body | DELETE lógico (soft-delete) |
| `400 Bad Request` | Error de validación | DTO inválido, campos faltantes o con formato incorrecto |
| `401 Unauthorized` | No autenticado | Token ausente, expirado o inválido |
| `403 Forbidden` | Sin permisos | Token válido pero rol insuficiente. También para reglas de negocio (ej: modificar factura emitida) |
| `404 Not Found` | Recurso no existe | ID no encontrado en BD |
| `409 Conflict` | Conflicto de estado | RIF duplicado, secuencial fiscal ya usado, email ya registrado |
| `422 Unprocessable Entity` | Error semántico | Datos válidos sintácticamente pero violan reglas de negocio (ej: factura con total negativo) |
| `429 Too Many Requests` | Rate limit | Superó el límite de requests por ventana |
| `500 Internal Server Error` | Error inesperado | Excepción no manejada. NUNCA exponer stack trace en producción |

### Implementación en NestJS

```typescript
// Interceptor global para estandarizar respuestas exitosas
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        data: data ?? null,
        ...(data?.meta ? { meta: data.meta } : {}),
      })),
    );
  }
}

// Filtro global para estandarizar errores
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json({
        error: {
          code: typeof body === 'string' ? `HTTP_${status}` : (body as any).code ?? `HTTP_${status}`,
          message: typeof body === 'string' ? body : (body as any).message,
          details: (body as any).details ?? undefined,
        },
      });
      return;
    }

    // Error inesperado — loggear y devolver genérico
    this.logger.error('Unhandled exception', exception);
    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
    });
  }
}
```

---

## 3. Códigos de Error (Error Codes)

### Formato: `{MÓDULO}_{NÚMERO}`

Cada feature define sus propios error codes. Se registran en un enum o constant file dentro del módulo.

| Código | Módulo | Mensaje |
|---|---|---|
| `AUTH_001` | Auth | Credenciales inválidas |
| `AUTH_002` | Auth | Token expirado |
| `AUTH_003` | Auth | Cuenta bloqueada por múltiples intentos fallidos |
| `USER_001` | Users | Email ya registrado |
| `USER_002` | Users | El usuario no pertenece a tu empresa |
| `PRODUCT_001` | Products | Código de producto duplicado |
| `PRODUCT_002` | Products | No se puede eliminar: tiene ventas asociadas |
| `CUSTOMER_001` | Customers | RIF ya registrado en esta empresa |
| `INVOICE_001` | Invoices | Factura ya emitida, no se puede modificar |
| `INVOICE_002` | Invoices | Secuencial fiscal ya utilizado |
| `INVOICE_003` | Invoices | No hay inventario suficiente para este producto |
| `INVOICE_004` | Invoices | La factura no tiene ítems |
| `TAX_001` | Tax | Retención de IVA ya aplicada a esta factura |
| `TAX_002` | Tax | El porcentaje de retención excede el límite legal |
| `ACCT_001` | Accounting | El asiento no está balanceado (débito ≠ crédito) |
| `ACCT_002` | Accounting | Período contable cerrado |

---

## 4. Paginación

### Query Parameters estándar

```
GET /api/products?page=1&limit=20&sort=name&order=asc&search=laptop
```

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | `number` | `1` | Número de página (1-indexado) |
| `limit` | `number` | `20` | Items por página (máx 100) |
| `sort` | `string` | `createdAt` | Campo por el cual ordenar |
| `order` | `asc \| desc` | `desc` | Dirección del ordenamiento |
| `search` | `string` | — | Búsqueda textual (nombre, código, etc.) |

### DTO de paginación (backend)

```typescript
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## 5. Versionado de API

### Estrategia: URL prefix

```
/api/v1/products
/api/v2/products    ← Solo si hay breaking change
```

### Reglas de versionado

1. **La versión actual es `v1`** — implícita en `/api/` (sin prefijo).
2. **Breaking change** = eliminar un campo del response, cambiar tipo de dato, renombrar endpoint, cambiar comportamiento de un parámetro.
3. **No-breaking change** = agregar nuevo campo opcional, nuevo endpoint, nuevo query param. No requiere nueva versión.
4. **Máximo 2 versiones activas simultáneamente** (`v1` y `v2`). `v1` se depreca cuando `v2` lleva 3 meses estable.

---

## 6. Filtros y Búsqueda Avanzada

### Filtros por campo

```
GET /api/invoices?status=issued&customerId=uuid&fromDate=2026-01-01&toDate=2026-12-31
```

### Reglas

1. Filtros de rango de fecha usan `from{Field}` y `to{Field}`.
2. Filtros de enum usan el valor del enum como string.
3. Filtros de relación usan el ID de la entidad relacionada.
4. No se permiten queries arbitrarias (`filter[field][operator]=value`). Cada endpoint define explícitamente sus filtros en un DTO.

```typescript
export class InvoiceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fromDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  toDate?: Date;
}
```

---

*Referencia cruzada: [architecture.md](architecture.md) — [security.md](security.md) — [database.md](database.md)*
