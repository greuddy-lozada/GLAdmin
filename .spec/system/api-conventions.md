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
    "message": "Venta eliminada (soft-delete)"
  }
}
```

### Error

```json
{
  "error": {
    "code": "SALE_001",
    "message": "La venta no puede modificarse en su estado actual",
    "details": [
      { "field": "status", "reason": "El estado actual no es mutable" }
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
| `SALE_001` | Sales | Venta inmutable (ISSUED/ANNULLED) — no update |
| `SALE_002` | Sales | Venta no encontrada |
| `SALE_003` | Sales | Sin ítems (definido; uso parcial) |
| `PO_001`–`PO_008` | Purchase orders | Inmutabilidad / recepción / withholding — ver `error-codes.ts` |
| `PRODUCT_001` | Products | Código duplicado (si aplica) |
| `CUSTOMER_001` | Customers | RIF duplicado en org |

Fuente de verdad de códigos: `backend/src/common/errors/error-codes.ts`. **No usar `INVOICE_*`.**


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

### Estrategia actual

```
/api/products
/api/sales
/api/sync/pull
```

El prefijo global es **`api`** (`main.ts`). No hay `/api/v1` en producción hoy.

### Reglas de versionado (futuro)

1. Breaking changes mayores pueden introducir `/api/v2` — no inventar `v1` en paths actuales.
2. No-breaking = campos opcionales nuevos, endpoints nuevos.
3. Documentar breaking changes en el PR + api-conventions.
4. **Sync y POS no esperan `/api/v2`.** Un cambio de `POST /api/sync/push`, `GET /api/sync/pull` o del payload de sale encolada es breaking para caja (Dexie + cola). Usar expand/contract: el backend acepta shape viejo y nuevo → frontend nuevo → quitar el viejo. No desplegar backend-incompatible y frontend nuevo en el mismo instante. Ver [database.md](database.md) §4 y [deployment.md](../DevOps/deployment.md) §7.

---

## 6. Filtros y Búsqueda Avanzada

### Filtros por campo

```
GET /api/sales?status=DRAFT&idCustomer=uuid&page=1&limit=20
```

### Reglas

1. Filtros de rango de fecha usan `from{Field}` y `to{Field}` cuando el endpoint los exponga.
2. Filtros de enum usan el valor del enum como string (`DRAFT`, `ISSUED`, …).
3. Filtros de relación usan el ID UUID de la entidad relacionada.
4. No se permiten queries arbitrarias. Cada endpoint define filtros en su DTO.

```typescript
export class SaleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['DRAFT', 'ISSUED', 'ANNULLED'])
  status?: string;

  @IsOptional()
  @IsUUID()
  idCustomer?: string;
}
```

> Nota: el `findAll` actual de sales puede no exponer todos estos filtros aún — añadir filtros = actualizar DTO + esta spec.

---

*Referencia cruzada: [architecture.md](architecture.md) — [security.md](security.md) — [database.md](database.md) — [deployment.md](../DevOps/deployment.md) — [features/sales.md](../features/sales.md) — [features/sync.md](../features/sync.md)*
