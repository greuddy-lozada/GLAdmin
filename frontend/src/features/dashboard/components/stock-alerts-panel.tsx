import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { stockService } from '@/features/stocks/services/stock.service';

export function StockAlertsPanel() {
  const { t } = useI18n();
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => stockService.getAlerts(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!alerts || alerts.length === 0) {
    return <span className="text-sm text-muted-foreground">{t('dashboard.analytics.stockAlertNone')}</span>;
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="truncate">{a.name}</span>
          <span className="ml-auto font-medium text-destructive">{a.totalExistence}</span>
        </div>
      ))}
    </div>
  );
}
