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

### Arquitectura: dos tipos de rol

Los roles se dividen en dos tipos que operan en capas separadas:

| Tipo | Propósito | Asignado en | Check vía |
|---|---|---|---|
| `system` | Acceso al panel de administración global | `User.idRole` (sistema) | `@MinLevel()` |
| `org` | Permisos dentro de una organización | `UserOrganization.roleId` | `@MinOrgLevel()` |

Un usuario puede tener ambos simultáneamente: un role de sistema (master/admin) para el panel admin y un org-role (executive/manager/employee) dentro de cada organización.

### Roles definidos

| Slug | Tipo | Nivel | Descripción |
|---|---|---|---|
| `master` | system | 100 | Super-admin. Acceso total al panel de administración. Crea admins, organizaciones y planes. |
| `admin` | system | 90 | Operador del panel de administración. CRUD de organizaciones, usuarios e invitaciones (escrituras sujetas a aprobación de master). |
| `executive` | org | 80 | Rol orgánico superior. Gestiona usuarios y configuraciones dentro de la organización. |
| `manager` | org | 60 | Rol orgánico medio. Crea y edita miembros del equipo. |
| `employee` | org | 40 | Rol orgánico base. Acceso de lectura/escritura limitado a operaciones del día a día. |

**Relación entre niveles:** Un rol puede asignar cualquier rol cuyo nivel sea **estrictamente menor** al suyo, con excepción de `master` que puede asignar cualquier rol.

### Implementación en NestJS

```typescript
// Decoradores de nivel (min-level.decorator.ts)
import { SetMetadata } from '@nestjs/common';
export const MIN_LEVEL_KEY = 'minLevel';
export const MinLevel = (level: number) => SetMetadata(MIN_LEVEL_KEY, level);
export const MIN_ORG_LEVEL_KEY = 'minOrgLevel';
export const MinOrgLevel = (level: number) => SetMetadata(MIN_ORG_LEVEL_KEY, level);

// Guard (roles.guard.ts) — lógica simplificada
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const minLevel = this.reflector.get(MIN_LEVEL_KEY, context.getHandler());
    const minOrgLevel = this.reflector.get(MIN_ORG_LEVEL_KEY, context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    
    if (minLevel !== undefined) {
      if (!user?.role) throw new ForbiddenException();
      const level = ROLE_LEVEL[user.role as keyof typeof ROLE_LEVEL];
      if (level < minLevel) throw new ForbiddenException();
    }
    
    if (minOrgLevel !== undefined) {
      if (!user?.orgRole) throw new ForbiddenException();
      const level = ROLE_LEVEL[user.orgRole as keyof typeof ROLE_LEVEL];
      if (level < minOrgLevel) throw new ForbiddenException();
    }
    
    return true;
  }
}
```

### Uso en controladores

**Endpoints de administración (system):**
```typescript
@Controller('admin/orgs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrgsController {
  @Get()
  @MinLevel(ROLE_LEVEL.admin)         // admin (90) + master (100)
  findAll() { ... }
  
  @Delete(':id')
  @MinLevel(ROLE_LEVEL.master)        // solo master (100)
  remove(@Param('id') id: string) { ... }
}
```

**Endpoints orgánicos (org):**
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  @Post()
  @MinOrgLevel(ROLE_LEVEL.manager)    // manager (60) + executive (80)
  create(@Body() dto: CreateUserDto) { ... }
  
  @Delete(':id')
  @MinOrgLevel(ROLE_LEVEL.executive)  // solo executive (80)
  remove(@Param('id') id: string) { ... }
}
```

### Role hierarchy — asignación entre roles

La jerarquía se almacena en la base de datos (columna `level` del `Role`) y se carga en un cache estático al iniciar la aplicación vía `RoleHierarchyInitService`:

| Actor \ Target | master | admin | executive | manager | employee |
|---|---|---|---|---|---|
| **master** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **admin** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **executive** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **manager** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **employee** | ❌ | ❌ | ❌ | ❌ | ❌ |

Las funciones `canAssignRole()` y `assertCanAssignRole()` se usan en servicios para validar asignaciones antes de persistir.

### Seed automático (BootstrapService)

`BootstrapService.setup()` crea los 5 roles al iniciar por primera vez usando upsert por slug:

```typescript
const seedRoles = [
  { name: 'Master', slug: 'master', type: 'system', level: 100 },
  { name: 'Admin', slug: 'admin', type: 'system', level: 90 },
  { name: 'Executive', slug: 'executive', type: 'org', level: 80 },
  { name: 'Manager', slug: 'manager', type: 'org', level: 60 },
  { name: 'Employee', slug: 'employee', type: 'org', level: 40 },
];
```

### Admin Approval Workflow

Los módulos del panel de administración operan bajo un modelo **"execute then approve"**: cuando un usuario con rol `admin` realiza una operación de escritura, la acción se ejecuta inmediatamente y se registra en la tabla `admin_approvals` con estado `pending`. El usuario `master` revisa la acción y puede `approve` (confirmar) o `reject` (revertir mediante compensación).

**Acciones que generan approval:**
- Organizaciones: `CREATE_ORG`, `UPDATE_ORG`
- Planes: `CREATE_PLAN`, `UPDATE_PLAN`
- Usuarios admin: `CREATE_ADMIN_USER`, `UPDATE_ADMIN_USER`
- Asignaciones: `ASSIGN_USER_ORG`, `REMOVE_USER_ORG`, `CHANGE_USER_ROLE`
- Invitaciones: `CREATE_INVITE`

**Acciones que siguen siendo master-only (sin approval):**
- Todas las operaciones `DELETE`
- Lecturas (GET)

**Mecanismo de compensación al rechazar:**
| Acción | Compensación |
|---|---|
| `CREATE_ORG` | Soft-delete (isActive=false, deletedAt) |
| `UPDATE_ORG` | Restaura oldValues |
| `CREATE_PLAN` | Desactiva el plan |
| `UPDATE_PLAN` | Restaura oldValues |
| `CREATE_ADMIN_USER` | Desactiva el usuario |
| `UPDATE_ADMIN_USER` | Restaura oldValues |
| `ASSIGN_USER_ORG` | Elimina la membresía |
| `REMOVE_USER_ORG` | Recrea la membresía |
| `CHANGE_USER_ROLE` | Restaura el role anterior |
| `CREATE_INVITE` | Elimina la invitación |

**Frontend:** El módulo `admin/approvals` muestra una tabla con filtros por estado (Pending/Approved/Rejected). Solo visible para `master` (`minLevel: 100`).

---

### Principio de menor privilegio

- Todo endpoint nuevo **por defecto requiere autenticación**.  
- Los permisos se asignan explícitamente con `@MinLevel()` o `@MinOrgLevel()`.  
- Un endpoint sin decorador de nivel = endpoint público (ej. login, health check).
- Los roles de sistema y org son independientes: tener `role: 'admin'` no otorga permisos orgánicos, y tener `orgRole: 'executive'` no otorga acceso al panel admin. 

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

| Header | Valor | Propósito | Estado |
|---|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forzar HTTPS | ✅ helmet |
| `X-Content-Type-Options` | `nosniff` | Prevenir MIME sniffing | ✅ helmet |
| `X-Frame-Options` | `DENY` | Prevenir clickjacking | ✅ helmet |
| `X-XSS-Protection` | `0` | Obsoleto pero incluido por compatibilidad | ✅ helmet |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controlar leakage de URL | ✅ helmet |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Deshabilitar APIs innecesarias | ✅ middleware manual (helmet 8 no lo incluye) |

### Sanitización de inputs (implementado)

- Pipe global `SanitizePipe` (antes de `ValidationPipe`): `trim()` + elimina null bytes (`\0`) en body y query.
- **Nunca toca** campos `password`, `token`, `secret`, `currentPassword`, `newPassword`, `refreshToken`, `accessToken`.
- **No hace escaping HTML** — corrompe datos legítimos (razones sociales con `&`). XSS se previene con output encoding de React + CSP.
- Accesos denegados (401/403) se registran en `AuditLog` (fire-and-forget) cuando hay `orgId` en el token; si no, solo warning estructurado en logs.

---

*Referencia cruzada: [architecture.md](architecture.md) — [database.md](database.md)*
