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
3. Factura completa (borrador → emitir → ver PDF → anular)
4. POS: buscar producto → agregar → cobrar
5. Registro de usuario (Admin crea Cajero → Cajero hace login → solo ve POS)

---

## 2. Estructura de Tests

### Backend (Jest + NestJS testing tools)

```
backend/src/features/{module}/
├── {module}.service.ts
├── {module}.controller.ts
├── __tests__/
│   ├── {module}.service.spec.ts       // Unit tests del service
│   ├── {module}.controller.spec.ts    // Unit tests del controller
│   └── fixtures/
│       └── {module}.fixture.ts        // Factory functions para datos de prueba
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

```
frontend/e2e/
├── auth/
│   └── login.spec.ts
├── products/
│   └── crud-product.spec.ts
├── invoices/
│   └── invoice-lifecycle.spec.ts
├── pos/
│   └── pos-checkout.spec.ts
└── fixtures/
    └── test-data.ts
```

---

## 3. Convenciones de Tests

### Naming

```typescript
describe('InvoicesService', () => {
  describe('create()', () => {
    test('debe crear una factura en estado DRAFT con los items proporcionados', async () => { ... });
    test('debe lanzar INVOICE_004 si la factura no tiene items', async () => { ... });
    test('debe asignar el siguiente secuencial fiscal disponible', async () => { ... });
  });

  describe('annul()', () => {
    test('debe cambiar status a ANNULLED y registrar motivo de anulación', async () => { ... });
    test('debe lanzar INVOICE_001 si la factura ya está anulada', async () => { ... });
    test('debe lanzar FORBIDDEN si el usuario no tiene rol Admin o Contador', async () => { ... });
  });
});
```

### Reglas de naming

1. `describe` = método o feature bajo prueba.
2. `test` = frase en español que describe el comportamiento esperado.
3. Prefijos: `debe` (happy path), `debe lanzar {ERROR_CODE}` (error esperado), `debe retornar` (valor esperado).

### AAA Pattern (Arrange, Act, Assert)

```typescript
test('debe anular una factura emitida', async () => {
  // Arrange
  const invoice = await createTestInvoice({ status: 'ISSUED' });
  const dto = { reason: 'Error en monto' };

  // Act
  const result = await service.annul(invoice.id, dto, adminUser);

  // Assert
  expect(result.status).toBe('ANNULLED');
  expect(result.annulmentReason).toBe('Error en monto');
  expect(result.total).toBe(invoice.total);  // Montos inmutables
});
```

---

## 4. Mocks y Fixtures

### Backend: Factory Functions (NO mocks de BD en unit tests)

```typescript
// backend/src/features/invoices/__tests__/fixtures/invoice.fixture.ts
import { PrismaClient } from '@prisma/client';
import { CreateInvoiceDto } from '../../dto/create-invoice.dto';

export async function createTestInvoice(
  prisma: PrismaClient,
  overrides?: Partial<CreateInvoiceDto>,
) {
  const company = await prisma.company.findFirst();
  const customer = await prisma.customer.findFirst();
  const product = await prisma.product.findFirst();

  return prisma.invoice.create({
    data: {
      companyId: company!.id,
      customerId: customer!.id,
      invoiceNumber: '00000001',
      controlNumber: '00-00000001',
      subtotal: 100,
      taxAmount: 16,
      total: 116,
      status: 'DRAFT',
      items: {
        create: {
          productId: product!.id,
          quantity: 1,
          unitPrice: 100,
          taxRate: 16,
        },
      },
      ...overrides,
    },
    include: { items: true },
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

## 5. Tests de Inmutabilidad Contable

### Checklist específico para features financieras

Toda feature que toca `invoices`, `credit_notes`, `debit_notes`, `tax_withholdings`, `accounting_entries` debe incluir tests que verifiquen:

```typescript
describe('Invoice Immutability', () => {
  test('NO debe permitir modificar una factura con status ISSUED', async () => {
    const invoice = await createTestInvoice({ status: 'ISSUED' });
    await expect(
      service.update(invoice.id, { subtotal: 999 })
    ).rejects.toThrow('INVOICE_001');
  });

  test('NO debe permitir modificar una factura con status ANNULLED', async () => {
    const invoice = await createTestInvoice({ status: 'ANNULLED' });
    await expect(
      service.update(invoice.id, { subtotal: 999 })
    ).rejects.toThrow('INVOICE_001');
  });

  test('NO debe permitir DELETE físico de una factura (solo soft-delete)', async () => {
    const invoice = await createTestInvoice({ status: 'DRAFT' });
    await service.remove(invoice.id);
    const found = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(found).not.toBeNull();
    expect(found.deletedAt).not.toBeNull();
  });

  test('Al anular, los montos originales NO cambian', async () => {
    const invoice = await createTestInvoice({
      status: 'ISSUED',
      subtotal: 500,
    });
    const annulled = await service.annul(invoice.id, {
      reason: 'Error en precio',
    });
    expect(annulled.subtotal).toBe(500);  // El monto original sigue igual
    expect(annulled.status).toBe('ANNULLED');
  });
});
```

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
