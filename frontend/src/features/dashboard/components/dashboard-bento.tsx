import { useI18n } from '@/i18n';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { useDashboardAnalytics } from '../hooks/use-dashboard-analytics';
import { RecentOrdersPanel } from './recent-orders-panel';
import { TopProductsPanel } from './top-products-panel';
import { StockAlertsPanel } from './stock-alerts-panel';
import { TopSuppliersPanel } from './top-suppliers-panel';
import { MonthlyTrendsPanel } from './monthly-trends-panel';

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
    <BentoGrid>
      <BentoGridItem
        title={t('dashboard.analytics.recentOrders')}
        className="md:col-span-3"
      >
        <RecentOrdersPanel orders={data.recentOrders} />
      </BentoGridItem>
      <BentoGridItem
        title={t('dashboard.analytics.topProducts')}
        className="md:col-span-2"
      >
        <TopProductsPanel products={data.topProducts} />
      </BentoGridItem>
      <BentoGridItem
        title={t('dashboard.analytics.stockAlerts')}
        className="md:col-span-1"
      >
        <StockAlertsPanel alerts={data.stockAlerts} />
      </BentoGridItem>
      <BentoGridItem
        title={t('dashboard.analytics.topSuppliers')}
        className="md:col-span-1"
      >
        <TopSuppliersPanel suppliers={data.topSuppliers} />
      </BentoGridItem>
      <BentoGridItem
        title={t('dashboard.analytics.monthlyTrends')}
        className="md:col-span-2"
      >
        <MonthlyTrendsPanel data={data.monthlyOrders} />
      </BentoGridItem>
    </BentoGrid>
  );
}
