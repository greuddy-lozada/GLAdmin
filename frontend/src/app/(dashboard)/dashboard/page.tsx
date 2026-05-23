'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Store, Package, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold mt-0.5">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="h-6 w-6 text-primary" />}
          label={t('dashboard.totalCustomers')}
          value={isLoading ? 0 : stats?.customers ?? 0}
        />
        <StatCard
          icon={<Store className="h-6 w-6 text-primary" />}
          label={t('dashboard.totalSuppliers')}
          value={isLoading ? 0 : stats?.suppliers ?? 0}
        />
        <StatCard
          icon={<Package className="h-6 w-6 text-primary" />}
          label={t('dashboard.totalProducts')}
          value={isLoading ? 0 : stats?.products ?? 0}
        />
        <StatCard
          icon={<ShoppingCart className="h-6 w-6 text-primary" />}
          label={t('dashboard.totalOrders')}
          value={isLoading ? 0 : stats?.orders ?? 0}
        />
      </div>
      {isLoading && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          {t('common.loading')}
        </p>
      )}
    </div>
  );
}
