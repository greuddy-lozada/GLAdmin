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

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: (v: unknown) => string;
}

function DataTableRenderer({ rows, columns }: { rows: Record<string, unknown>[]; columns: Column[] }) {
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
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 pr-4 ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {col.format ? col.format(r[col.key]) : String(r[col.key] ?? '\u2014')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesSummaryRenderer({ results }: { results: Record<string, unknown> }) {
  const { t } = useI18n();
  const rows = (results.rows as Record<string, unknown>[]) || [];

  const chartData = rows.map((r) => ({
    label: String(r.month || ''),
    value: Number(r.total_sales) || 0,
  }));

  const totals = rows.reduce<{ totalSales: number; totalRevenue: number; totalTax: number }>(
    (acc, r) => ({
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
      <DataTableRenderer
        rows={rows}
        columns={[
          { key: 'month', label: t('reports.fields.month') },
          { key: 'total_sales', label: t('reports.fields.salesCount'), align: 'right' },
          { key: 'total_revenue', label: t('reports.fields.revenue'), align: 'right', format: (v) => formatCurrency(Number(v)) },
        ]}
      />
    </div>
  );
}

function SalesByCustomerRenderer({ results }: { results: Record<string, unknown> }) {
  const { t } = useI18n();
  const rows = (results.rows as Record<string, unknown>[]) || [];

  return (
    <DataTableRenderer
      rows={rows}
      columns={[
        { key: 'customer_name', label: t('reports.fields.customer') },
        { key: 'sales_count', label: t('reports.fields.salesCount'), align: 'right' },
        { key: 'total_amount', label: t('reports.fields.totalAmount'), align: 'right', format: (v) => formatCurrency(Number(v)) },
      ]}
    />
  );
}

function SalesByProductRenderer({ results }: { results: Record<string, unknown> }) {
  const { t } = useI18n();
  const rows = (results.rows as Record<string, unknown>[]) || [];

  return (
    <DataTableRenderer
      rows={rows}
      columns={[
        { key: 'product_name', label: t('reports.fields.product') },
        { key: 'quantity_sold', label: t('reports.fields.quantity'), align: 'right' },
        { key: 'total_revenue', label: t('reports.fields.revenue'), align: 'right', format: (v) => formatCurrency(Number(v)) },
      ]}
    />
  );
}

function InventoryStatusRenderer({ results }: { results: Record<string, unknown> }) {
  const { t } = useI18n();
  const rows = (results.rows as Record<string, unknown>[]) || [];

  const totals = rows.reduce<{ totalProducts: number; totalStock: number; totalValue: number; lowStockCount: number }>(
    (acc, r) => ({
      totalProducts: acc.totalProducts + 1,
      totalStock: acc.totalStock + (Number(r.total_existence) || 0),
      totalValue: acc.totalValue + (Number(r.inventory_value) || 0),
      lowStockCount: acc.lowStockCount + (r.is_low_stock ? 1 : 0),
    }),
    { totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.totalProducts')}</p>
          <p className="text-lg font-bold text-primary">{totals.totalProducts}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.totalStock')}</p>
          <p className="text-lg font-bold text-primary">{totals.totalStock.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.totalInventoryValue')}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(totals.totalValue)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">{t('reports.fields.lowStockProducts')}</p>
          <p className={`text-lg font-bold ${totals.lowStockCount > 0 ? 'text-destructive' : 'text-primary'}`}>
            {totals.lowStockCount}
          </p>
        </div>
      </div>
      <DataTableRenderer
        rows={rows}
        columns={[
          { key: 'code', label: t('reports.fields.code') },
          { key: 'product_name', label: t('reports.fields.product') },
          { key: 'total_existence', label: t('reports.fields.stock'), align: 'right' },
          { key: 'price', label: t('reports.fields.price'), align: 'right', format: (v) => formatCurrency(Number(v)) },
          { key: 'inventory_value', label: t('reports.fields.inventoryValue'), align: 'right', format: (v) => formatCurrency(Number(v)) },
          { key: 'is_low_stock', label: t('reports.fields.lowStock'), align: 'right', format: (v) => v ? '⚠️' : '—' },
        ]}
      />
    </div>
  );
}

function StockMovementsRenderer({ results }: { results: Record<string, unknown> }) {
  const { t } = useI18n();
  const rows = (results.rows as Record<string, unknown>[]) || [];

  const typeLabel = (type: number): string => {
    if (type === 1) return t('reports.fields.movementEntry');
    if (type === 2) return t('reports.fields.movementExit');
    return String(type);
  };

  return (
    <DataTableRenderer
      rows={rows}
      columns={[
        { key: 'date', label: t('reports.fields.date') },
        { key: 'product_name', label: t('reports.fields.product') },
        { key: 'batch_code', label: t('reports.fields.batch') },
        { key: 'type', label: t('reports.fields.movementType'), format: (v) => typeLabel(Number(v)) },
        { key: 'quantity', label: t('reports.fields.quantity'), align: 'right' },
        { key: 'observation', label: t('reports.fields.observation') },
      ]}
    />
  );
}

function renderReport(type: string, results: Record<string, unknown>) {
  switch (type) {
    case 'sales_summary':
      return <SalesSummaryRenderer results={results} />;
    case 'sales_by_customer':
      return <SalesByCustomerRenderer results={results} />;
    case 'sales_by_product':
      return <SalesByProductRenderer results={results} />;
    case 'inventory_status':
      return <InventoryStatusRenderer results={results} />;
    case 'stock_movements':
      return <StockMovementsRenderer results={results} />;
    default:
      return <pre className="text-xs overflow-auto">{JSON.stringify(results, null, 2)}</pre>;
  }
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const { t } = useI18n();
  const { data: report, isLoading } = useReport(reportId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!report) {
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
            {report.userName && `${t('reports.generatedBy')} ${report.userName} \u00b7 `}
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
