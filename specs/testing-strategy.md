# Testing Strategy

## Stack

| Layer | Tool | Scope |
|---|---|---|
| Backend unit | Jest (NestJS default) | Services, guards, decorators, pipes |
| Backend e2e | Supertest + Jest | Full HTTP endpoints with test DB |
| Frontend unit | Vitest | Hooks, utils, services, components |
| Frontend integration | React Testing Library | Page-level rendering, form flows |
| E2E (critical paths) | Playwright | Login, CRUD happy path across stack |

---

## Backend

### Setup

```bash
cd backend
pnpm add -D jest @types/jest ts-jest supertest @nestjs/testing
```

### jest.config.ts (already exists — verify)

```ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
```

### Unit test pattern

```ts
// src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
        { provide: JwtService, useValue: mockDeep<JwtService>() },
        { provide: ConfigService, useValue: mockDeep<ConfigService>() },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = module.get(PrismaService);
  });

  it('login: rejects inactive user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ isActive: false });
    await expect(service.login({ email: 'x@x.com', password: 'p' }))
      .rejects.toThrow('AUTH.USER_INACTIVE');
  });
});
```

### e2e test pattern

```ts
// test/app.e2e-spec.ts
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  it('POST /auth/login — valid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@gladmin.com', password: '000000' })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data).toHaveProperty('user');
      });
  });

  it('POST /auth/login — deactivated user returns 401', () => {
    // seed: deactivate user
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'deactivated@test.com', password: '000000' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('AUTH.USER_INACTIVE');
      });
  });
});
```

### What to test

| Module | Priority | Unit | e2e |
|---|---|---|---|
| AuthService | Critical | login validation, isActive check, token generation, refresh rotation | Full login/refresh/me/logout flow |
| AuthGuard | Critical | isActive DB hit, missing token, malformed token | — |
| RolesGuard | High | MinLevel vs Roles priority | — |
| UsersController | High | CRUD, validation, role restrictions | Full CRUD cycle |
| All CRUD services | Medium | create/update/delete edge cases | — |
| TransformInterceptor | Medium | response envelope `{ data, message, errors }` | — |
| Seed script | High | — | Seed + verify users exist |

---

## Frontend

### Setup

```bash
cd frontend
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

### vitest.config.ts (at frontend root)

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### Component test pattern

```tsx
// src/features/auth/components/__tests__/login-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '../login-form';

// Mocks for useI18n, next/navigation, authService
vi.mock('@/i18n', () => ({ useI18n: () => ({ t: (k: string) => k, tp: (k: string) => k }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../../services/auth.service', () => ({
  authService: { login: vi.fn() },
}));

describe('LoginForm', () => {
  it('shows error on invalid email', async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('auth.field.email'), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));
    expect(await screen.findByText('validation.invalidEmail')).toBeDefined();
  });

  it('calls authService.login on valid submit', async () => {
    const { authService } = await import('../../services/auth.service');
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('auth.field.email'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText('auth.field.password'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));
    expect(authService.login).toHaveBeenCalledWith({ email: 'admin@test.com', password: '000000' });
  });
});
```

### Hook test pattern

```tsx
// src/features/auth/hooks/__tests__/use-auth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../use-auth';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service');

describe('useAuth', () => {
  beforeEach(() => localStorage.clear());

  it('login stores tokens', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      accessToken: 'at', refreshToken: 'rt', user: {} as any,
    });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.login('a@b.com', 'pass'));
    expect(localStorage.getItem('accessToken')).toBe('at');
  });
});
```

### What to test

| Component | Priority | What |
|---|---|---|
| LoginForm | Critical | validation, submit, error display |
| DataTable | High | sort, pagination, empty state, skeleton loading |
| SlideForm | High | create/edit toggle, required fields, submit, error alert |
| ConfirmDialog | Medium | delete confirmation flow |
| Settings page | Medium | form render, read-only field display |
| Sidebar | Medium | expand/collapse, active state, group collapse |

---

## E2E (Playwright)

### Setup

```bash
cd frontend
pnpm add -D @playwright/test
npx playwright install chromium
```

### Config

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  webServer: [
    { command: 'cd ../backend && node dist/src/main.js', port: 4000 },
    { command: 'pnpm dev', port: 3000 },
  ],
  use: { baseURL: 'http://localhost:3000' },
});
```

### Critical paths

```
e2e/
  auth-login.spec.ts      — login, logout, redirect to login when expired
  auth-deactivated.spec.ts — login as deactivated user, expect error page
  products-crud.spec.ts    — create → list → edit → delete
  sidebar-nav.spec.ts      — navigate to each module via sidebar
  i18n-switch.spec.ts      — switch language, verify key pages render
```

---

## Coverage targets

| Layer | Floor |
|---|---|
| Backend services | 80% |
| Backend guards | 90% |
| Frontend components | 60% (limited by i18n mocks) |
| Frontend hooks | 80% |
| E2E critical paths | 100% (5 specs) |

---

## CI integration

```yml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: corepack enable && pnpm install --frozen-lockfile
      - run: pnpm -r lint
      - run: pnpm -r typecheck
      - run: cd backend && npx prisma generate && pnpm test:cov
      - run: cd frontend && pnpm test:cov
      - if: github.ref == 'refs/heads/main'
        run: cd frontend && npx playwright test
```
