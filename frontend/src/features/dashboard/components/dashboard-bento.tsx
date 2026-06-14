import { useI18n } from '@/i18n';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { useDashboardAnalytics } from '../hooks/use-dashboard-analytics';
import { RecentOrdersPanel } from './recent-orders-panel';
import { StockAlertsPanel } from './stock-alerts-panel';
import { SalesTrendsPanel } from './sales-trends-panel';

export function DashboardBento() {
  const { t } = useI18n();
  const { data, isLoading } = useDashboardAnalytics();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <BentoGrid className="h-full">
      <BentoGridItem
        title={t('dashboard.analytics.recentOrders')}
        className="md:col-span-4"
      >
        <RecentOrdersPanel orders={data.recentOrders} />
      </BentoGridItem>
      <BentoGridItem
        title={t('dashboard.analytics.stockAlerts')}
        className="md:col-span-2"
      >
        <StockAlertsPanel />
      </BentoGridItem>
      <BentoGridItem
        title={t('dashboard.analytics.salesTrends')}
        className="md:col-span-2"
      >
        <SalesTrendsPanel
          data={data.salesAnalytics.monthlySales}
          totalSales={data.salesAnalytics.totalSales}
          totalRevenue={data.salesAnalytics.totalRevenue}
        />
      </BentoGridItem>
    </BentoGrid>
  );
}
