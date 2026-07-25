'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { useReports, useDeleteReport } from '../hooks/use-reports';
import { ReportCard } from './report-card';
import { ReportGenerator } from './report-generator';
import { ReportViewer } from './report-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BarChart3, ClipboardList, FileText } from 'lucide-react';

const CATEGORIES = [
  { key: 'sales', label: 'reports.categories.sales', icon: BarChart3 },
  { key: 'inventory', label: 'reports.categories.inventory', icon: ClipboardList },
] as const;

export function ReportsPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].key);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const { data, isLoading, refetch } = useReports({ limit: 100 });
  const deleteMutation = useDeleteReport();

  const allReports = useMemo(() => data?.data ?? [], [data]);
  const reports = useMemo(
    () => allReports.filter((r) => r.category === activeCategory),
    [allReports, activeCategory],
  );
  const reportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allReports) counts[r.category] = (counts[r.category] || 0) + 1;
    return counts;
  }, [allReports]);

  const handleGenerated = () => {
    refetch();
    sileo.success({ description: t('reports.created') });
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      await deleteMutation.mutateAsync(reportToDelete);
      sileo.success({ description: t('reports.deleted') });
    } catch {
      sileo.error({ description: t('reports.error.delete') });
    }
    setReportToDelete(null);
    if (selectedReportId === reportToDelete) setSelectedReportId(null);
  };

  return (
    <div className="flex h-full -mx-6 md:-mx-8 -mb-6 md:-mb-8">
      {/* Left Panel */}
      <div className="w-[420px] shrink-0 border-r border-border flex flex-col bg-card/30 overflow-hidden">
        {/* Category Tabs */}
        <div className="flex border-b border-border shrink-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = reportCounts[cat.key] ?? 0;
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => { setActiveCategory(cat.key); setSelectedReportId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  active
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(cat.label)}
                {count > 0 && (
                  <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                    active ? 'bg-primary/15' : 'bg-muted'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Generator */}
          <ReportGenerator category={activeCategory} onGenerated={handleGenerated} />

          {/* Report List */}
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t('reports.generatedReports')}
            </h3>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    selected={report.id === selectedReportId}
                    onView={(id) => setSelectedReportId(id)}
                    onDelete={(id) => setReportToDelete(id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">{t('reports.empty.title')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('reports.empty.description')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedReportId ? (
          <div className="p-6">
            <ReportViewer reportId={selectedReportId} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <BarChart3 className="h-20 w-20 text-muted-foreground/30 mb-6" />
            <h3 className="text-lg font-semibold text-muted-foreground">{t('reports.selectToView')}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">{t('reports.selectToViewDesc')}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!reportToDelete}
        title={t('reports.deleteConfirm')}
        message={t('reports.deleteConfirmDesc')}
        onConfirm={handleDelete}
        onCancel={() => setReportToDelete(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
