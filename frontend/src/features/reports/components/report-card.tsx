'use client';

import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Trash2 } from 'lucide-react';
import type { GeneratedReport } from '../models/report.model';
import { getReportTypeLabel } from '../lib/report-labels';

interface ReportCardProps {
  report: GeneratedReport;
  selected?: boolean;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString();
}

export function ReportCard({ report, selected, onView, onDelete }: ReportCardProps) {
  const { t } = useI18n();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(report.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(report.id); } }}
      className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
        selected
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-card hover:bg-accent/30'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText className={`h-4 w-4 shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{getReportTypeLabel(report.type, t)}</p>
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
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-7 w-7"
          aria-label={t('common.delete')}
          onClick={(e) => { e.stopPropagation(); onDelete(report.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
