# Security — Reglas de Seguridad y Control de Acceso

> **status:** `current` · last-verified: 2026-08-08  
> **Principio rector:** Cuadra maneja datos financieros de PyMEs venezolanas.  
> Multi-tenancy: [multi-tenancy.md](multi-tenancy.md) · Plan gating: [plan-gating.md](plan-gating.md) · Ventas: [features/sales.md](../features/sales.md)

---

## 1. Autenticación (AuthN)

### Estrategia: JWT + Refresh Tokens

| Concepto | Implementación (**código actual**) |
|---|---|
| Access Token | JWT firmado con `JWT_SECRET`, expira en **15 minutos** (`expiresIn: '15m'`, response `900`). |
| Refresh Token | Token opaco (`tokenId.rawSecret`) hasheado en BD (`refresh_tokens`), expira en **7 días**. |
| Almacenamiento frontend | **Ambos en `localStorage`** (access + refresh). Authorization: `Bearer`. Refresh proactivo en timer. |
| Emisión | JSON body: `{ accessToken, refreshToken, ... }` — **no** httpOnly cookie. |
| Refresh | `POST /api/auth/refresh` body `{ refreshToken }` → nuevos tokens; rotación (invalida el viejo). |
| Logout | Invalida refresh en BD. |

> Spec antigua (cookie httpOnly + access solo en memoria) está **obsoleta**. No reintroducir cookies sin decisión de producto + migración.

### Endpoints de Auth

```
POST /api/auth/login          → { email, password }              → { accessToken, refreshToken, ... }
POST /api/auth/refresh        → { refreshToken }                 → { accessToken, refreshToken, ... }
POST /api/auth/logout         → invalida refresh token
GET  /api/auth/invites/:code  → preview público (email, org, rol) si invite válido
POST /api/auth/register       → { code, firstName, lastName, userName, password } → crea user + membership + sesión
```

`registerWithInvite` asigna `User.idRole` al rol de sistema `employee` (JWT `@MinLevel`). El rol de la invitación queda en `UserOrganization.roleId` (`orgRole`). No copiar un rol org a `idRole`: eso haría que un ejecutivo de org parezca tener nivel 80 de sistema y rompe el panel admin.

Invites admin: `POST /api/admin/invites` crea el invite y, si `SMTP_*` está configurado, envía el link por correo (`FRONTEND_URL/invite/?code={uuid}`). Sin SMTP el invite se crea igual (copy-link). `GET /api/admin/invites` lista **todas** las invitaciones (no filtra por org activa); orden `createdAt desc`. Ruta de aceptación query (no `/invite/[code]`) por `output: 'export'`.

### Rate Limiting específico para Auth

| Endpoint | Límite | Ventana |
|---|---|---|
| `/api/auth/login` | 5 intentos | 1 minuto por IP |
| `/api/auth/login` | 10 intentos | 1 hora por email |
| `/api/auth/refresh` | 30 intentos | 1 minuto |
| `/api/auth/invites/:code` | 10 intentos | 1 minuto |
| `/api/auth/register` | 3 intentos | 1 hora por IP |

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
      // Platform master/admin operate in any org they have selected.
      if (user?.role === 'master' || user?.role === 'admin') return true;
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

**Subscription payments (platform):**
- `GET /subscription-payments/admin` y `PATCH /subscription-payments/:id/review` usan **`@MinLevel(admin)`** (rol de sistema).  
- No usar `@MinOrgLevel` — un executive/manager de una org no puede listar ni aprobar pagos de otras orgs.

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

Las funciones `canAssignRole()` y `assertCanAssignRole()` se usan en servicios para validar asignaciones antes de persistir — **incluyendo** `AdminService.createUser` / `updateUser` / `assignUserToOrg` / `changeUserRole` (el actor es el `role` de sistema del JWT/DB, no un hardcode a `master`). No se puede asignar un rol `type: system` como membresía org.

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
- Usuarios admin: `CREATE_ADMIN_USER`, `UPDATE_ADMIN_USER`. `GET /api/admin/users` acepta `organizationId` (UUID) para listar solo miembros de esa org; sin el param lista todos.
- Asignaciones: `ASSIGN_USER_ORG`, `REMOVE_USER_ORG`, `CHANGE_USER_ROLE`
- Invitaciones: `CREATE_INVITE`

**Acciones que siguen siendo master-only (sin approval):**
- Todas las operaciones `DELETE`
- Lecturas (GET)

**Mecanismo de compensación al rechazar:**
| Acción | Compensación | Metadata requerida |
|---|---|---|
| `CREATE_ORG` | Soft-delete (isActive=false, deletedAt) | — |
| `UPDATE_ORG` | Restaura oldValues | `oldValues` |
| `CREATE_PLAN` | Desactiva el plan | — |
| `UPDATE_PLAN` | Restaura oldValues | `oldValues` |
| `CREATE_ADMIN_USER` | Desactiva el usuario | — |
| `UPDATE_ADMIN_USER` | Restaura oldValues | `oldValues` |
| `ASSIGN_USER_ORG` | Elimina la membresía | `userId`, `orgId` |
| `REMOVE_USER_ORG` | Recrea la membresía | `oldMembership` |
| `CHANGE_USER_ROLE` | Restaura el role anterior | `oldRoleId`, `userId`, `orgId` |
| `CREATE_INVITE` | Elimina la invitación | — |

Si la compensación falla → `ADMIN_APPROVAL_COMPENSATE_FAILED` (fail-closed; no marcar rejected sin revertir).

**Frontend:** Approvals solo `master` (`minLevel: 100`). Resto del panel admin `minLevel: 90`. Nav `/admin/*` usa `systemRoleSlug`. Gates de UI en módulos org (`RoleGuard`, `canEdit`/`canDelete`) usan `effectiveRoleSlug = max(system, org)` para que un `master` no pierda privilegios al entrar a una organización.

---

### Principio de menor privilegio

- Todo endpoint nuevo **por defecto requiere autenticación**.  
- Los permisos se asignan explícitamente con `@MinLevel()` o `@MinOrgLevel()`.  
- Un endpoint sin decorador de nivel = endpoint público (ej. login, health check).
- Los roles de sistema y org son independientes: tener `role: 'admin'` no otorga permisos orgánicos por defecto, y tener `orgRole: 'executive'` no otorga acceso al panel admin.  
- **Excepción plataforma (`master`/`admin`):** los roles de sistema `master` y `admin` satisfacen cualquier `@MinOrgLevel` (bypass en `RolesGuard` vía `isPlatformOperator`). En tenant context, `master` se marca `isSuperAdmin`; `UsersService.getActorRoleSlug` trata a `master`/`admin` por su rol de sistema (no por la membresía org). Sigue haciendo falta membresía/tenant org para operar datos de esa org. El panel `/admin/*` sigue exigiendo `@MinLevel(admin)` (90+); un ejecutivo de org no entra ahí.
- Alta de usuario: `User.idRole` solo persiste roles `type: system`. Si el formulario/invitación manda un rol org, se guarda `employee` en `idRole` y el rol org en la membresía.  
- `AuthGuard` revalida `role` (sistema) y `orgRole` (membresía) desde BD en cada request; no confiar solo en claims JWT stale.  
- `GET /roles` (org) solo devuelve roles `type: org`. Catálogo completo: `GET /admin/roles` (`@MinLevel(admin)`). 

---

## 3. Inmutabilidad de documentos financieros (REGLA DE ORO)

> **Dominio canónico: `Sale` (`sales`), no `invoices`.**  
> Ningún documento financiero emitido puede mutarse con un `UPDATE` libre sobre montos/líneas. Ver [features/sales.md](../features/sales.md).

### ¿Por qué?

Cuadra aún no es facturación fiscal SENIAT (Later). Aun así, ventas cobradas/emitidas deben ser auditables: no reescribir historia; anular o compensar con nuevos registros cuando exista ese flujo.

### Implementación actual (`SalesService`)

| Operación | Permitido | Cómo |
|---|---|---|
| Crear venta | ✅ | `POST /sales` o `POST /sync/push` → siempre `DRAFT` + decrement stock |
| Modificar venta no mutable (`ISSUED` / `ANNULLED`) | ❌ | `SALE_001` — update bloqueado vía `SALE_STATUS_META.isMutable` |
| Update en `DRAFT` | ✅ limitado | Solo campos no financieros del `UpdateSaleDto` |
| Soft-delete | ✅ | Restore stock + `deletedAt` |
| Anular (`ANNULLED` + motivo) | ⏳ | Schema/status listos; **endpoint no implementado** |

```typescript
// Patrón obligatorio en SalesService.update
if (!SALE_STATUS_META[sale.status]?.isMutable) {
  throw new AppException(/* SALE_001 */);
}
```

### Columnas protegidas en Update DTO

No exponer en update: totales, líneas, payments, tax/withholding amounts, `status` arbitrario.

Notas de crédito/débito / asientos contables: **fuera de scope** hasta roadmap fiscal — no inventar módulos `invoices` / `accounting`.

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
| `/api/sales`, `/api/sync/push` (POST, PATCH) | 30–120 req/min | 1 min | Escrituras de venta / sync (ver controllers) |
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
