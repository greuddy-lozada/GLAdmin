# Observability & Monitoring

## Stack

| Concern | Tool | Scope |
|---|---|---|
| Error tracking | Sentry | Backend exceptions, frontend errors |
| Structured logging | pino + nestjs-pino | Backend JSON logs |
| Health checks | Custom `/api/health` | DB connectivity, uptime |
| Uptime monitoring | Uptime Kuma or Better Uptime | External ping |
| Performance | Next.js Web Vitals + Sentry | LCP, FID, CLS |

---

## 1. Error Tracking — Sentry

### Backend

```bash
cd backend
pnpm add @sentry/node @sentry/nestjs
```

```ts
// backend/src/main.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  integrations: [],
});

// Sentry exception filter
// backend/src/common/filters/sentry.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    super.catch(exception, host);
  }
}
```

Register in `main.ts`:

```ts
import { SentryFilter } from './common/filters/sentry.filter';
app.useGlobalFilters(new SentryFilter());
```

### Frontend

```bash
cd frontend
pnpm add @sentry/nextjs
```

```ts
// frontend/src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  integrations: [
    Sentry.replayIntegration(),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### What to capture

| Event | Layer | Severity |
|---|---|---|
| Uncaught exceptions | Both | error |
| Axios request failures | Frontend | error |
| AuthGuard rejections | Backend | warning |
| Validation errors | Backend | warning |
| Deactivated user login | Backend | info |
| Token refresh failure | Frontend | warning |

---

## 2. Structured Logging — pino

### Backend setup

```bash
cd backend
pnpm add nestjs-pino pino-http
```

```ts
// backend/src/main.ts
import { Logger } from 'nestjs-pino';
import { LoggerErrorInterceptor } from 'nestjs-pino';

const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger));
app.useGlobalInterceptors(new LoggerErrorInterceptor());
```

```ts
// backend/src/app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
        level: process.env.LOG_LEVEL || 'info',
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
  ],
})
```

### Log output (production) — JSON lines

```json
{"level":30,"time":1716825600000,"pid":1,"hostname":"abc","req":{"method":"POST","url":"/api/auth/login"},"msg":"request completed"}
{"level":50,"time":1716825600001,"pid":1,"err":{"message":"AUTH.USER_INACTIVE","stack":"..."},"msg":"Authentication failed"}
```

### What to log

| Event | Level | Fields |
|---|---|---|
| Request start | debug | method, url, requestId |
| Request complete | info | method, url, statusCode, responseTime |
| Auth failure | warn | reason (no token, expired, inactive), ip |
| Business operation | info | entity, action, userId |
| DB query error | error | query, params, error message |
| Unhandled exception | error | stack, request context |

**Never log:** passwords, tokens, secrets, full request bodies.

---

## 3. Health Checks

### Endpoint

```
GET /api/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-05-25T16:00:00.000Z",
  "uptime": 123456,
  "database": { "connected": true, "latencyMs": 2 }
}
```

### Implementation

```ts
// backend/src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Controller('api/health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: { connected: true, latencyMs: Date.now() - start },
      };
    } catch {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: { connected: false },
      };
    }
  }
}
```

### Monitoring interval

| Checker | Interval | Action on failure |
|---|---|---|
| Uptime Kuma | 60s | Email alert |
| Docker healthcheck | 30s | Auto-restart container |
| CI deploy | After deploy | Fail deploy if health fails |

---

## 4. Frontend Performance

### Web Vitals

```ts
// frontend/src/app/layout.tsx or a separate component
'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function WebVitals() {
  useEffect(() => {
    const report = ({ name, value }: { name: string; value: number }) => {
      Sentry.metrics.distribution(name, value);
    };
    // Using web-vitals library
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onLCP, onFID, onCLS }) => {
        onLCP(report);
        onFID(report);
        onCLS(report);
      });
    }
  }, []);
  return null;
}
```

### Performance budgets (future)

| Metric | Target | Mobile target |
|---|---|---|
| LCP | ≤ 2.5s | ≤ 4.0s |
| FID | ≤ 100ms | ≤ 300ms |
| CLS | ≤ 0.1 | ≤ 0.25 |
| TTI | ≤ 3.5s | ≤ 5.0s |
| First load JS | ≤ 250KB | ≤ 300KB |

---

## 5. Infrastructure monitoring

### Docker healthcheck

In `docker-compose.yml`:

```yaml
backend:
  healthcheck:
    test: ["CMD", "node", "-e", "fetch('http://localhost:4000/api/health').then(r => process.exit(r.ok?0:1))"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
```

### Log aggregation (future)

For VPS deployment, forward logs to a central service:

```bash
# Option A: Loki + Grafana (self-hosted)
docker plugin install grafana/loki-docker-driver

# Option B: Axiom / Better Stack / Logtail (SaaS)
docker run --log-driver=axiom ...
```

---

## 6. Alert thresholds

| Condition | Channel | Severity |
|---|---|---|
| Health check fails > 3x | Email + Slack | Critical |
| Error rate > 1% (5 min window) | Email | Critical |
| P50 response time > 1s | Email | Warning |
| Disk usage > 85% | Email | Warning |
| SSL cert expires < 14 days | Email | Warning |
