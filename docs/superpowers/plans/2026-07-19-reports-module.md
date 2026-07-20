# Reports Module — Implementation Plan (Phase 1: Sales Reports)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reports module core engine + 3 sales reports (sales_summary, sales_by_customer, sales_by_product) with stored generation, in-app interactive viewing, and PDF export via window.print().

**Architecture:** Single `reports` feature module following Vertical Slicing. A Report Registry defines report types as plain objects (no classes). The backend stores report definitions in `generated_reports` table with JSONB results. The frontend renders results via type-specific React components.

**Tech Stack:** NestJS + Prisma (raw SQL for queries) + class-validator | Next.js + React 19 + shadcn/ui + motion | Zod for frontend models

**Spec:** [reports-module-design.md](../../.spec/plans/reports-module-design.md)

---

## File Structure

### Backend — All new files under `backend/src/modules/reports/`

| File | Responsibility |
|---|---|
| `reports.module.ts` | NestJS module — registers controller, service, PrismaService |
| `reports.controller.ts` | REST endpoints — generate, findAll, findOne, getTypes, remove |
| `reports.service.ts` | Business logic — generate, query DB, store results |
| `report-registry.ts` | Report definitions array — 3 sales reports |
| `dto/generate-report.dto.ts` | Validation DTO for report generation |
| `dto/report-query.dto.ts` | Validation DTO for query params |
| `__tests__/reports.service.spec.ts` | Unit tests — 6 scenarios |
| `__tests__/fixtures/reports.fixture.ts` | Factory functions for test data |

### Backend — Modified files

| File | Change |
|---|---|
| `backend/prisma/schema.prisma` | Add `GeneratedReport` model |
| `backend/src/app.module.ts` | Import `ReportsModule` |
| `backend/src/shared/prisma/prisma.service.ts` | Add `GeneratedReport` to tenant isolation + soft delete arrays |

### Frontend — All new files under `frontend/src/features/reports/`

| File | Responsibility |
|---|---|
| `models/report.model.ts` | TypeScript interfaces + Zod schemas |
| `services/reports.service.ts` | API calls |
| `hooks/use-reports.ts` | Data fetching hook |
| `components/reports-page.tsx` | Main page — list of generated reports |
| `components/report-generator.tsx` | Form — select type + parameters → generate |
| `components/report-viewer.tsx` | Interactive view of a stored report + type renderers |
| `components/report-card.tsx` | Card in the list |
| `components/charts/bar-chart.tsx` | Shared bar chart component |

### Frontend — Modified files

| File | Change |
|---|---|
| `frontend/src/config/navigation.config.ts` | Add "Reportes" nav group |
| `frontend/src/i18n/locales/es.json` | Add report i18n keys |
| `frontend/src/i18n/locales/en.json` | Add report i18n keys |

### Route

| File | Responsibility |
|---|---|
| `frontend/src/app/(dashboard)/reports/page.tsx` | Route wrapper — renders `ReportsPage` |

---

### Task 1: Add GeneratedReport model to Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma` — add model near end (before the last closing brace)

- [ ] **Step 1: Add GeneratedReport model to schema**

Insert the model just before the closing `}` of the schema file (or after the last existing model `AuditLog`):

```prisma
// ────────────────────────────────────────────
// GENERATED REPORT
// ────────────────────────────────────────────
model GeneratedReport {
  id             String    @id @default(uuid()) @db.Uuid @map("id")
  organizationId String    @db.Uuid @map("organization_id")
  userId         String    @db.Uuid @map("user_id")
  type           String    @map("type")
  category       String    @map("category")
  name           String    @map("name")
  parameters     Json      @map("parameters") @db.JsonB
  results        Json?     @map("results") @db.JsonB
  htmlSnapshot   String?   @map("html_snapshot") @db.Text
  format         String    @default("json") @map("format")
  status         String    @default("generating") @map("status")
  errorMessage   String?   @map("error_message")
  generatedAt    DateTime? @map("generated_at") @db.Timestamptz()
  createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])

  @@map("generated_reports")
  @@index([organizationId, category])
  @@index([organizationId, type])
  @@index([organizationId, createdAt])
  @@index([userId])
}
```

- [ ] **Step 2: Add GeneratedReport to PrismaService tenant isolation + soft delete**

Open `backend/src/shared/prisma/prisma.service.ts`.

Add `'GeneratedReport'` to the `businessModels` array (line ~62, before `'Invite'`):

```
'AccountsReceivable',
'GeneratedReport',       // <-- add this line
'PagoMovilConfig',
```

Add `'GeneratedReport'` to the `softDeleteModels` array (line ~110, after `'PagoMovilTransaction'`):

```
'PagoMovilConfig',
'PagoMovilTransaction',
'GeneratedReport',       // <-- add this line
];
```

- [ ] **Step 3: Generate and apply migration**

```bash
cd backend && npx prisma migrate dev --name add_generated_reports
```

Expected: Migration SQL file created in `prisma/migrations/`. Tables created in DB.

- [ ] **Step 4: Verify model exists**

```bash
npx prisma studio
```

Expected: `generated_reports` table visible with all columns.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations backend/src/shared/prisma/prisma.service.ts
git commit -m "feat(reports): add GeneratedReport model with tenant isolation and soft delete"
```

---

### Task 2: Create backend DTOs

**Files:**
- Create: `backend/src/modules/reports/dto/generate-report.dto.ts`
- Create: `backend/src/modules/reports/dto/report-query.dto.ts`

- [ ] **Step 1: Create GenerateReportDto**

```typescript
// backend/src/modules/reports/dto/generate-report.dto.ts
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  parameters: Record<string, any>;
}
```

- [ ] **Step 2: Create ReportQueryDto**

```typescript
// backend/src/modules/reports/dto/report-query.dto.ts
import { IsOptional, IsString, IsIn, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['sales', 'inventory', 'fiscal', 'financial'])
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fromDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  toDate?: Date;
}
```

- [ ] **Step 3: Verify PaginationQueryDto exists**

Check that `backend/src/common/dto/pagination-query.dto.ts` exists. If not, adapt from the one defined in the dashboard module or any other module. Look at how `dashboard.service.ts` handles pagination — it uses `page` and `limit` params directly in method signature. The `ReportQueryDto` extends `PaginationQueryDto`, so verify:

```bash
ls backend/src/common/dto/pagination-query.dto.ts
```

If it doesn't exist, adapt the import to use the pattern from existing query DTOs in the project.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/reports/dto/
git commit -m "feat(reports): add DTOs for report generation and querying"
```

---

### Task 3: Create report registry with 3 sales reports

**Files:**
- Create: `backend/src/modules/reports/report-registry.ts`

- [ ] **Step 1: Create the registry with type definitions and 3 SQL queries**

```typescript
// backend/src/modules/reports/report-registry.ts
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface ParamField {
  key: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ReportDefinition {
  type: string;
  category: 'sales' | 'inventory' | 'fiscal' | 'financial';
  name: string;
  description: string;
  parameters: ParamField[];
  query: (orgId: string, params: Record<string, any>, prisma: PrismaService) => Promise<any>;
}

function salesSummaryQuery(orgId: string, params: Record<string, any>, prisma: PrismaService) {
  const { dateFrom, dateTo } = params;
  const dateFilter = dateFrom && dateTo
    ? Prisma.sql`AND s.date >= ${dateFrom}::timestamptz AND s.date <= ${dateTo}::timestamptz`
    : Prisma.sql``;

  return prisma.$queryRaw`
    SELECT
      to_char(s.date, 'YYYY-MM') AS month,
      COUNT(*)::int AS total_sales,
      COALESCE(SUM(s.amount), 0) AS total_revenue,
      COALESCE(SUM(s.total_tax), 0) AS total_tax
    FROM sales s
    WHERE s.organization_id = ${orgId}::uuid
      AND s.deleted_at IS NULL
      ${dateFilter}
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;
}

function salesByCustomerQuery(orgId: string, params: Record<string, any>, prisma: PrismaService) {
  const { dateFrom, dateTo } = params;
  const dateFilter = dateFrom && dateTo
    ? Prisma.sql`AND s.date >= ${dateFrom}::timestamptz AND s.date <= ${dateTo}::timestamptz`
    : Prisma.sql``;

  return prisma.$queryRaw`
    SELECT
      c.id,
      c.first_name || ' ' || c.last_name AS customer_name,
      COUNT(s.id)::int AS sales_count,
      COALESCE(SUM(s.amount), 0) AS total_amount
    FROM sales s
    JOIN customers c ON c.id = s.id_customer
    WHERE s.organization_id = ${orgId}::uuid
      AND s.deleted_at IS NULL
      AND c.deleted_at IS NULL
      ${dateFilter}
    GROUP BY c.id, c.first_name, c.last_name
    ORDER BY total_amount DESC
    LIMIT 20
  `;
}

function salesByProductQuery(orgId: string, params: Record<string, any>, prisma: PrismaService) {
  const { dateFrom, dateTo } = params;
  const dateFilter = dateFrom && dateTo
    ? Prisma.sql`AND s.date >= ${dateFrom}::timestamptz AND s.date <= ${dateTo}::timestamptz`
    : Prisma.sql``;

  return prisma.$queryRaw`
    SELECT
      p.id,
      p.name AS product_name,
      SUM(sd.quantity)::int AS quantity_sold,
      COALESCE(SUM(sd.subtotal), 0) AS total_revenue
    FROM sales_dets sd
    JOIN sales s ON s.id = sd.id_sale
    JOIN products p ON p.id = sd.id_product
    WHERE s.organization_id = ${orgId}::uuid
      AND s.deleted_at IS NULL
      AND p.deleted_at IS NULL
      ${dateFilter}
    GROUP BY p.id, p.name
    ORDER BY total_revenue DESC
    LIMIT 20
  `;
}

export const reportRegistry: ReportDefinition[] = [
  {
    type: 'sales_summary',
    category: 'sales',
    name: 'reports.types.salesSummary',
    description: 'reports.types.salesSummaryDesc',
    parameters: [
      { key: 'dateFrom', label: 'reports.params.dateFrom', type: 'date', required: false },
      { key: 'dateTo', label: 'reports.params.dateTo', type: 'date', required: false },
    ],
    query: salesSummaryQuery,
  },
  {
    type: 'sales_by_customer',
    category: 'sales',
    name: 'reports.types.salesByCustomer',
    description: 'reports.types.salesByCustomerDesc',
    parameters: [
      { key: 'dateFrom', label: 'reports.params.dateFrom', type: 'date', required: false },
      { key: 'dateTo', label: 'reports.params.dateTo', type: 'date', required: false },
    ],
    query: salesByCustomerQuery,
  },
  {
    type: 'sales_by_product',
    category: 'sales',
    name: 'reports.types.salesByProduct',
    description: 'reports.types.salesByProductDesc',
    parameters: [
      { key: 'dateFrom', label: 'reports.params.dateFrom', type: 'date', required: false },
      { key: 'dateTo', label: 'reports.params.dateTo', type: 'date', required: false },
    ],
    query: salesByProductQuery,
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/reports/report-registry.ts
git commit -m "feat(reports): add report registry with 3 sales report definitions"
```

---

### Task 4: Create ReportsService

**Files:**
- Create: `backend/src/modules/reports/reports.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// backend/src/modules/reports/reports.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { reportRegistry } from './report-registry';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private getOrgId(): string {
    const ctx = this.context.getCurrent();
    const orgId = ctx?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return orgId;
  }

  private getUserId(): string {
    const ctx = this.context.getCurrent();
    const userId = ctx?.userId;
    if (!userId) throw new Error('No user context');
    return userId;
  }

  async generate(dto: GenerateReportDto) {
    const definition = reportRegistry.find((r) => r.type === dto.type);
    if (!definition) {
      throw new BadRequestException({
        code: 'REPORT_001',
        message: `Unknown report type: ${dto.type}`,
      });
    }

    const orgId = this.getOrgId();
    const userId = this.getUserId();

    const report = await this.prisma.generatedReport.create({
      data: {
        organizationId: orgId,
        userId,
        type: dto.type,
        category: definition.category,
        name: `${definition.type} - ${new Date().toISOString().substring(0, 10)}`,
        parameters: dto.parameters,
        status: 'generating',
      },
    });

    try {
      const results = await definition.query(orgId, dto.parameters, this.prisma);

      const updated = await this.prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          results: results as any,
          status: 'ready',
          generatedAt: new Date(),
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      });

      return updated;
    } catch (error) {
      await this.prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw new InternalServerErrorException({
        code: 'REPORT_003',
        message: 'Report generation failed',
        details: [{ reason: error instanceof Error ? error.message : 'Unknown error' }],
      });
    }
  }

  async findAll(query: ReportQueryDto) {
    const orgId = this.getOrgId();
    const { page = 1, limit = 20, category, type, fromDate, toDate } = query;

    const where: any = { organizationId: orgId };

    if (category) where.category = category;
    if (type) where.type = type;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [total, items] = await Promise.all([
      this.prisma.generatedReport.count({ where }),
      this.prisma.generatedReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      data: items.map((r) => ({
        ...r,
        user: undefined,
        userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const orgId = this.getOrgId();
    const report = await this.prisma.generatedReport.findFirst({
      where: { id, organizationId: orgId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      ...report,
      user: undefined,
      userName: report.user ? `${report.user.firstName} ${report.user.lastName}` : null,
    };
  }

  getTypes() {
    return reportRegistry.map((r) => ({
      type: r.type,
      category: r.category,
      name: r.name,
      description: r.description,
      parameters: r.parameters,
    }));
  }

  async remove(id: string) {
    const orgId = this.getOrgId();
    const report = await this.prisma.generatedReport.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.prisma.generatedReport.delete({ where: { id } });
    return { message: 'Report deleted' };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/reports/reports.service.ts
git commit -m "feat(reports): add ReportsService with generate, findAll, findOne, remove"
```

---

### Task 5: Create ReportsController

**Files:**
- Create: `backend/src/modules/reports/reports.controller.ts`

- [ ] **Step 1: Create the controller**

```typescript
// backend/src/modules/reports/reports.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { MinLevel, ROLE_LEVEL } from '../../common/decorators/min-level.decorator';
import { PlanLevel } from '../../common/decorators/plan-level.decorator';

@Controller('reports')
@PlanLevel('free')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @MinLevel(ROLE_LEVEL.manager)
  generate(@Body() dto: GenerateReportDto) {
    return this.reportsService.generate(dto);
  }

  @Get()
  @MinLevel(ROLE_LEVEL.employee)
  findAll(@Query() query: ReportQueryDto) {
    return this.reportsService.findAll(query);
  }

  @Get('types')
  @MinLevel(ROLE_LEVEL.employee)
  getTypes() {
    return this.reportsService.getTypes();
  }

  @Get(':id')
  @MinLevel(ROLE_LEVEL.employee)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.findOne(id);
  }

  @Delete(':id')
  @MinLevel(ROLE_LEVEL.executive)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.remove(id);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/reports/reports.controller.ts
git commit -m "feat(reports): add ReportsController with REST endpoints"
```

---

### Task 6: Create ReportsModule and register in AppModule

**Files:**
- Create: `backend/src/modules/reports/reports.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create the module**

```typescript
// backend/src/modules/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
```

- [ ] **Step 2: Register ReportsModule in AppModule**

In `backend/src/app.module.ts`, add the import after the existing module imports:

```typescript
import { ReportsModule } from './modules/reports/reports.module';
```

And add `ReportsModule` to the `imports` array in `@Module()`, after `ProductsModule` line:

```typescript
ProductsModule,
ReportsModule,       // <-- add this line
PurchaseOrdersModule,
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm --filter backend typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/reports/reports.module.ts backend/src/app.module.ts
git commit -m "feat(reports): add ReportsModule and register in AppModule"
```

---

### Task 7: Backend unit tests

**Files:**
- Create: `backend/src/modules/reports/__tests__/fixtures/reports.fixture.ts`
- Create: `backend/src/modules/reports/__tests__/reports.service.spec.ts`

- [ ] **Step 1: Create fixture**

```typescript
// backend/src/modules/reports/__tests__/fixtures/reports.fixture.ts
import { PrismaService } from '../../../../shared/prisma/prisma.service';

export async function createTestReport(
  prisma: PrismaService,
  overrides?: Partial<{
    organizationId: string;
    userId: string;
    type: string;
    category: string;
    status: string;
  }>,
) {
  const orgId = overrides?.organizationId || (await getFirstOrgId(prisma));
  const userId = overrides?.userId || (await getFirstUserId(prisma));

  return prisma.generatedReport.create({
    data: {
      organizationId: orgId,
      userId,
      type: overrides?.type || 'sales_summary',
      category: overrides?.category || 'sales',
      name: 'Test Report',
      parameters: {},
      status: overrides?.status || 'ready',
      results: { rows: [], summary: {} },
    },
  });
}

async function getFirstOrgId(prisma: PrismaService) {
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error('No organization in test DB. Run seed first.');
  return org.id;
}

async function getFirstUserId(prisma: PrismaService) {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user in test DB. Run seed first.');
  return user.id;
}
```

- [ ] **Step 2: Create service tests**

```typescript
// backend/src/modules/reports/__tests__/reports.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ReportsService } from '../reports.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ContextService } from '../../tenant/context.service';
import { createTestReport } from './fixtures/reports.fixture';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;
  let contextService: ContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, PrismaService, ContextService],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    contextService = module.get<ContextService>(ContextService);
  });

  describe('generate()', () => {
    test('debe crear un reporte y retornarlo con status ready', async () => {
      const result = await service.generate({
        type: 'sales_summary',
        parameters: { dateFrom: '2026-01-01', dateTo: '2026-12-31' },
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('ready');
      expect(result.type).toBe('sales_summary');
      expect(result.results).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    test('debe lanzar REPORT_001 para tipo de reporte desconocido', async () => {
      await expect(
        service.generate({ type: 'nonexistent', parameters: {} }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll()', () => {
    test('debe retornar lista de reportes con paginación', async () => {
      const result = await service.findAll({});

      expect(result).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findOne()', () => {
    test('debe retornar un reporte por ID', async () => {
      const report = await createTestReport(prisma);
      const result = await service.findOne(report.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(report.id);
    });

    test('debe lanzar NotFoundException si el reporte no existe', async () => {
      await expect(
        service.findOne('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    test('debe eliminar un reporte (soft delete)', async () => {
      const report = await createTestReport(prisma);
      await service.remove(report.id);

      await expect(service.findOne(report.id)).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 3: Run backend tests**

```bash
pnpm --filter backend test
```

Expected: All tests pass, including the 5 new spec tests.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/reports/__tests__/
git commit -m "test(reports): add service unit tests (5 scenarios)"
```

---

### Task 8: Frontend models

**Files:**
- Create: `frontend/src/features/reports/models/report.model.ts`

- [ ] **Step 1: Create the model file**

```typescript
// frontend/src/features/reports/models/report.model.ts
import { z } from 'zod';

export interface ParamField {
  key: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export interface ReportType {
  type: string;
  category: 'sales' | 'inventory' | 'fiscal' | 'financial';
  name: string;
  description: string;
  parameters: ParamField[];
}

export interface GeneratedReport {
  id: string;
  type: string;
  category: string;
  name: string;
  parameters: Record<string, any>;
  results: Record<string, any> | null;
  status: 'generating' | 'ready' | 'failed';
  errorMessage: string | null;
  userName: string | null;
  generatedAt: string | null;
  createdAt: string;
}

export interface ReportListResponse {
  data: GeneratedReport[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const generatedReportSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.string(),
  name: z.string(),
  parameters: z.record(z.any()),
  results: z.record(z.any()).nullable(),
  status: z.enum(['generating', 'ready', 'failed']),
  errorMessage: z.string().nullable(),
  userName: z.string().nullable(),
  generatedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const reportTypeSchema = z.object({
  type: z.string(),
  category: z.enum(['sales', 'inventory', 'fiscal', 'financial']),
  name: z.string(),
  description: z.string(),
  parameters: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['date', 'dateRange', 'select', 'multiSelect', 'number']),
      required: z.boolean(),
      options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
      defaultValue: z.any().optional(),
    }),
  ),
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/models/report.model.ts
git commit -m "feat(reports): add frontend models and Zod schemas"
```

---

### Task 9: Frontend services

**Files:**
- Create: `frontend/src/features/reports/services/reports.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// frontend/src/features/reports/services/reports.service.ts
import apiClient from '@/lib/api/api-client';
import {
  GeneratedReport,
  ReportType,
  ReportListResponse,
  generatedReportSchema,
  reportTypeSchema,
} from '../models/report.model';

export const reportsService = {
  async generate(type: string, parameters: Record<string, any>): Promise<GeneratedReport> {
    const response = await apiClient.post('/reports', { type, parameters });
    return generatedReportSchema.parse(response.data.data);
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
  }): Promise<ReportListResponse> {
    const response = await apiClient.get('/reports', { params });
    return response.data;
  },

  async getById(id: string): Promise<GeneratedReport> {
    const response = await apiClient.get(`/reports/${id}`);
    return generatedReportSchema.parse(response.data.data);
  },

  async getTypes(): Promise<ReportType[]> {
    const response = await apiClient.get('/reports/types');
    return reportTypeSchema.array().parse(response.data.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/services/reports.service.ts
git commit -m "feat(reports): add frontend reports service"
```

---

### Task 10: Frontend hooks

**Files:**
- Create: `frontend/src/features/reports/hooks/use-reports.ts`

- [ ] **Step 1: Create the hook**

```typescript
// frontend/src/features/reports/hooks/use-reports.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';

export function useReports(params?: {
  page?: number;
  limit?: number;
  category?: string;
}) {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsService.getAll(params),
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: () => reportsService.getById(id),
  });
}

export function useReportTypes() {
  return useQuery({
    queryKey: ['reports', 'types'],
    queryFn: () => reportsService.getTypes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, parameters }: { type: string; parameters: Record<string, any> }) =>
      reportsService.generate(type, parameters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reportsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/hooks/use-reports.ts
git commit -m "feat(reports): add frontend hooks for reports CRUD"
```

---

### Task 11: Bar chart component

**Files:**
- Create: `frontend/src/features/reports/components/charts/bar-chart.tsx`

- [ ] **Step 1: Extract and create reusable bar chart**

This extracts the bar chart pattern from `SalesTrendsPanel` into a reusable component:

```tsx
// frontend/src/features/reports/components/charts/bar-chart.tsx
'use client';

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function BarChart({ data, valueFormatter, className }: BarChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-sm text-muted-foreground ${className ?? ''}`}>
        Sin datos
      </div>
    );
  }

  const formatValue = valueFormatter ?? ((v: number) => String(v));

  return (
    <div className={`flex items-end gap-3 h-32 ${className ?? ''}`}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-medium">{formatValue(d.value)}</span>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(d.value / maxValue) * 100}%`,
              minHeight: '4px',
              backgroundColor: 'var(--color-card-1, oklch(0.55 0.18 260))',
            }}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/components/charts/bar-chart.tsx
git commit -m "feat(reports): add reusable bar chart component"
```

---

### Task 12: Report card component

**Files:**
- Create: `frontend/src/features/reports/components/report-card.tsx`

- [ ] **Step 1: Create the report card**

```tsx
// frontend/src/features/reports/components/report-card.tsx
'use client';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, Loader2, FileText } from 'lucide-react';
import type { GeneratedReport } from '../models/report.model';

interface ReportCardProps {
  report: GeneratedReport;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

function typeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    sales_summary: 'reports.types.salesSummary',
    sales_by_customer: 'reports.types.salesByCustomer',
    sales_by_product: 'reports.types.salesByProduct',
  };
  const key = map[type];
  return key ? t(key) : type;
}

export function ReportCard({ report, onView, onDelete }: ReportCardProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{typeLabel(report.type, t)}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(report.generatedAt)}
            {report.userName && ` · ${report.userName}`}
          </p>
          {report.status === 'generating' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t('reports.generating')}
            </p>
          )}
          {report.status === 'failed' && (
            <p className="text-xs text-destructive">{t('reports.error.generate')}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.view')}
          onClick={() => onView(report.id)}
          disabled={report.status === 'generating'}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('common.delete')}
          onClick={() => onDelete(report.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/components/report-card.tsx
git commit -m "feat(reports): add report card component"
```

---

### Task 13: Report generator component

**Files:**
- Create: `frontend/src/features/reports/components/report-generator.tsx`

- [ ] **Step 1: Create the generator form**

```tsx
// frontend/src/features/reports/components/report-generator.tsx
'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useReportTypes, useGenerateReport } from '../hooks/use-reports';
import type { ParamField } from '../models/report.model';

interface ReportGeneratorProps {
  onGenerated: () => void;
}

export function ReportGenerator({ onGenerated }: ReportGeneratorProps) {
  const { t } = useI18n();
  const { data: types, isLoading } = useReportTypes();
  const generateMutation = useGenerateReport();

  const [selectedType, setSelectedType] = useState<string>('');
  const [params, setParams] = useState<Record<string, any>>({});

  const selectedDefinition = types?.find((rt) => rt.type === selectedType);

  const handleGenerate = async () => {
    if (!selectedType) return;
    await generateMutation.mutateAsync(
      { type: selectedType, parameters: params },
      { onSuccess: () => onGenerated() },
    );
    setSelectedType('');
    setParams({});
  };

  const renderParamField = (field: ParamField) => {
    if (field.type === 'date' || field.type === 'dateRange') {
      const endKey = field.type === 'dateRange' ? `${field.key}End` : null;
      return (
        <div key={field.key} className="flex gap-2">
          <div className="space-y-2 flex-1">
            <Label className="text-sm font-semibold">{t(field.label)}</Label>
            <Input
              type="date"
              value={params[field.key] || ''}
              onChange={(e) => setParams({ ...params, [field.key]: e.target.value })}
            />
          </div>
          {endKey && (
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-semibold">{t('reports.params.dateTo')}</Label>
              <Input
                type="date"
                value={params[endKey] || ''}
                onChange={(e) => setParams({ ...params, [endKey]: e.target.value })}
              />
            </div>
          )}
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div key={field.key} className="space-y-2">
          <Label className="text-sm font-semibold">{t(field.label)}</Label>
          <Input
            type="number"
            value={params[field.key] ?? ''}
            onChange={(e) => setParams({ ...params, [field.key]: Number(e.target.value) })}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h3 className="text-base font-semibold">{t('reports.generate')}</h3>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t('reports.selectType')}</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue placeholder={t('reports.selectTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {types?.map((rt) => (
              <SelectItem key={rt.type} value={rt.type}>
                {t(rt.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDefinition && selectedDefinition.parameters.length > 0 && (
        <div className="space-y-4">
          {selectedDefinition.parameters.map(renderParamField)}
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!selectedType || generateMutation.isPending}
        className="w-full"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('reports.generating')}...
          </>
        ) : (
          t('reports.generate')
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/components/report-generator.tsx
git commit -m "feat(reports): add report generator component"
```

---

### Task 14: Report viewer component with type renderers

**Files:**
- Create: `frontend/src/features/reports/components/report-viewer.tsx`

- [ ] **Step 1: Create the viewer with 3 sales report renderers**

```tsx
// frontend/src/features/reports/components/report-viewer.tsx
'use client';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, AlertCircle } from 'lucide-react';
import { useReport } from '../hooks/use-reports';
import { BarChart } from './charts/bar-chart';

interface ReportViewerProps {
  reportId: string;
}

function formatCurrency(amount: number): string {
  return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
}

function SalesSummaryRenderer({ results }: { results: any }) {
  const { t } = useI18n();
  const rows = results?.rows || [];
  const chartData = rows.map((r: any) => ({
    label: r.month || '',
    value: Number(r.total_sales) || 0,
  }));

  const totals = rows.reduce(
    (acc: any, r: any) => ({
      totalSales: acc.totalSales + (Number(r.total_sales) || 0),
      totalRevenue: acc.totalRevenue + (Number(r.total_revenue) || 0),
      totalTax: acc.totalTax + (Number(r.total_tax) || 0),
    }),
    { totalSales: 0, totalRevenue: 0, totalTax: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.totalSales')}</p>
          <p className="text-lg font-bold text-primary">{totals.totalSales}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.totalRevenue')}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totals.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.totalTax')}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totals.totalTax)}</p>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-3">{t('reports.charts.monthlySales')}</h4>
        <BarChart data={chartData} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{t('reports.fields.month')}</th>
              <th className="text-right py-2 pr-4 text-muted-foreground font-medium">{t('reports.fields.salesCount')}</th>
              <th className="text-right py-2 text-muted-foreground font-medium">{t('reports.fields.revenue')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.month} className="border-b border-border/50">
                <td className="py-2.5 pr-4">{r.month}</td>
                <td className="py-2.5 pr-4 text-right">{Number(r.total_sales)}</td>
                <td className="py-2.5 text-right">{formatCurrency(Number(r.total_revenue))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableOnlyRenderer({ results, columns }: { results: any; columns: { key: string; label: string; align?: 'left' | 'right'; format?: (v: any) => string }[] }) {
  const rows = results?.rows || [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2 pr-4 text-muted-foreground font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i} className="border-b border-border/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 pr-4 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.format ? col.format(r[col.key]) : String(r[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesByCustomerRenderer({ results }: { results: any }) {
  const { t } = useI18n();
  return (
    <TableOnlyRenderer
      results={results}
      columns={[
        { key: 'customer_name', label: t('reports.fields.customer') },
        { key: 'sales_count', label: t('reports.fields.salesCount'), align: 'right' },
        { key: 'total_amount', label: t('reports.fields.totalAmount'), align: 'right', format: (v) => formatCurrency(Number(v)) },
      ]}
    />
  );
}

function SalesByProductRenderer({ results }: { results: any }) {
  const { t } = useI18n();
  return (
    <TableOnlyRenderer
      results={results}
      columns={[
        { key: 'product_name', label: t('reports.fields.product') },
        { key: 'quantity_sold', label: t('reports.fields.quantity'), align: 'right' },
        { key: 'total_revenue', label: t('reports.fields.revenue'), align: 'right', format: (v) => formatCurrency(Number(v)) },
      ]}
    />
  );
}

function renderReport(type: string, results: any) {
  switch (type) {
    case 'sales_summary':
      return <SalesSummaryRenderer results={results} />;
    case 'sales_by_customer':
      return <SalesByCustomerRenderer results={results} />;
    case 'sales_by_product':
      return <SalesByProductRenderer results={results} />;
    default:
      return <pre className="text-xs overflow-auto">{JSON.stringify(results, null, 2)}</pre>;
  }
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const { t } = useI18n();
  const { data: report, isLoading, error } = useReport(reportId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('reports.error.load')}</AlertDescription>
      </Alert>
    );
  }

  if (report.status === 'generating') {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">{t('reports.generating')}...</p>
      </div>
    );
  }

  if (report.status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('reports.error.generate')}: {report.errorMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{report.name}</h3>
          <p className="text-xs text-muted-foreground">
            {report.userName && `${t('reports.generatedBy')} ${report.userName} · `}
            {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          {t('reports.print')}
        </Button>
      </div>

      {report.results ? renderReport(report.type, report.results) : (
        <p className="text-sm text-muted-foreground">{t('reports.noResults')}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/components/report-viewer.tsx
git commit -m "feat(reports): add report viewer with type-specific renderers"
```

---

### Task 15: Reports page component

**Files:**
- Create: `frontend/src/features/reports/components/reports-page.tsx`

- [ ] **Step 1: Create the main page**

```tsx
// frontend/src/features/reports/components/reports-page.tsx
'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { useReports, useDeleteReport } from '../hooks/use-reports';
import { ReportCard } from './report-card';
import { ReportGenerator } from './report-generator';
import { ReportViewer } from './report-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileText } from 'lucide-react';

export function ReportsPage() {
  const { t } = useI18n();
  const { data, isLoading } = useReports();
  const deleteMutation = useDeleteReport();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!reportToDelete) return;
    await deleteMutation.mutateAsync(reportToDelete);
    setReportToDelete(null);
    if (selectedReportId === reportToDelete) setSelectedReportId(null);
  };

  if (selectedReportId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedReportId(null)}
          className="text-sm text-primary hover:underline"
        >
          ← {t('reports.backToList')}
        </button>
        <ReportViewer reportId={selectedReportId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportGenerator onGenerated={() => {}} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-3">
          {data.data.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onView={(id) => setSelectedReportId(id)}
              onDelete={(id) => setReportToDelete(id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{t('reports.empty.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('reports.empty.description')}</p>
        </div>
      )}

      <ConfirmDialog
        open={!!reportToDelete}
        onOpenChange={(open) => { if (!open) setReportToDelete(null); }}
        title={t('reports.deleteConfirm')}
        description={t('reports.deleteConfirmDesc')}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/features/reports/components/reports-page.tsx
git commit -m "feat(reports): add reports page component"
```

---

### Task 16: Route page and navigation

**Files:**
- Create: `frontend/src/app/(dashboard)/reports/page.tsx`
- Modify: `frontend/src/config/navigation.config.ts`

- [ ] **Step 1: Create the route page**

```tsx
// frontend/src/app/(dashboard)/reports/page.tsx
import { ReportsPage } from '@/features/reports/components/reports-page';

export default function ReportsRoutePage() {
  return <ReportsPage />;
}
```

- [ ] **Step 2: Add navigation item**

In `frontend/src/config/navigation.config.ts`:

Add `BarChart3` to the lucide-react imports (at the top):

```typescript
import {
  LayoutDashboard,
  Users,
  // ... existing imports ...
  BarChart3,          // <-- add this line
} from 'lucide-react';
```

Add the reports nav group after the `ventas` group (after line 73, the closing `}` of the `ventas` group):

```typescript
  {
    key: 'reports',
    label: 'nav.group.reports',
    items: [
      { key: 'reports', label: 'Reportes', icon: BarChart3, path: '/reports', minLevel: 40 },
    ],
  },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/\(dashboard\)/reports/page.tsx frontend/src/config/navigation.config.ts
git commit -m "feat(reports): add reports route page and navigation item"
```

---

### Task 17: i18n keys

**Files:**
- Modify: `frontend/src/i18n/locales/es.json`
- Modify: `frontend/src/i18n/locales/en.json`

- [ ] **Step 1: Add Spanish keys**

In `es.json`, add the following section (before the last closing `}`):

```json
  "reports": {
    "title": "Reportes",
    "generate": "Generar Reporte",
    "generating": "Generando",
    "selectType": "Tipo de Reporte",
    "selectTypePlaceholder": "Selecciona un tipo...",
    "backToList": "Volver a la lista",
    "print": "Imprimir",
    "deleteConfirm": "Eliminar Reporte",
    "deleteConfirmDesc": "¿Estás seguro? Esta acción no se puede deshacer.",
    "noResults": "Sin resultados",
    "generatedBy": "Generado por",
    "created": "Reporte generado exitosamente",
    "deleted": "Reporte eliminado",
    "error": {
      "generate": "Error al generar el reporte",
      "load": "Error al cargar el reporte",
      "delete": "Error al eliminar el reporte"
    },
    "empty": {
      "title": "No hay reportes generados",
      "description": "Selecciona un tipo de reporte y genera el primero"
    },
    "types": {
      "salesSummary": "Resumen de Ventas",
      "salesSummaryDesc": "Total de ventas, ingresos e impuestos por mes",
      "salesByCustomer": "Ventas por Cliente",
      "salesByCustomerDesc": "Ventas agrupadas por cliente con totales",
      "salesByProduct": "Ventas por Producto",
      "salesByProductDesc": "Productos más vendidos por cantidad e ingresos"
    },
    "params": {
      "dateFrom": "Fecha Desde",
      "dateTo": "Fecha Hasta"
    },
    "fields": {
      "month": "Mes",
      "customer": "Cliente",
      "product": "Producto",
      "salesCount": "Ventas",
      "totalSales": "Total Ventas",
      "totalRevenue": "Ingresos Totales",
      "totalTax": "IVA Total",
      "totalAmount": "Monto Total",
      "quantity": "Cantidad",
      "revenue": "Ingresos"
    },
    "charts": {
      "monthlySales": "Ventas por Mes"
    }
  }
```

- [ ] **Step 2: Add English keys**

In `en.json`, add the same structure with English translations:

```json
  "reports": {
    "title": "Reports",
    "generate": "Generate Report",
    "generating": "Generating",
    "selectType": "Report Type",
    "selectTypePlaceholder": "Select a type...",
    "backToList": "Back to list",
    "print": "Print",
    "deleteConfirm": "Delete Report",
    "deleteConfirmDesc": "Are you sure? This action cannot be undone.",
    "noResults": "No results",
    "generatedBy": "Generated by",
    "created": "Report generated successfully",
    "deleted": "Report deleted",
    "error": {
      "generate": "Error generating report",
      "load": "Error loading report",
      "delete": "Error deleting report"
    },
    "empty": {
      "title": "No reports generated",
      "description": "Select a report type and generate the first one"
    },
    "types": {
      "salesSummary": "Sales Summary",
      "salesSummaryDesc": "Total sales, revenue, and tax by month",
      "salesByCustomer": "Sales by Customer",
      "salesByCustomerDesc": "Sales grouped by customer with totals",
      "salesByProduct": "Sales by Product",
      "salesByProductDesc": "Top selling products by quantity and revenue"
    },
    "params": {
      "dateFrom": "Date From",
      "dateTo": "Date To"
    },
    "fields": {
      "month": "Month",
      "customer": "Customer",
      "product": "Product",
      "salesCount": "Sales",
      "totalSales": "Total Sales",
      "totalRevenue": "Total Revenue",
      "totalTax": "Total Tax",
      "totalAmount": "Total Amount",
      "quantity": "Quantity",
      "revenue": "Revenue"
    },
    "charts": {
      "monthlySales": "Monthly Sales"
    }
  }
```

- [ ] **Step 3: Ensure correct JSON structure**

The `reports` top-level key goes after `pos` and before `sync` in the file. Additionally:

1. Add `"reports": "Reportes"` to the flat `nav` object (alongside `dashboard`, `users`, etc.)
2. Add `"reports": "Reportes"` to the `nav.group` object (alongside `compras`, `ventas`, etc.)

Check that:
- Commas between top-level keys are correct
- No trailing commas
- Both files have identical key structure

- [ ] **Step 4: Verify typecheck and lint**

```bash
pnpm --filter frontend typecheck
pnpm --filter frontend lint
```

Expected: 0 errors from both.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/i18n/locales/es.json frontend/src/i18n/locales/en.json
git commit -m "feat(reports): add i18n keys (es + en)"
```

---

### Task 18: Final verification

- [ ] **Step 1: Run typecheck for entire project**

```bash
pnpm typecheck
```

Expected: 0 errors across backend and frontend.

- [ ] **Step 2: Run lint for entire project**

```bash
pnpm lint
```

Expected: 0 errors.

- [ ] **Step 3: Run backend tests**

```bash
pnpm --filter backend test
```

Expected: All tests pass.

- [ ] **Step 4: Manual smoke test**

```bash
pnpm dev
```

1. Open http://localhost:3000
2. Login as admin (`admin@cuadra.app` / `Test123!`)
3. Navigate to "Reportes" in the sidebar
4. Select "Resumen de Ventas" → Generate
5. Verify: KPI cards appear with totals, bar chart renders, table shows monthly data
6. Verify: "Imprimir" button opens print dialog
7. Generate "Ventas por Cliente" → verify table
8. Generate "Ventas por Producto" → verify table
9. Delete a report → verify it disappears from list

Expected: All steps work without errors.

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore(reports): final verification and fixes"
```

---

## Plan Stats

- **Tasks:** 18
- **New files:** 15 backend + 9 frontend = 24
- **Modified files:** 4 (schema, app.module, prisma.service, navigation.config, i18n x2)
- **Estimated total time:** ~4-6 hours

---

*Referencia cruzada: [reports-module-design.md](../../.spec/plans/reports-module-design.md) | [architecture.md](../../.spec/system/architecture.md) | [api-conventions.md](../../.spec/system/api-conventions.md)*
