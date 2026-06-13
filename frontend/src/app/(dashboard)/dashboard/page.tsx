'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Store, Package, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { DashboardBento } from '@/features/dashboard/components/dashboard-bento';

const cardStyles = [
  { bg: 'var(--color-card-1)', fg: 'var(--color-card-1-foreground)' },
  { bg: 'var(--color-card-2)', fg: 'var(--color-card-2-foreground)' },
  { bg: 'var(--color-card-3)', fg: 'var(--color-card-3-foreground)' },
  { bg: 'var(--color-card-4)', fg: 'var(--color-card-4-foreground)' },
];

function StatCard({ icon, label, value, style }: { icon: React.ReactNode; label: string; value: number; style: { bg: string; fg: string } }) {
  return (
    <Card style={{ backgroundColor: style.bg }}>
      <CardContent className="flex items-center gap-3 p-2" style={{ color: style.fg }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs truncate" style={{ opacity: 0.8 }}>{label}</p>
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
    <div className="flex flex-col h-full gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-none">
        <StatCard
          icon={<Users className="h-6 w-6" style={{ color: cardStyles[0].fg }} />}
          label={t('dashboard.totalCustomers')}
          value={isLoading ? 0 : stats?.customers ?? 0}
          style={cardStyles[0]}
        />
        <StatCard
          icon={<Store className="h-6 w-6" style={{ color: cardStyles[1].fg }} />}
          label={t('dashboard.totalSuppliers')}
          value={isLoading ? 0 : stats?.suppliers ?? 0}
          style={cardStyles[1]}
        />
        <StatCard
          icon={<Package className="h-6 w-6" style={{ color: cardStyles[2].fg }} />}
          label={t('dashboard.totalProducts')}
          value={isLoading ? 0 : stats?.products ?? 0}
          style={cardStyles[2]}
        />
        <StatCard
          icon={<ShoppingCart className="h-6 w-6" style={{ color: cardStyles[3].fg }} />}
          label={t('dashboard.totalOrders')}
          value={isLoading ? 0 : stats?.orders ?? 0}
          style={cardStyles[3]}
        />
      </div>
      <div className="flex-1 min-h-0">
        <DashboardBento />
      </div>
    </div>
  );
}
