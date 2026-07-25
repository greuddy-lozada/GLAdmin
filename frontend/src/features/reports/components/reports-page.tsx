'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import { sileo } from 'sileo';
import { useReports, useDeleteReport } from '../hooks/use-reports';
import { ReportCard } from './report-card';
import { ReportGenerator } from './report-generator';
import { ReportViewer } from './report-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FileText } from 'lucide-react';

export function ReportsPage() {
  const { t } = useI18n();
  const { data, isLoading, refetch } = useReports();
  const deleteMutation = useDeleteReport();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

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

  if (selectedReportId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedReportId(null)}
          className="text-sm text-primary hover:underline print:hidden"
        >
          \u2190 {t('reports.backToList')}
        </button>
        <ReportViewer reportId={selectedReportId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportGenerator onGenerated={() => { refetch(); sileo.success({ description: t('reports.created') }); }} />

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
        title={t('reports.deleteConfirm')}
        message={t('reports.deleteConfirmDesc')}
        onConfirm={handleDelete}
        onCancel={() => setReportToDelete(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
