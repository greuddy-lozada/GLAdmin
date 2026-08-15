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

### 2.3 Base de datos con Podman

```bash
# Levantar solo PostgreSQL
podman run -d --name cuadra-postgres \
  -e POSTGRES_USER=cuadra \
  -e POSTGRES_PASSWORD=cuadra_dev \
  -e POSTGRES_DB=cuadra_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Redis (opcional en dev — sin REDIS_URL el backend usa cache in-memory)
podman run -d --name cuadra-redis -p 6379:6379 redis:7-alpine

# Ejecutar schema (primer inicio)
pnpm --filter backend exec prisma db push

# Sembrar datos de prueba
pnpm --filter backend exec tsx prisma/seed.ts
```

### 2.3.1 Pruebas de carga (K6)

Requiere el binario K6 instalado (`brew install k6` / `sudo dnf install k6`). Backend debe estar corriendo.

```bash
pnpm test:load              # smoke (1 VU, 1 min)
pnpm test:load:products     # ramp 50 VUs — GET products
pnpm test:load:sync         # 30 VUs — sync pull
# POS crea ventas reales — solo staging:
BASE_URL=https://staging.../api pnpm test:load:pos
```

### 2.4 Iniciar desarrollo

```bash
# Inicia backend (puerto 4000) + frontend (puerto 3000) en paralelo
# El frontend corre directamente (hot reload), no en Docker
# PostgreSQL debe estar corriendo previamente (paso 2.3)
pnpm run dev
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| Prisma Studio | `npx prisma studio` (http://localhost:5555) |

> **Nota:** El frontend se sirve con `next dev` (Turbopack, hot reload) durante desarrollo. No se usa Docker para el frontend en ningún entorno — desarrollo usa `next dev`, producción usa `output: 'export'` + CDN.

---

## 3. Docker Compose — Backend + Base de Datos

> **El frontend se sirve como estático (ver §3.1).** Solo backend y PostgreSQL requieren contenedores.

### `docker-compose.yml`

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
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "cuadra"]
      interval: 10s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://cuadra:cuadra_dev@postgres:5432/cuadra_dev
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

> **Nota:** El servicio `frontend` fue eliminado del compose. El frontend se sirve como archivos estáticos (ver §3.1).

### 3.1 Frontend — Static Export

Cuadra es arquitectónicamente una SPA: **0 API routes en Next.js**, **0 server-side data fetching**, **100% de las páginas son `'use client'`** o wrappers vacíos. El frontend se construye como estático con `output: 'export'` y se sirve desde cualquier CDN o hosting estático. El servidor Node.js del frontend **no es necesario**.

#### Configuración

**`next.config.mjs`:**
```js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
};
```

**`frontend/.env.production`:**
```
NEXT_PUBLIC_API_URL=https://api.cuadra.app/api
```

> El cliente llama directamente al backend via `NEXT_PUBLIC_API_URL`. El proxy `rewrites()` fue eliminado — era un atajo de desarrollo, no una necesidad arquitectónica.

#### Build

```bash
pnpm --filter frontend build    # → frontend/out/ (~5MB, 36 páginas estáticas)
```

#### Deploy

| Plataforma | Build command | Output dir |
|---|---|---|
| **Cloudflare Pages** | `pnpm --filter frontend build` | `frontend/out` |
| **Netlify** | `pnpm --filter frontend build` | `frontend/out` |
| **Vercel** | Override build: `pnpm --filter frontend build` | `frontend/out` |
| **S3 + CloudFront** | Build en CI, upload `out/` al bucket | `frontend/out` |
| **Nginx / Caddy** | Build en CI, copia `out/` al servidor | `frontend/out` |

#### CORS — Backend

El backend debe permitir CORS desde el dominio del frontend estático. Ya está configurado en `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
});
```

Para producción: `FRONTEND_URL=https://cuadra.app`.

#### PWA / Service Worker

Serwist genera el service worker durante el build estático. Configuración en `sw.ts`. El archivo `manifest.ts` requiere `export const dynamic = 'force-static'` para compatibilidad con `output: 'export'`. Build verificado: 66 precache entries, ~2MB.

---

## 4. Variables de Entorno Críticas

### Matriz rápida (producción)

| Variable | Dónde | Notas |
|---|---|---|
| `DATABASE_URL` / `POSTGRES_*` | backend / compose | Nunca en git |
| `JWT_SECRET` | backend | Access JWT 15m en código |
| `FRONTEND_URL` | backend | CORS / links; HTTPS en prod |
| `NEXT_PUBLIC_API_URL` | frontend | URL pública API |
| `REDIS_URL` | backend (opcional) | Cache; fallback in-memory |
| Pago Móvil secrets | backend settings | No loguear |
| `SENTRY_DSN` | staging/prod | Opcional |

Archivos: `backend/.env.example`, `.env.production.example` (raíz). **No** asumir `.env.example` en la raíz del monorepo.

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
# Desarrollo (.env.local):
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
# Producción (.env.production):
# NEXT_PUBLIC_API_URL="https://api.cuadra.app/api"
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
    "build:frontend": "pnpm --filter frontend build",
    "lint": "pnpm run --parallel lint",
    "typecheck": "pnpm run --parallel typecheck",
    "test": "pnpm run --parallel test",
    "test:e2e": "pnpm --filter e2e test",
    "db:push": "pnpm --filter backend exec prisma db push",
    "db:seed": "pnpm --filter backend exec tsx prisma/seed.ts",
    "db:studio": "pnpm --filter backend exec prisma studio",
    "podman:up": "podman run -d --name cuadra-postgres -e POSTGRES_USER=cuadra -e POSTGRES_PASSWORD=cuadra_dev -e POSTGRES_DB=cuadra_dev -p 5432:5432 postgres:16-alpine",
    "podman:start": "podman start cuadra-postgres",
    "clean": "pnpm -r exec rm -rf dist node_modules/.cache .next out"
  }
}
```

---

## 6. Staging on VPS (IP, automated)

Target for tester demos **without a domain**: SSH + Docker VPS, served at `https://YOUR_IP:8443` (self-signed LAN TLS). HTTP remains on `http://YOUR_IP:8081` as a fallback.

Stack on the server ([`docker-compose.prod.yml`](../../docker-compose.prod.yml)):

| Service | Role |
|---|---|
| `postgres` | Database (not published publicly) |
| `redis` | Cache |
| `backend` | NestJS API on internal port 4000 |
| `nginx` | Static `frontend/out` + reverse proxy `/api` → backend; host ports **8081** (HTTP) and **8443** (HTTPS) |

Frontend is built as a static export with `NEXT_PUBLIC_API_URL=/api` (same origin via Nginx). No separate Node process for Next.js.

### 6.1 One-time server bootstrap

```bash
# On the VPS (Docker already installed)
sudo mkdir -p /opt/cuadra && sudo chown "$USER:$USER" /opt/cuadra
git clone <your-repo-url> /opt/cuadra
cd /opt/cuadra

cp .env.production.example .env.production
# Edit .env.production:
#   POSTGRES_PASSWORD=...
#   JWT_SECRET=...   (min 32 random chars)
#   FRONTEND_URL=https://YOUR_IP:8443

# Open the published ports (example with ufw; Alpine may use iptables instead)
sudo ufw allow 8081/tcp
sudo ufw allow 8443/tcp

# First deploy (TLS cert + frontend build + compose + migrate + seed)
bash scripts/deploy.sh
```

`scripts/deploy.sh` calls [`scripts/generate-lan-tls.sh`](../../scripts/generate-lan-tls.sh), which writes a self-signed cert with an **IP SAN** to `nginx/certs/` (gitignored). Host port **8443** is used because many VPS already run OpenResty/nginx on **443**.

Create a **deploy-only SSH key** on your laptop (or CI machine), add the public key to `~/.ssh/authorized_keys` on the VPS for the deploy user, and keep the private key for GitHub Actions only.

### 6.2 GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Required | Example |
|---|---|---|
| `DEPLOY_HOST` | yes | `203.0.113.10` |
| `DEPLOY_USER` | yes | `deploy` |
| `DEPLOY_SSH_KEY` | yes | Private key PEM (full contents) |
| `DEPLOY_PATH` | no | `/opt/cuadra` (default if empty) |

Workflows: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (automatic) · [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) (manual)

- After **CI quality** succeeds on a **push to `dev`**, the same workflow SSHs to the VPS (`deploy` job). This does **not** use `workflow_run` (that event only registers from the default branch).
- Manual: **Actions → Deploy → Run workflow** (the `Deploy` workflow must exist on the branch you select; prefer `dev` or `main`).

### 6.3 Automated flow

```
1. Push / merge to dev
     ↓
2. CI (lint + typecheck for backend & frontend)
     ↓
3. Same workflow `deploy` job SSHs to the VPS and runs scripts/deploy.sh:
   - Ensure nginx/certs self-signed LAN TLS (IP SAN)
   - git fetch + reset --hard origin/dev
   - Build frontend/out via ephemeral node:22 container
   - docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
   - prisma migrate deploy
   - seed (no-op if already seeded)
   - Smoke GET https://127.0.0.1:8443/api/health (-k)
     ↓
4. Testers use https://YOUR_IP:8443 (accept the certificate warning once)
```

### 6.4 Tester access

| Item | Value |
|---|---|
| App URL (preferred) | `https://YOUR_IP:8443` |
| App URL (HTTP fallback) | `http://YOUR_IP:8081` |
| Health | `https://YOUR_IP:8443/api/health` |
| Admin email | `admin@cuadra.app` |
| Admin password | `000000` (from seed — change after first login in real use) |

Notes:

- **Use HTTPS** so browsers expose `crypto.subtle` (offline PIN) and allow service workers. Self-signed certs show a one-time warning — click through / “Advanced → proceed”.
- Regenerate cert after changing IP: `TLS_FORCE=1 bash scripts/generate-lan-tls.sh YOUR_IP` then restart nginx.
- Seed skips if organizations already exist; wipe volumes only if you intentionally want a fresh DB.

### 6.5 Verify & rollback

```bash
# On the VPS
cd /opt/cuadra
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -skf https://127.0.0.1:8443/api/health

# Re-run deploy manually
bash scripts/deploy.sh

# Rollback to a previous commit, then redeploy
git fetch origin
git reset --hard <good-commit-sha>
bash scripts/deploy.sh
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
