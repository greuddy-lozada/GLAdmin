'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CardContainer, CardItem } from '@/components/ui/3d-card';
import { Users, Store, Package, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <CardContainer containerClassName="py-2" className="w-full">
      <Card className="p-10">
        <CardContent className="flex items-start gap-6 px-0 pb-8">
          <CardItem translateZ={30} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            {icon}
          </CardItem>
          <div>
            <CardItem translateZ={20}>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardItem>
            <CardItem translateZ={10}>
              <p className="text-4xl font-bold leading-none mt-2">{value.toLocaleString()}</p>
            </CardItem>
          </div>
        </CardContent>
      </Card>
    </CardContainer>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
