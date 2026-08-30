# Cuadra

Control total. Cero estrés. Todo Cuadra.
Sistema de Gestión Administrativa — Administrative Management System.

## Architecture

Monorepo with pnpm workspaces:

```
Cuadra/
  backend/       # NestJS + Prisma + PostgreSQL
  frontend/      # Next.js App Router (static export) + shadcn/ui + Tailwind v4
  .spec/         # Source of truth (specs)
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 16 (local or Docker)
- Redis 7 (optional in dev)

## Quick Start

```bash
pnpm install
# Start Postgres (see .spec/DevOps/deployment.md)
pnpm --filter backend exec prisma migrate deploy
pnpm --filter backend exec tsx prisma/seed.ts
pnpm dev
```

- Backend: http://localhost:4000/api
- Frontend: http://localhost:3000

## Staging deploy (VPS)

Automated on push to `dev` after CI. Docs: [`.spec/DevOps/deployment.md`](.spec/DevOps/deployment.md).

```bash
# On the VPS (one-time)
cp .env.production.example .env.production   # edit secrets + FRONTEND_URL
bash scripts/deploy.sh
# App: https://YOUR_IP:8443
```

## Default Credentials (seed)

| User | Password | Role |
|------|----------|------|
| admin@cuadra.app / glozada | 000000 | Admin / Master |

**Change after first login on any shared environment.**

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both backend and frontend in dev mode |
| `pnpm build` | Build both packages for production |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm test` | Run all tests |

## Stack

### Backend
- **Framework**: NestJS
- **ORM**: Prisma (PostgreSQL)
- **Auth**: JWT access (15m) + refresh tokens
- **Cache**: Redis (optional; in-memory fallback)

### Frontend
- **Framework**: Next.js App Router (`output: 'export'`)
- **UI**: shadcn/ui + Tailwind v4
- **State**: TanStack Query / Table, offline Dexie for POS
- **i18n**: Client-side es/en
