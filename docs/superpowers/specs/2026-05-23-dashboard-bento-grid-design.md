# Dashboard Bento Grid — Design Spec

## Overview
Add an analytics bento grid section below the existing stat cards on the dashboard page. The bento grid displays 5 data panels in a 3-column asymmetric layout.

## Backend — `GET /dashboard/analytics`

Extend `DashboardService` with a new method `getAnalytics()` returning:

```ts
interface DashboardAnalytics {
  recentOrders: {
    id: number;
    code: string | null;
    supplierName: string;
    amount: number | null;
    date: string | null;
  }[];

  topProducts: {
    id: number;
    name: string;
    price: number;
    existence: number;
  }[];

  stockAlerts: {
    id: number;
    name: string;
    price: number;
    existence: number;
  }[];

  topSuppliers: {
    id: number;
    companyName: string;
    orderCount: number;
  }[];

  monthlyOrders: {
    month: string;   // "2026-01"
    count: number;
  }[];
}
```

Add `@Get('analytics')` endpoint in `DashboardController` with `@Roles('master', 'admin', 'employee')`.

## Frontend Data Flow

### Hook
- Create `useDashboardAnalytics()` hook using `@tanstack/react-query`.
- Fetch from `/dashboard/analytics`.
- Return typed `DashboardAnalytics` data.

### Model
```ts
interface DashboardAnalytics {
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  stockAlerts: StockAlert[];
  topSuppliers: TopSupplier[];
  monthlyOrders: MonthlyOrder[];
}
```

## Bento Grid Layout

3-column grid (`grid-cols-3`) with the following cells:

```
┌──────────────────────────────────────────────┐
│              Órdenes Recientes                │  ← col-span-3
│  #  Código  Proveedor  Monto    Fecha        │
│  ... (max 5 rows)                            │
├─────────────────────┬────────────────────────┤
│  Top Productos      │ Alertas de Stock       │
│  [Stock por prod]   │ • Prod A (3 uds)       │  ← col-span-2 + col-span-1
│                     │ • Prod B (1 ud)        │
│                     │ • Prod C (5 uds)      │
├──────────┬──────────┴────────────────────────┤
│ Proveed. │   Tendencia Mensual               │
│ Top      │   [Monthly order count bars]      │  ← col-span-1 + col-span-2
│ #1 Prov A│                                    │
│ #2 Prov B│                                    │
└──────────┴────────────────────────────────────┘
```

- All panels use `rounded-xl`, `bg-card`, `p-5`, `border border-border`.
- Headers use `text-sm font-semibold text-muted-foreground`.
- Scrollable content inside panels where needed.
- Responsive: collapse to single column on mobile.

## Component Structure

- `frontend/src/app/(dashboard)/dashboard/page.tsx` — stays as the Next.js page, imports bento grid components
- `frontend/src/features/dashboard/components/dashboard-bento.tsx` — the bento grid layout wrapper
- `frontend/src/features/dashboard/components/recent-orders-panel.tsx`
- `frontend/src/features/dashboard/components/top-products-panel.tsx` — simple visual bars using div widths
- `frontend/src/features/dashboard/components/stock-alerts-panel.tsx`
- `frontend/src/features/dashboard/components/top-suppliers-panel.tsx`
- `frontend/src/features/dashboard/components/monthly-trends-panel.tsx`
- `frontend/src/features/dashboard/hooks/use-dashboard-analytics.ts`
- `frontend/src/features/dashboard/models/dashboard-analytics.model.ts`

No charting libraries — use pure Tailwind divs for bar visuals.

## i18n Keys

```
dashboard.analytics.recentOrders       → "Órdenes Recientes"
dashboard.analytics.topProducts        → "Top Productos"
dashboard.analytics.stockAlerts        → "Alertas de Stock"
dashboard.analytics.topSuppliers       → "Proveedores Top"
dashboard.analytics.monthlyTrends      → "Tendencia Mensual"
dashboard.analytics.code               → "Código"
dashboard.analytics.supplier           → "Proveedor"
dashboard.analytics.amount             → "Monto"
dashboard.analytics.date               → "Fecha"
dashboard.analytics.product            → "Producto"
dashboard.analytics.existence          → "Existencia"
dashboard.analytics.company            → "Empresa"
dashboard.analytics.orders             → "Órdenes"
dashboard.analytics.stockAlertNone     → "Sin alertas"
dashboard.analytics.noOrders           → "Sin órdenes recientes"
```

## Data Query Implementation (backend)

### recentOrders
```sql
SELECT po.id, po.code, s.companyName, po.amount, po.date
FROM PurchaseOrder po
JOIN Supplier s ON s.id = po.idSupplier
ORDER BY po.createdAt DESC
LIMIT 5
```

### topProducts
```sql
SELECT p.id, p.name, p.price, COALESCE(SUM(s.existence), 0) as existence
FROM Product p
LEFT JOIN Stock s ON s.idProduct = p.id
WHERE p.available = true
GROUP BY p.id
ORDER BY existence DESC
LIMIT 5
```

### stockAlerts
Same as topProducts but `HAVING existence <= 5` and `ORDER BY existence ASC`.

### topSuppliers
```sql
SELECT s.id, s.companyName, COUNT(po.id) as orderCount
FROM Supplier s
JOIN PurchaseOrder po ON po.idSupplier = s.id
WHERE s.available = true
GROUP BY s.id
ORDER BY orderCount DESC
LIMIT 5
```

### monthlyOrders
```sql
SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
FROM PurchaseOrder
WHERE date IS NOT NULL
GROUP BY month
ORDER BY month DESC
LIMIT 6
```
Return in chronological order.

## Implementation Plan
1. Extend backend DashboardService + Controller
2. Create frontend model + hook
3. Create 6 bento panel components
4. Wire into dashboard page
5. Add i18n keys (es.json + en.json)
6. Run typecheck + lint
