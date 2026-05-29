# Production Deployment Guide

## 1. Database: SQLite → PostgreSQL

**Current:** SQLite (`file:./dev.db`) — fine for development, unsuitable for production (no concurrent writes, no replication).

**Target:** PostgreSQL 16+

### Migration steps

```bash
# 1. Update backend/.env
DATABASE_URL="postgresql://user:password@host:5432/gladmin?schema=public"

# 2. Update schema if needed
#    - Remove datasource db { provider = "sqlite" }
#    - Add  datasource db { provider = "postgresql" }
#    - SQLite autoincrement → PostgreSQL serial/bigserial
#    - SQLite @default(now) → @default(now()) (same syntax, fine)

# 3. Generate migration
npx prisma migrate dev --name init

# 4. Seed
npx prisma db seed
```

### Key differences
| Aspect | SQLite | PostgreSQL |
|---|---|---|
| Concurrency | Single-writer | Multi-writer |
| Enum support | No (uses strings) | Native `CREATE TYPE` |
| Decimal precision | REAL (float) | `DECIMAL(10,2)` |

**Prisma handles most differences transparently via its query engine.**

---

## 2. Reverse Proxy (replaces dev CORS)

**Current (dev):** Next.js `rewrites()` in `next.config.mjs`

**Target (prod):** nginx or Caddy in front of both services.

### nginx config example

```nginx
server {
    listen 443 ssl;
    server_name gladmin.example.com;

    ssl_certificate /etc/letsencrypt/live/gladmin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gladmin.example.com/privkey.pem;

    # Frontend (Next.js standalone)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API (NestJS)
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Changes needed in code
| File | Change |
|---|---|
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL=/api` (already set — works with proxy) |
| `frontend/next.config.mjs` | Remove `rewrites()` for production build (or keep — only applies to `next dev`) |
| `backend/src/main.ts` | Remove `enableCors()` — no longer needed (proxy replaces it) |

**Alternatively, keep `enableCors()` if you want to run backend as a separate origin behind a subdomain (e.g., `api.gladmin.com`).** This is fine, just ensure CORS config explicitly lists the frontend origin (not `*`).

---

## 3. Build & Run

### Frontend — standalone output

```bash
cd frontend

# Build
NEXT_PUBLIC_API_URL=/api pnpm build

# Run (standalone mode — outputs to .next/standalone)
pnpm next start -p 3000
```

`next.config.mjs` should include:

```js
const nextConfig = {
  output: 'standalone',    // enables self-contained deployment
  // rewrites removed in prod — nginx handles /api routing
};
```

### Backend — production build

```bash
cd backend
pnpm build
node dist/src/main.js
```

**Recommended: use a process manager:**

```bash
# PM2
pm2 start dist/src/main.js --name backend
pm2 start node_modules/.bin/next --name frontend -- start -p 3000

# Or ecosystem.config.cjs
module.exports = {
  apps: [
    { name: 'backend', script: 'dist/src/main.js', cwd: './backend' },
    { name: 'frontend', script: 'node_modules/.bin/next', args: 'start -p 3000', cwd: './frontend' },
  ],
};
```

---

## 4. Containerized (Docker) — recommended

### Dockerfile (frontend)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN NEXT_PUBLIC_API_URL=/api pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Dockerfile (backend)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
```

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: gladmin
      POSTGRES_USER: gladmin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://gladmin:${DB_PASSWORD}@postgres:5432/gladmin
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
    restart: always

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: /api
    depends_on:
      - backend
    restart: always

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - frontend
      - backend
    restart: always

volumes:
  pgdata:
```

---

## 5. Secrets & Environment

| Variable | Where | Why |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `backend/.env` | Access token signing (min 32 chars, random) |
| `JWT_REFRESH_SECRET` | `backend/.env` | Refresh token signing (different from JWT_SECRET) |
| `NEXT_PUBLIC_API_URL` | `frontend/.env` | `/api` (relative — same origin) |
| `DB_PASSWORD` | docker-compose `.env` | Postgres password |

**Never commit `.env` files.** Use `.env.example` as template.

### Generate secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Security Checklist

- [ ] **HTTPS**: nginx terminates TLS with Let's Encrypt certs
- [ ] **JWT secrets**: strong random values, rotated periodically
- [ ] **CORS removed**: proxy handles routing; or if keeping CORS, pin exact origin
- [ ] **Rate limiting**: add `@nestjs/throttler` on critical endpoints (login, refresh)
    ```ts
    // backend/src/main.ts
    import { ThrottlerGuard } from '@nestjs/throttler';
    ```
- [ ] **SQL injection**: Prisma parameterizes queries — no raw SQL unless via `$queryRawUnsafe`
- [ ] **XSS**: Next.js auto-escapes output; avoid `dangerouslySetInnerHTML`
- [ ] **CSRF**: SameSite cookies; no custom CSRF token needed for token-based auth
- [ ] **Helmet**: add `helmet` middleware for security headers (backed by nginx)
- [ ] **DB backups**: automated `pg_dump` or `wal-g` for point-in-time recovery
- [ ] **Logging**: structured logging (winston/pino) on backend, accessible via stdout for Docker

---

## 7. Monitoring & Maintenance

### Health check endpoint

Add a public `/api/health` endpoint to verify DB connectivity:

```ts
// backend/src/modules/health/health.controller.ts
@Get('/health')
async check() {
  await this.prisma.$queryRaw`SELECT 1`;  // verifies DB connection
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### Logging

Replace NestJS default logger with pino for structured JSON output:

```bash
pnpm add nestjs-pino pino-http
```

### Backup strategy (PostgreSQL)

```bash
# Daily
pg_dump -U gladmin gladmin | gzip > /backups/gladmin-$(date +%F).sql.gz

# Keep last 30 days
find /backups -name 'gladmin-*.sql.gz' -mtime +30 -delete
```

---

## 8. Deployment Workflow

```mermaid
flowchart LR
    A[Push to main] --> B[CI: lint + typecheck + test]
    B --> C[CI: build both packages]
    C --> D[Push Docker images to registry]
    D --> E[SSH into server: docker compose pull && docker compose up -d]
    E --> F[Health check: curl /api/health]
```

### CI pipeline tips

- `pnpm lint` + `pnpm typecheck` must pass
- Prisma `migrate deploy` (not `migrate dev`) on deploy
- Use `--frozen-lockfile` in CI
- Use GitHub Actions or GitLab CI with Docker layer caching
