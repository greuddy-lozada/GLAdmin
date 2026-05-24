import { useI18n } from '@/i18n';
import type { MonthlyOrder } from '../models/dashboard-analytics.model';

interface Props {
  data: MonthlyOrder[];
}

function formatMonth(month: string | null) {
  if (!month) return '—';
  const [y, m] = month.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function MonthlyTrendsPanel({ data }: Props) {
  const { t } = useI18n();
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.analytics.noOrders')}</p>;
  }

  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-medium">{d.count}</span>
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(d.count / maxCount) * 100}%`,
              minHeight: '4px',
              backgroundColor: 'var(--color-card-1)',
            }}
          />
          <span className="text-[10px] text-muted-foreground">{formatMonth(d.month)}</span>
        </div>
      ))}
    </div>
  );
}
