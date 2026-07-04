# Deployment — Despliegue y Entorno de Desarrollo

> **Principio rector:** Cualquier desarrollador nuevo debe poder levantar el proyecto completo en **menos de 5 minutos** siguiendo este documento.

---

## 1. Requisitos del Entorno

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| Node.js | ≥ 20 LTS | `node --version` |
| pnpm | ≥ 9 | `pnpm --version` |
| PostgreSQL | ≥ 16 | `psql --version` |
| Docker | ≥ 26 | `docker --version` |
| Docker Compose | ≥ 2 | `docker compose version` |
| Git | ≥ 2.40 | `git --version` |

---

## 2. Configuración Inicial (Local)

### 2.1 Clonar e instalar dependencias

```bash
git clone <repo-url> cuadra
cd cuadra
pnpm install
```

### 2.2 Variables de entorno

```bash
# Copiar el template de variables
cp .env.example .env

# Editar .env con tus valores locales
# MÍNIMO requerido para desarrollo:
#   DATABASE_URL
#   JWT_SECRET
#   JWT_REFRESH_SECRET
```

### 2.3 Base de datos con Docker

```bash
# Levantar solo PostgreSQL
docker compose up -d postgres

# Ejecutar migraciones
pnpm run db:migrate

# Sembrar datos de prueba
pnpm run db:seed
```

### 2.4 Iniciar desarrollo

```bash
# Inicia backend (puerto 3001) + frontend (puerto 3000) en paralelo
pnpm run dev
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Prisma Studio | `npx prisma studio` (http://localhost:5555) |

---

## 3. Docker Compose — Stack Completo

### `docker-compose.yml` (estructura esperada)

```yaml
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

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://cuadra:cuadra_dev@postgres:5432/cuadra_dev
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 4. Variables de Entorno Críticas

### `.env.example`

```bash
# ── Base de datos ──
DATABASE_URL="postgresql://cuadra:cuadra_dev@localhost:5432/cuadra_dev"

# ── JWT ──
JWT_SECRET="cambia-esto-en-produccion-min-32-chars"
JWT_REFRESH_SECRET="cambia-esto-en-produccion-min-32-chars"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# ── Aplicación ──
NODE_ENV="development"
PORT=3001
API_PREFIX="/api"

# ── Frontend ──
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_APP_NAME="Cuadra"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── Seguridad ──
BCRYPT_SALT_ROUNDS="12"
RATE_LIMIT_TTL="60"
RATE_LIMIT_MAX="100"

# ── Email (Opcional en dev) ──
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM="noreply@cuadra.app"

# ── Storage (Opcional en dev) ──
STORAGE_PROVIDER="local"          # local | s3
STORAGE_LOCAL_PATH="./uploads"
# S3_BUCKET=""
# S3_REGION=""
# S3_ACCESS_KEY=""
# S3_SECRET_KEY=""

# ── Observabilidad ──
LOG_LEVEL="debug"                 # debug | info | warn | error
SENTRY_DSN=""                     # Solo en staging/producción

# ── Feature Flags ──
FF_ACCOUNTING_MODULE="false"      # Módulo de contabilidad (en desarrollo)
FF_TAX_REPORTS="false"            # Reportes fiscales venezolanos (en desarrollo)
```

---

## 5. Scripts del Monorepo (`package.json` raíz)

```json
{
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "dev:backend": "pnpm --filter backend dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "build": "pnpm run --parallel build",
    "lint": "pnpm run --parallel lint",
    "typecheck": "pnpm run --parallel typecheck",
    "test": "pnpm run --parallel test",
    "test:e2e": "pnpm --filter backend test:e2e",
    "db:migrate": "pnpm --filter backend prisma:migrate",
    "db:migrate:staging": "pnpm --filter backend prisma:migrate:deploy",
    "db:seed": "pnpm --filter backend prisma:seed",
    "db:reset": "pnpm --filter backend prisma:reset",
    "db:studio": "pnpm --filter backend prisma:studio",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:build": "docker compose build",
    "clean": "pnpm -r exec rm -rf dist node_modules/.cache .next"
  }
}
```

---

## 6. Flujo de Despliegue a Staging

```
1. PR mergeado a main
     ↓
2. CI (GitHub Actions):
   - pnpm install
   - pnpm lint         (0 warnings)
   - pnpm typecheck    (0 errors)
   - pnpm test         (todos los tests pasan)
   - pnpm build        (build exitoso)
     ↓
3. CD (GitHub Actions):
   - docker compose build
   - docker push (imagen a registry)
   - ssh → servidor staging
   - docker compose pull && docker compose up -d
   - pnpm --filter backend prisma:migrate:deploy
   - Smoke tests (ver release-policy.md)
     ↓
4. Staging listo para validación manual
```

---

## 7. Salud del Servicio

### Health Check Endpoint

```
GET /api/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "uptime": 123456,
  "database": "connected",
  "version": "1.0.0"
}
```

### Docker Health Checks

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

---

---

## 8. Dependency Policy — Gestión de Dependencias

### Licencias permitidas

| Licencia | Permitida |
|---|---|
| MIT | ✅ |
| Apache 2.0 | ✅ |
| BSD (2-Clause, 3-Clause) | ✅ |
| ISC | ✅ |
| Unlicense | ✅ (dominio público) |
| GPL (v2, v3) | ❌ — Copyleft, incompatible con SaaS propietario |
| AGPL | ❌ — Copyleft de red |
| CC BY-NC | ❌ — No comercial |
| Sin licencia | ❌ — Requiere aprobación explícita del tech lead |

### Verificación de licencias

```bash
# Auditoría de licencias (usar license-checker o similar)
pnpm license-checker --production --summary

# Bloquear en CI
pnpm license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;Unlicense"
```

### Cadencia de actualización

| Tipo | Frecuencia | Herramienta |
|---|---|---|
| **Security patches** | Inmediato (24h max) | Dependabot security alerts + auto-merge |
| **Patch updates** (1.2.3 → 1.2.4) | Semanal (automático) | Renovate / Dependabot |
| **Minor updates** (1.2.3 → 1.3.0) | Mensual (con review) | Renovate / Dependabot + PR manual |
| **Major updates** (1.2.3 → 2.0.0) | Planificado (por milestone) | Manual, con plan de migración |

### Auditoría de seguridad

```bash
# Semanal — corre en CI y local
pnpm audit

# Si hay vulnerabilidades:
# 1. Revisar severidad
# 2. Critical/High: fix inmediato
# 3. Moderate: planificar en el sprint actual
# 4. Low: planificar en el siguiente sprint
```

### Reglas de versionado en package.json

```json
{
  "dependencies": {
    "nestjs": "^10.4.0",        // ✅ Caret: permite patch y minor (seguro)
    "prisma": "~6.0.0",         // ✅ Tilde: solo patch (más conservador)
    "class-validator": "0.14.1"  // ✅ Exacta: pin manual (máxima estabilidad)
  }
}
```

**Regla:** Dependencias core del framework (NestJS, Next.js, Prisma) usan caret. Utilidades de validación y transformación usan exacta.

---

## 9. Monitoring — Observabilidad en Producción

### Métricas expuestas

```
GET /api/metrics
```

| Métrica | Tipo | Descripción |
|---|---|---|
| `http_requests_total` | Counter | Requests totales por endpoint, método y status |
| `http_request_duration_seconds` | Histogram | Latencia P50, P95, P99 por endpoint |
| `db_pool_connections_active` | Gauge | Conexiones activas en el pool de Prisma |
| `db_pool_connections_idle` | Gauge | Conexiones inactivas |
| `db_query_duration_seconds` | Histogram | Latencia de queries individuales |
| `auth_failures_total` | Counter | Intentos de login fallidos por IP |
| `errors_total` | Counter | Errores 5xx por endpoint |

### Logs estructurados (Pino)

```typescript
// logger.config.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { severity: label };
    },
  },
  redact: {
    paths: ['password', 'token', 'rif', 'email', 'phone'],
    censor: '[REDACTED]',
  },
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

### Formato de log esperado

```json
{
  "severity": "info",
  "time": "2026-07-03T12:00:00.000Z",
  "msg": "Invoice created",
  "userId": "uuid",
  "companyId": "uuid",
  "invoiceId": "uuid",
  "duration": 45
}
```

### Thresholds de alerta

| Condición | Severidad | Canal |
|---|---|---|
| Error rate > 5% por 5 minutos | 🔴 Critical | PagerDuty / OpsGenie |
| P95 latency > 500ms por 10 minutos | 🟠 Warning | Slack #cuadra-alerts |
| DB pool > 80% utilizado | 🟠 Warning | Slack #cuadra-alerts |
| Login failures > 20/min por IP | 🟡 Info | Slack #cuadra-alerts |
| Sin health checks por 2 minutos | 🔴 Critical | PagerDuty |
| Disco del servidor > 85% | 🟠 Warning | Slack #cuadra-alerts |
| Cuota de API externa (SENIAT, email) > 80% | 🟡 Info | Slack #cuadra-alerts |

### Uptime y Status Page

- Health check público: `https://cuadra.app/api/health`
- Status page (recomendado): BetterStack / Statuspal
- Monitoreo externo: UptimeRobot o similar, chequeo cada 60s desde 3 regiones

---

*Referencia cruzada: [release-policy.md](release-policy.md) | [database.md](../system/database.md)*
