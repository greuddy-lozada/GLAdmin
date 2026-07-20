import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../shared/prisma/prisma.service';

export interface ParamField {
  key: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number';
  required: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: unknown;
}

export interface ReportDefinition {
  type: string;
  category: 'sales' | 'inventory' | 'fiscal' | 'financial';
  name: string;
  description: string;
  parameters: ParamField[];
  query: (orgId: string, params: Record<string, unknown>, prisma: PrismaService) => Promise<unknown>;
}

function salesSummaryQuery(orgId: string, params: Record<string, unknown>, prisma: PrismaService) {
  const dateFrom = params.dateFrom as string | undefined;
  const dateTo = params.dateTo as string | undefined;

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

function salesByCustomerQuery(orgId: string, params: Record<string, unknown>, prisma: PrismaService) {
  const dateFrom = params.dateFrom as string | undefined;
  const dateTo = params.dateTo as string | undefined;

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

function salesByProductQuery(orgId: string, params: Record<string, unknown>, prisma: PrismaService) {
  const dateFrom = params.dateFrom as string | undefined;
  const dateTo = params.dateTo as string | undefined;

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
