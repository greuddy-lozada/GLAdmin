import { useI18n } from '@/i18n';
import type { RecentOrder } from '../models/dashboard-analytics.model';

interface Props {
  orders: RecentOrder[];
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function formatAmount(amount: number | null) {
  if (amount == null) return '—';
  return `$${amount.toFixed(2)}`;
}

export function RecentOrdersPanel({ orders }: Props) {
  const { t } = useI18n();

  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.analytics.noOrders')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">#</th>
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{t('dashboard.analytics.code')}</th>
            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">{t('dashboard.analytics.supplier')}</th>
            <th className="text-right py-2 pr-4 text-muted-foreground font-medium">{t('dashboard.analytics.amount')}</th>
            <th className="text-right py-2 text-muted-foreground font-medium">{t('dashboard.analytics.date')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border/50 last:border-0">
              <td className="py-2.5 pr-4">{order.id}</td>
              <td className="py-2.5 pr-4 font-mono">{order.code ?? '—'}</td>
              <td className="py-2.5 pr-4">{order.supplierName}</td>
              <td className="py-2.5 pr-4 text-right font-medium">{formatAmount(order.amount)}</td>
              <td className="py-2.5 text-right text-muted-foreground">{formatDate(order.date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
