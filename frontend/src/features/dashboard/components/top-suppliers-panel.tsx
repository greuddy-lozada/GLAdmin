import { useI18n } from '@/i18n';
import type { TopSupplier } from '../models/dashboard-analytics.model';

interface Props {
  suppliers: TopSupplier[];
}

export function TopSuppliersPanel({ suppliers }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      {suppliers.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 text-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {i + 1}
          </span>
          <span className="truncate">{s.companyName}</span>
          <span className="ml-auto text-muted-foreground">
            {s.orderCount} {t('dashboard.analytics.orders')}
          </span>
        </div>
      ))}
    </div>
  );
}
