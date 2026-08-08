# Testing — Estándares de Testing

> **Principio rector:** Sin tests automatizados, el código no existe.  
> Cada feature mergeada a `main` debe venir con sus tests.

---

## 1. Umbrales de Cobertura

| Métrica | Umbral | Se mide con |
|---|---|---|
| Líneas (statements) | ≥ 80% | `vitest --coverage` (frontend), `jest --coverage` (backend) |
| Ramas (branches) | ≥ 70% | Igual |
| Funciones | ≥ 80% | Igual |
| Flujos críticos E2E | 100% | Playwright — todos los smoke tests deben pasar |

### Flujos críticos (E2E obligatorio)

1. Login → Dashboard → Logout
2. CRUD Producto (crear, editar, eliminar)
3. Venta / inmutabilidad (`sales` — update bloqueado si no mutable)
4. POS: buscar producto → agregar → cobrar (vía sync)
5. Registro de usuario (Admin crea empleado → login con permisos correctos)

---

## 2. Estructura de Tests

### Backend (Jest + NestJS testing tools)

```
backend/src/modules/{module}/
├── {module}.service.ts
├── {module}.controller.ts
├── __tests__/
│   ├── {module}.service.spec.ts
│   ├── {module}.controller.spec.ts
│   └── fixtures/
│       └── {module}.fixture.ts
```

### Frontend (Vitest + React Testing Library)

```
frontend/src/features/{module}/
├── components/
│   └── {module}-page.tsx
├── hooks/
│   └── use-{module}.ts
├── __tests__/
│   ├── {module}-page.test.tsx          // Component tests
│   ├── use-{module}.test.ts           // Hook tests
│   └── mocks/
│       └── {module}.handlers.ts       // MSW handlers para mocking de API
```

### E2E (Playwright)

> **Ubicación:** `e2e/` (raíz del monorepo, package independiente).
> **Codebase:** 55 archivos, ~1350 líneas. Arquitectura documentada abajo.

#### Estructura

```
e2e/
├── playwright.config.ts          # Config: chromium, auth state, baseURL
├── package.json                  # Scripts: test, test:ui, test:headed, test:debug
├── tsconfig.json
│
├── shared/                       # Capa transversal reutilizable
│   ├── fixtures/
│   │   └── auth.fixture.ts       # Inyección + persistencia de sesión (storageState)
│   │
│   ├── builders/                 # Patrón Builder para datos de prueba
│   │   ├── base.builder.ts       # abstract Builder<T>
│   │   ├── product.builder.ts    # ProductBuilder con fluent API
│   │   ├── customer.builder.ts
│   │   └── sale.builder.ts
│   │
│   ├── tasks/                    # Workflows con lógica de negocio
│   │   ├── base.task.ts          # abstract AbstractTask
│   │   └── crud.task.ts          # abstract CrudTask<T> (Template Method)
│   │
│   ├── validators/               # Validaciones reutilizables (Composite)
│   │   ├── base.validator.ts     # abstract AbstractValidator
│   │   ├── toast.validator.ts    # Concrete: valida toasts Sileo
│   │   ├── table.validator.ts    # Concrete: valida DataTable
│   │   └── form.validator.ts     # Concrete: valida formularios
│   │
│   ├── components/               # Component Objects reutilizables
│   │   ├── data-table.component.ts
│   │   ├── slide-form.component.ts
│   │   ├── confirm-dialog.component.ts
│   │   ├── sidebar.component.ts
│   │   └── toast.component.ts
│   │
│   ├── pages/                    # Page Objects compartidos
│   │   ├── base.page.ts          # abstract BasePage
│   │   ├── login.page.ts
│   │   └── dashboard.page.ts
│   │
│   └── utils/
│       ├── api-client.ts         # HTTP client para setup/teardown
│       └── test-data.ts          # Credenciales de prueba
│
├── modules/                      # Screaming Architecture por módulo
│   ├── auth/
│   │   ├── auth.spec.ts          # Spec: orquestación de tests
│   │   └── login.task.ts         # Task: workflow de login
│   │
│   ├── products/                 # Cada módulo contiene:
│   │   ├── products.spec.ts      #   - Spec (orquestación)
│   │   ├── products.page.ts      #   - Page Object
│   │   ├── product-crud.task.ts  #   - Task (workflow + lógica)
│   │   └── product.validator.ts  #   - Validator compuesto
│   │
│   ├── customers/                # customer-crud.task extiende CrudTask<T>
│   ├── billing/                  # subscribe.task con flujo de suscripción
│   ├── pos/                      # checkout.task con flujo de venta
│   ├── inventory/                # stock-management.task
│   └── admin/                    # payment-review.task
```

#### Patrones implementados

| Patrón | Abstracción | Concretos |
|---|---|---|
| **Builder** | `Builder<T>` | `ProductBuilder`, `CustomerBuilder`, `SaleBuilder` |
| **Template Method** | `AbstractTask.execute()` | `CrudTask<T>` → `ProductCrudTask`, `CustomerCrudTask` |
| **Composite** | `AbstractValidator` | `ProductValidator` compone `ToastValidator` + `TableValidator` + `FormValidator` |
| **Page Object** | `BasePage` | `ProductsPage`, `PosPage`, `BillingPage` |
| **Component Object** | Classes standalone | `DataTable`, `SlideForm`, `ConfirmDialog`, `Sidebar` |
| **Strategy** | `CrudTask<T>` | Cada módulo implementa create/read/update/delete con su propia lógica |

#### Fixture de sesión

El fixture `authenticatedPage` inyecta sesión via `LoginPage.login()` + `storageState`. La sesión se persiste en `e2e/.auth/user.json` y se reutiliza entre tests para evitar logins repetidos.

```typescript
// shared/fixtures/auth.fixture.ts
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('glozada', '000000');
    await loginPage.waitForDashboard();
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
    await use(page);
  },
});
```

#### Flujos críticos cubiertos

| # | Flujo (spec) | Spec file | Estado |
|---|---|---|---|
| 1 | Login → Dashboard → Logout | `modules/auth/auth.spec.ts` | Implementado |
| 2 | CRUD Producto | `modules/products/products.spec.ts` | Implementado |
| 3 | Sales immutability / API | unit `sales.service.spec` + E2E pendiente anulación | Parcial |
| 4 | POS: buscar → agregar → cobrar | `modules/pos/pos.spec.ts` | Implementado |
| 5 | Registro con roles | `modules/auth/registration.spec.ts` | Pendiente |

#### Comandos

```bash
pnpm --filter e2e test              # Todos los tests
pnpm --filter e2e test:ui           # Playwright UI mode
pnpm --filter e2e test:headed       # Ver navegador
pnpm --filter e2e test -- products  # Solo un módulo
```

---

## 3. Convenciones de Tests

### Naming

```typescript
describe('SalesService', () => {
  describe('create()', () => {
    test('debe crear una venta en estado DRAFT con los items proporcionados', async () => { ... });
    test('debe decrementar stock al crear', async () => { ... });
  });
  describe('update()', () => {
    test('debe lanzar SALE_001 si la venta no es mutable', async () => { ... });
  });

  describe('remove()', () => {
    test('debe soft-delete y restaurar stock', async () => { ... });
  });
});
```

### Reglas de naming

1. `describe` = método o feature bajo prueba.
2. `test` = frase en español que describe el comportamiento esperado.
3. Prefijos: `debe` (happy path), `debe lanzar {ERROR_CODE}` (error esperado), `debe retornar` (valor esperado).

### AAA Pattern (Arrange, Act, Assert)

```typescript
test('debe rechazar update de venta ISSUED', async () => {
  // Arrange
  const sale = await createTestSale({ status: 'ISSUED' });

  // Act + Assert
  await expect(service.update(sale.id, { code: 'X' })).rejects.toMatchObject({
    /* SALE_001 */
  });
});
```

---

## 4. Mocks y Fixtures

### Backend: Factory Functions (NO mocks de BD en unit tests)

```typescript
// backend/src/modules/sales/__tests__/fixtures/sale.fixture.ts
import { PrismaClient } from '@prisma/client';

export async function createTestSale(
  prisma: PrismaClient,
  overrides?: Record<string, unknown>,
) {
  const org = await prisma.organization.findFirst();
  const product = await prisma.product.findFirst();

  return prisma.sale.create({
    data: {
      organizationId: org!.id,
      status: 'DRAFT',
      amount: 100,
      details: {
        create: {
          idProduct: product!.id,
          quantity: 1,
          // ...campos requeridos del detalle
        },
      },
      ...overrides,
    },
    include: { details: true },
  });
}
```

### Backend: Unit tests del Service usan BD en memoria o testcontainers

**Opción recomendada:** Base de datos real con testcontainers (PostgreSQL en Docker).

```typescript
// jest.setup.ts — Configuración global
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient;
let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();
  execSync('npx prisma migrate deploy');
  prisma = new PrismaClient();
}, 60000);

afterAll(async () => {
  await prisma.$disconnect();
  await container.stop();
});
```

### Frontend: MSW (Mock Service Worker) para API calls

```typescript
// frontend/src/features/products/__tests__/mocks/products.handlers.ts
import { http, HttpResponse } from 'msw';

export const productHandlers = [
  http.get('/api/products', () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Laptop Pro', price: 1200, stock: 10 },
        { id: '2', name: 'Mouse', price: 25, stock: 50 },
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  }),

  http.post('/api/products', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { data: { id: '3', ...body } },
      { status: 201 },
    );
  }),
];
```

---

## 5. Tests de Inmutabilidad (Sales)

Toda feature que toca `sales` / montos cobrados debe verificar:

```typescript
describe('Sale Immutability', () => {
  test('NO debe permitir modificar una venta con status ISSUED', async () => {
    const sale = await createTestSale({ status: 'ISSUED' });
    await expect(
      service.update(sale.id, { code: 'X' })
    ).rejects.toMatchObject({ /* SALE_001 */ });
  });

  test('soft-delete restaura stock y setea deletedAt', async () => {
    // ...
  });
});
```

No escribir suites `Invoice*` / `INVOICE_*`. Dominio = `sales`. Ver [features/sales.md](../features/sales.md).

---

## 6. CI Integration

```yaml
# .github/workflows/test.yml
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: cuadra_test
          POSTGRES_PASSWORD: cuadra_test
          POSTGRES_DB: cuadra_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm --filter backend test --coverage
      - run: pnpm --filter backend test:e2e

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm --filter frontend test --coverage
      - run: pnpm --filter frontend test:e2e
```

---

## 7. Qué NO se testea

- **Librerías externas** (Prisma, NestJS, shadcn/ui) — ya tienen sus propios tests.
- **Getters y setters triviales** sin lógica.
- **Renderizado puro de componentes sin lógica condicional.**
- **Configuración** (archivos de entorno, constants, enums sin comportamiento).

---

*Referencia cruzada: [architecture.md](architecture.md) — [security.md](security.md) — [release-policy.md](../DevOps/release-policy.md)*
