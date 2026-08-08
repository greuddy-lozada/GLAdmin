# Reports Module — Design Spec

> **status:** `done` (engine + Phase 1–2 shipped; backlog fiscal/financeiro en [.spec/features/reports.md](../features/reports.md))  
> **Status:** ✅ Implemented (core)  
> **Date:** 2026-07-19  
> **Module:** `reports`  
> **Dependencies:** `sales`, `purchase-orders`, `stocks`, `customers`, `suppliers`, `withholding-records`, `accounts-payable`, `accounts-receivable`

> Agentes: para qué reportes faltan y prioridad contador VE, usar **features/reports.md**, no reabrir este plan como trabajo incompleto del engine.

---

## 1. Overview

A **stored report generation** system. Users select a report type, fill in parameters (date range, filters, grouping), and generate a report. The report is stored in the database with its parameters and results. Generated reports can be:
- Viewed interactively in-app (HTML rendered from stored results)
- Exported to PDF (MVP: client-side `window.print()`)
- Revisited later without re-running

Reports cover 4 categories: **Sales**, **Inventory**, **Fiscal**, **Financial**.

---

## 2. Data Model

### New table: `generated_reports`

```prisma
model GeneratedReport {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @db.Uuid
  userId         String    @db.Uuid
  type           String                                 // 'sales_summary', 'inventory_status', etc.
  category       String                                 // 'sales' | 'inventory' | 'fiscal' | 'financial'
  name           String                                 // user-facing title, e.g. "Ventas Julio 2026"
  parameters     Json      @db.JsonB                    // { dateFrom, dateTo, filters, groupBy }
  results        Json?     @db.JsonB                    // cached query output (rows, aggregates, metadata)
  htmlSnapshot   String?   @db.Text                     // rendered HTML for in-app preview
  format         String    @default("json")             // 'json' | 'html' | 'pdf'
  status         String    @default("generating")       // 'generating' | 'ready' | 'failed'
  errorMessage   String?                                // if status = 'failed'
  generatedAt    DateTime?                               // when report finished generating
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization   Organization  @relation(fields: [organizationId], references: [id])
  user           User          @relation(fields: [userId], references: [id])

  @@map("generated_reports")
  @@index([organizationId, category])
  @@index([organizationId, type])
  @@index([organizationId, createdAt])
  @@index([userId])
}
```

### Design decisions

| Decision | Rationale |
|---|---|
| `parameters` as `Json @db.JsonB` | Stores input params — makes reports re-runnable |
| `results` as `Json @db.JsonB` | Caches query output — instant preview without re-querying |
| `status` lifecycle | `generating` → `ready` / `failed` — frontend polls or shows progress |
| Reports are immutable | Once generated, never updated. "Edit" = generate a new one |
| `htmlSnapshot` as `@db.Text` | Stores pre-rendered HTML for fast in-app display; regenerated if null |
| One table, no subtypes | Category/type differentiation via string fields, not inheritance |

---

## 3. Report Engine

### 3.1 Report Registry

Each report type is a plain object — no classes, no inheritance:

```typescript
interface ParamField {
  key: string;
  label: string;          // i18n key
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];  // for select/multiSelect
  defaultValue?: any;
}

interface ReportDefinition {
  type: string;
  category: 'sales' | 'inventory' | 'fiscal' | 'financial';
  name: string;           // i18n key
  description: string;    // i18n key
  parameters: ParamField[];
  query: (orgId: string, params: Record<string, any>, prisma: PrismaService) => Promise<any>;
}
```

Adding a report = pushing one object to the registry array. No engine changes needed.

### 3.2 Query Strategy

Reports use `$queryRaw` / `$queryRawUnsafe` with parameterized queries. This is an explicit exception to the AGENTS.md no-raw-query rule, justified by:
- Prisma is not suited for analytics (aggregates, date grouping, window functions)
- All queries are parameterized — no string interpolation of user input
- Each query is defined in the registry, reviewed, and tested

### 3.3 Generation Flow

```
POST /api/reports { type, parameters }
  → Validate type exists in registry
  → Validate parameters against ParamField[]
  → INSERT generated_reports (status='generating')
  → Run query from registry definition
  → UPDATE results JSON, status='ready', generatedAt=now()
  → Return report with results
  → (if query fails: status='failed', errorMessage set)
```

### 3.4 PDF Strategy

| Phase | Approach |
|---|---|
| MVP (Phase 1) | Client-side `window.print()` with print-specific CSS. Zero backend code. |
| Phase 2+ | Server-side Puppeteer taking `htmlSnapshot` → PDF binary stored as base64 or file |

---

## 4. API

### Endpoints

```
POST   /api/reports                    → generate(dto: GenerateReportDto)
GET    /api/reports                    → findAll(query: ReportQueryDto)
GET    /api/reports/:id                → findOne(id)
GET    /api/reports/types              → getAvailableTypes()       // returns registry
DELETE /api/reports/:id                → remove(id)                // soft delete
```

### DTOs

```typescript
class GenerateReportDto {
  @IsString() @IsNotEmpty()
  type: string;

  @IsObject()
  parameters: Record<string, any>;
}

class ReportQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(['sales', 'inventory', 'fiscal', 'financial'])
  category?: string;

  @IsOptional() @IsString()
  type?: string;

  @IsOptional() @IsDate()
  fromDate?: Date;

  @IsOptional() @IsDate()
  toDate?: Date;
}
```

### Response format

Standard envelope per `api-conventions.md`:

```json
{
  "data": {
    "id": "uuid",
    "type": "sales_summary",
    "category": "sales",
    "name": "Ventas Julio 2026",
    "parameters": { "dateFrom": "2026-07-01", "dateTo": "2026-07-31" },
    "results": {
      "summary": { "totalSales": 150, "totalRevenue": 45000, "totalTax": 7200 },
      "rows": [...],
      "chartData": [...]
    },
    "status": "ready",
    "generatedAt": "2026-07-19T10:00:00.000Z"
  }
}
```

### Error Codes

| Code | Scenario |
|---|---|
| `REPORT_001` | Unknown report type |
| `REPORT_002` | Invalid parameters for this report type |
| `REPORT_003` | Report generation failed (query error) |

### Access Control

| Role | Generate | View | Delete |
|---|---|---|---|
| `superadmin` / `admin` | ✅ | ✅ | ✅ |
| `accountant` | ✅ | ✅ | ❌ |
| `viewer` | ❌ | ✅ | ❌ |
| `cashier` | ❌ | ❌ | ❌ |

---

## 5. Frontend

### File structure

```
frontend/src/features/reports/
├── components/
│   ├── reports-page.tsx           → Main page: list of stored reports
│   ├── report-generator.tsx       → Form: type selector + parameters → generate
│   ├── report-viewer.tsx          → Interactive view of a stored report
│   ├── report-card.tsx            → Card in the list
│   └── charts/
│       └── bar-chart.tsx          → Shared bar chart (extracted from SalesTrendsPanel)
├── hooks/
│   └── use-reports.ts             → Data fetching + useOptimisticCrud
├── models/
│   └── report.model.ts            → TypeScript interfaces + Zod schemas
└── services/
    └── reports.service.ts         → API calls
```

### Navigation

New nav group in `navigation.config.ts`:

```typescript
{
  key: 'reports',
  label: 'nav.group.reports',
  items: [
    { key: 'reports', label: 'Reportes', icon: BarChart3, path: '/reports', minLevel: 40 },
  ],
}
```

### Report types → React renderers

Each report type maps to a specific render function. Not a generic engine — one renderer per type:

| Report type | Renders | Phase |
|---|---|---|
| `sales_summary` | KPI cards + bar chart (by month) + DataTable (top products) | 1 |
| `sales_by_customer` | DataTable (customer, count, amount) + bar chart | 1 |
| `sales_by_product` | DataTable (product, quantity, revenue) | 1 |
| `inventory_status` | DataTable (product, stock, price, value) + low-stock alerts | 2 |
| `stock_movements` | DataTable (date, product, type, quantity) grouped by batch | 2 |
| `fiscal_iva` | Summary cards + DataTable (taxable sales with IVA) | 3 |
| `fiscal_withholding` | DataTable (supplier, base, %, withheld) | 3 |
| `financial_ap` | DataTable (supplier, due date, amount) | 4 |
| `financial_ar` | DataTable (customer, due date, amount) | 4 |

### State handling

| State | UI |
|---|---|
| Loading (list) | Skeleton cards |
| Loading (generating) | Progress indicator on report card (`status === 'generating'`) |
| Empty list | `PackageOpen` empty state + "Generar reporte" CTA |
| Error | `Alert variant="destructive"` with error message |
| PDF print | Button triggers `window.print()` with `@media print` CSS |

---

## 6. Phased Delivery

### Phase 1 — Sales Reports (Core engine + 3 reports)

| Report | Query | Data used |
|---|---|---|
| `sales_summary` | Aggregated: total sales, revenue, tax by month | `sale`, `sales_det` |
| `sales_by_customer` | Sales grouped by customer with totals | `sale`, `customer` |
| `sales_by_product` | Top products by quantity and revenue | `sales_det`, `product` |

This phase validates the engine, UX, and lifecycle end-to-end.

### Phase 2 — Inventory Reports (+2 reports)

| Report | Query | Data used |
|---|---|---|
| `inventory_status` | Current stock levels, value at price, low stock | `product`, `stock` |
| `stock_movements` | StockDet grouped by date/batch | `stock`, `stock_det`, `product` |

### Phase 3 — Fiscal Reports (+2 reports)

| Report | Query | Data used |
|---|---|---|
| `fiscal_iva` | All sales with tax breakdown, IVA totals by period | `sale`, `sales_det`, `tax` |
| `fiscal_withholding` | Withholding records by supplier and period | `withholding_record`, `supplier`, `purchase_order` |

### Phase 4 — Financial Reports (+2 reports)

| Report | Query | Data used |
|---|---|---|
| `financial_ap` | Accounts payable: supplier, due date, amount, status | `accounts_payable`, `supplier`, `purchase_order` |
| `financial_ar` | Accounts receivable: customer, due date, amount, status | `accounts_receivable`, `sale`, `customer` |

---

## 7. Files Manifest

### Backend

| Action | File |
|---|---|
| Create | `backend/src/modules/reports/reports.module.ts` |
| Create | `backend/src/modules/reports/reports.controller.ts` |
| Create | `backend/src/modules/reports/reports.service.ts` |
| Create | `backend/src/modules/reports/report-registry.ts` |
| Create | `backend/src/modules/reports/dto/generate-report.dto.ts` |
| Create | `backend/src/modules/reports/dto/report-query.dto.ts` |
| Modify | `backend/prisma/schema.prisma` — add `GeneratedReport` model |
| Create | Migration |

### Frontend

| Action | File |
|---|---|
| Create | `frontend/src/features/reports/components/reports-page.tsx` |
| Create | `frontend/src/features/reports/components/report-generator.tsx` |
| Create | `frontend/src/features/reports/components/report-viewer.tsx` |
| Create | `frontend/src/features/reports/components/report-card.tsx` |
| Create | `frontend/src/features/reports/components/charts/bar-chart.tsx` |
| Create | `frontend/src/features/reports/hooks/use-reports.ts` |
| Create | `frontend/src/features/reports/models/report.model.ts` |
| Create | `frontend/src/features/reports/services/reports.service.ts` |
| Modify | `frontend/src/config/navigation.config.ts` |
| Modify | `frontend/src/i18n/locales/es.json` |
| Modify | `frontend/src/i18n/locales/en.json` |

### Routes

| Action | File |
|---|---|
| Create | `frontend/src/app/(dashboard)/reports/page.tsx` |

---

## 8. What This Does NOT Include

| Excluded | Reason |
|---|---|
| Custom report builder (user-defined queries) | YAGNI — pre-built types cover all spec requirements. Revisit if user demand emerges. |
| Scheduled/automatic report generation | Background jobs not yet implemented. Revisit with `@nestjs/schedule` (already used for subscription lifecycle). |
| Report sharing / email delivery | Out of scope for MVP. |
| Server-side PDF generation | MVP uses `window.print()`. Add Puppeteer in Phase 2+ only if client-side printing is insufficient. |
| Real-time report update | Immutable by design. Generate a new one if data changes. |
| Charts beyond bar chart | Only bar charts needed for MVP reports. Add line/pie charts if a future report type demands them. |

---

## 9. Constraints & Edge Cases

| Scenario | Behavior |
|---|---|
| User generates report with future dates | Allowed — query returns empty rows (no sales yet) |
| User generates report with same params twice | New report created (immutable). User can delete duplicates. |
| Report generation takes >30s | HTTP timeout at 30s. Heavy queries should be optimized or marked for background processing (Phase 2+). |
| Query fails mid-generation | `status='failed'`, `errorMessage` set. Frontend shows `Alert`. User can retry. |
| Soft-deleted records appear in report | Queries include `WHERE deleted_at IS NULL` — report reflects live data at generation time. |
| Organization with no data | Report generates successfully with empty rows and zero aggregates. |
| User deletes a report | Soft delete — `deletedAt` set. Report hidden from list but recoverable by admin. |

---

## 10. Testing

### Backend

- `reports.service.spec.ts` — 6 scenarios:
  - Generate report with valid type and params
  - Throw `REPORT_001` for unknown type
  - Throw `REPORT_002` for invalid params
  - Generate report returns `status='ready'` with results
  - Failed query returns `status='failed'` with error message
  - `findAll` filters by category and date range

### Frontend

- `reports-page.test.tsx` — renders list, empty state, skeleton loading
- `report-generator.test.tsx` — type selector renders, params form renders, submit calls service
- `report-viewer.test.tsx` — renders results for each report type, handles generating/failed status

### E2E

- Generate a sales summary → view results → print to PDF → delete report (Phase 1 spec)

---

## 11. Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Raw SQL queries introduce subtle bugs | Medium | Medium | All queries parameterized. Each query tested with known data. Query review in PR. |
| Report generation slow on large datasets | Medium | Medium | MVP datasets small (PyMEs). Add query limits, paginate results. Monitor with `performance.md` thresholds. |
| `htmlSnapshot` grows large | Low | Low | `@db.Text` has no practical limit. Truncate if needed; regenerate from `results` on demand. |

---

*Referencia cruzada: [architecture.md](../../.spec/system/architecture.md) §4 | [api-conventions.md](../../.spec/system/api-conventions.md) | [security.md](../../.spec/system/security.md) §2 (RBAC) | [product-strategy.md](../../.spec/business/product-strategy.md) (Roadmap: "Historial de ventas y reporting")*
