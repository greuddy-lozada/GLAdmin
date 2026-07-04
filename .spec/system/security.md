# Security — Reglas de Seguridad y Control de Acceso

> **Principio rector:** Cuadra maneja datos financieros y fiscales de PyMEs venezolanas.  
> Un error de seguridad aquí no es un bug — es un delito fiscal para el cliente.

---

## 1. Autenticación (AuthN)

### Estrategia: JWT + Refresh Tokens

| Concepto | Implementación |
|---|---|
| Access Token | JWT firmado con `JWT_SECRET`, expira en **15 minutos**. |
| Refresh Token | UUID v4 almacenado en BD (`refresh_tokens` table), expira en **7 días**. |
| Almacenamiento frontend | Access token en memoria (variable JS). Refresh token en **httpOnly cookie** (no accesible desde JS). |
| Rotación de refresh tokens | Al usar un refresh token, se invalida el viejo y se emite uno nuevo (refresh token rotation). |
| Blacklisting | Tokens revocados (logout, cambio de contraseña) se almacenan en Redis/BD con TTL igual a su expiración restante. |

### Endpoints de Auth

```
POST /api/auth/login          → { email, password }          → { accessToken }
POST /api/auth/refresh        → (cookie: refreshToken)       → { accessToken, newRefreshToken }
POST /api/auth/logout         → (cookie: refreshToken)       → invalida refresh token
POST /api/auth/register       → { email, password, ... }     → (solo Admin puede crear usuarios)
```

### Rate Limiting específico para Auth

| Endpoint | Límite | Ventana |
|---|---|---|
| `/api/auth/login` | 5 intentos | 1 minuto por IP |
| `/api/auth/login` | 10 intentos | 1 hora por email |
| `/api/auth/refresh` | 30 intentos | 1 minuto |
| `/api/auth/register` | 3 intentos | 1 hora (solo Admin) |

---

## 2. Control de Acceso Basado en Roles (RBAC)

### Roles definidos

| Rol | Descripción | Permisos clave |
|---|---|---|
| `superadmin` | Dueño del sistema / Administrador principal | Acceso total. Crea empresas y asigna admins. |
| `admin` | Administrador de la empresa | CRUD completo en su empresa. Gestiona usuarios, roles y secuenciales. |
| `accountant` | Contador | Acceso de lectura a facturas, productos, clientes. Escritura limitada: registros contables, notas de crédito/débito, retenciones. |
| `cashier` | Cajero / Vendedor | Solo acceso al módulo POS. Crea facturas de venta. No puede anular ni modificar facturas existentes. |
| `viewer` | Auditor / Consulta | Solo lectura en reportes. Sin permisos de escritura en ningún módulo. |

### Implementación en NestJS

```typescript
// Decorador personalizado
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // Endpoint público
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Uso en controlador
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  @Post()
  @Roles(Role.ADMIN, Role.CASHIER)    // Solo Admin y Cajero pueden crear facturas
  create(@Body() dto: CreateInvoiceDto) { ... }
  
  @Delete(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)  // Solo Admin y Contador pueden anular
  annul(@Param('id') id: string) { ... }
}
```

### Principio de menor privilegio

- Todo endpoint nuevo **por defecto requiere autenticación**.  
- Los permisos se asignan explícitamente con `@Roles()`.  
- Un endpoint sin `@Roles()` = endpoint público (ej. login, health check).  

---

## 3. ⚖️ Inmutabilidad Contable (REGLA DE ORO)

> **NINGÚN registro financiero, factura, nota de crédito/débito, retención fiscal, asiento contable o documento con valor legal-fiscal en Venezuela puede ser EDITADO con una operación `UPDATE` sobre el registro original.**

### ¿Por qué?

Las leyes fiscales venezolanas (Providencia SENIAT, Código de Comercio) exigen:
- Trazabilidad ininterrumpida de cada documento fiscal.
- Prohibición expresa de alterar documentos ya emitidos.
- En caso de error: **anular** el documento original y **emitir uno nuevo** que lo compense.

### Implementación técnica

| Operación | Permitido | Cómo se implementa |
|---|---|---|
| Crear factura | ✅ | `INSERT INTO invoices` |
| Modificar factura emitida | ❌ | **Prohibido.** No existe endpoint `PATCH /api/invoices/:id` para facturas con `status = 'issued'`. |
| Anular factura | ✅ | `INSERT INTO invoice_annulments` con referencia al invoice original + motivo legal. El invoice original cambia `status` a `'annulled'` pero sus campos de monto, IVA, total **no se modifican**. |
| Nota de crédito | ✅ | `INSERT INTO credit_notes` (nuevo registro que compensa total o parcialmente la factura original). |
| Nota de débito | ✅ | `INSERT INTO debit_notes` (nuevo registro que incrementa el monto adeudado). |
| Retención de IVA/ISLR | ✅ | `INSERT INTO tax_withholdings` vinculado a la factura original. **Nunca** se modifica la factura para reflejar la retención. |
| Asiento contable | ❌ | Una vez registrado en el libro diario, no se modifica. Si hay error → asiento de ajuste (nuevo INSERT). |

### Reglas de validación obligatorias

```typescript
// En el service de facturación — esto DEBE existir
async updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
  const invoice = await this.prisma.invoice.findUnique({ where: { id } });
  
  if (invoice.status === 'issued' || invoice.status === 'annulled') {
    throw new ForbiddenException(
      'Las facturas emitidas o anuladas no pueden modificarse. Use una nota de crédito/débito.'
    );
  }
  
  // Solo se permite modificar facturas en estado 'draft'
  return this.prisma.invoice.update({ where: { id }, data: dto });
}
```

### Columnas protegidas contra UPDATE

En el schema de Prisma, las siguientes columnas de tablas financieras **nunca deben aparecer en un DTO de Update**:

- `total`, `subtotal`, `tax_amount`, `discount_amount`
- `invoice_number`, `control_number` (secuencial fiscal)
- `issued_at`, `created_at`
- `company_id`, `customer_id` (la entidad emisora y receptora son inmutables)

---

## 4. Protección de Datos

### PII (Personally Identifiable Information)

| Dato | Clasificación | Protección |
|---|---|---|
| RIF / Cédula | PII sensible | Encriptado en reposo (AES-256). No se loggea. |
| Email | PII básico | No se expone en logs. |
| Teléfono | PII básico | No se expone en logs. |
| Dirección fiscal | PII básico | Solo visible para Admin y Contador. |
| Contraseñas | Secreto | Hash bcrypt (salt rounds = 12). Nunca en logs, nunca en responses. |

### Reglas de logs

```typescript
// ❌ PROHIBIDO
console.log(`Usuario ${user.email} con RIF ${user.rif} inició sesión`);

// ✅ CORRECTO
this.logger.log(`User login`, { userId: user.id, role: user.role });
```

---

## 5. Validación de Inputs

- **Toda entrada del frontend es maliciosa hasta que se demuestre lo contrario.**
- Usar `class-validator` con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- Validar tipo, longitud, formato y rango para cada campo de cada DTO.
- Sanitizar strings: `class-sanitizer` o `validator.js` para prevenir XSS.

```typescript
// Ejemplo de DTO con validación completa
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[JVEGP]-\d{5,9}-\d{1}$/, { message: 'Formato de RIF inválido' })
  rif: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}
```

---

---

## 6. API Security — Defensa en Capa HTTP

### Rate Limiting por Endpoint

| Endpoint group | Límite | Ventana | Motivo |
|---|---|---|---|
| `/api/auth/*` | 5 req/min | 1 min | Prevenir brute force de login |
| `/api/products`, `/api/customers` (GET) | 100 req/min | 1 min | Listados de alta frecuencia |
| `/api/invoices`, `/api/pos` (POST, PATCH) | 30 req/min | 1 min | Operaciones de escritura más pesadas |
| `/api/reports/*` (GET) | 10 req/min | 1 min | Generación de reportes costosa |
| `/api/*` (resto) | 60 req/min | 1 min | Default |

```typescript
// Implementación con @nestjs/throttler
import { ThrottlerGuard, Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('reports')
@UseGuards(ThrottlerGuard)
export class ReportsController {
  @Get('monthly-sales')
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // Más restrictivo
  getMonthlySales() { ... }
}
```

### CORS

```typescript
// main.ts — Configuración global
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://cuadra.app', 'https://admin.cuadra.app']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,              // Cookies (refresh token)
  maxAge: 86400,                  // Cache preflight por 24h
});
```

### Headers de Seguridad (Helmet)

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],   // Next.js requiere unsafe-inline en dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL],
    },
  },
  crossOriginEmbedderPolicy: false,   // Necesario para Next.js
  hsts: {
    maxAge: 31536000,                 // 1 año
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Headers obligatorios en producción

| Header | Valor | Propósito |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forzar HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevenir clickjacking |
| `X-XSS-Protection` | `0` | Obsoleto pero incluido por compatibilidad |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controlar leakage de URL |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Deshabilitar APIs innecesarias |

---

*Referencia cruzada: [architecture.md](architecture.md) — [database.md](database.md)*
