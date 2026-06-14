import { useI18n } from '@/i18n';
import type { MonthlySale } from '../models/dashboard-analytics.model';

interface Props {
  data: MonthlySale[];
  totalSales: number;
  totalRevenue: number;
}

function formatMonth(month: string | null) {
  if (!month) return '—';
  const [y, m] = month.split('-');
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function SalesTrendsPanel({ data, totalSales, totalRevenue }: Props) {
  const { t } = useI18n();
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">{t('dashboard.analytics.totalSales')}: </span>
          <span className="font-medium">{totalSales}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t('dashboard.analytics.totalRevenue')}: </span>
          <span className="font-medium">Bs. {totalRevenue.toFixed(2)}</span>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('dashboard.analytics.noSales')}</p>
      ) : (
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
      )}
    </div>
  );
}
