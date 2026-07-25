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
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString();
}

function typeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    sales_summary: 'reports.types.salesSummary',
    sales_by_customer: 'reports.types.salesByCustomer',
    sales_by_product: 'reports.types.salesByProduct',
    inventory_status: 'reports.types.inventoryStatus',
    stock_movements: 'reports.types.stockMovements',
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
            {report.userName && ` \u00b7 ${report.userName}`}
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
