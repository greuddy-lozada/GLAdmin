import { useI18n } from '@/i18n';
import { AlertTriangle } from 'lucide-react';
import type { StockAlert } from '../models/dashboard-analytics.model';

interface Props {
  alerts: StockAlert[];
}

export function StockAlertsPanel({ alerts }: Props) {
  const { t } = useI18n();

  if (alerts.length === 0) {
    return <span className="text-sm text-muted-foreground">{t('dashboard.analytics.stockAlertNone')}</span>;
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="truncate">{a.name}</span>
          <span className="ml-auto font-medium text-destructive">{a.existence}</span>
        </div>
      ))}
    </div>
  );
}
