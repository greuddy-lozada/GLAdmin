# Cuadra

Control total. Cero estrés. Todo Cuadra.
Sistema de Gestión Administrativa — Administrative Management System.

## Architecture

Monorepo with pnpm workspaces:

```
Cuadra/
  backend/       # NestJS 11 + Prisma 6 + SQLite
  frontend/      # Next.js 16 (App Router) + shadcn/ui + Tailwind v4
  specs/         # Migration plan and specs
```

## Prerequisites

- Node.js >= 18
- pnpm >= 9

## Quick Start

```bash
pnpm install
pnpm --filter backend exec prisma db push
pnpm --filter backend exec tsx prisma/seed.ts
pnpm dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:3000

## Default Credentials

| User | Password | Role |
|------|----------|------|
| glozada | 000000 | Master |

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
- **Framework**: NestJS 11
- **ORM**: Prisma 6 (SQLite dev, MySQL in production via env)
- **Auth**: JWT + bcrypt
- **i18n**: Custom I18nService with JSON locale files (es/en)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind v4 (CSS-first config)
- **State**: React hooks + Context, TanStack Query, TanStack Table
- **i18n**: Client-side custom i18n with JSON locale files (es/en)
- **Theme**: next-themes (light/dark)
