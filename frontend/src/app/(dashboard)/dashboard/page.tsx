'use client';

import { useAuth } from '@/providers/auth-provider';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { CardContainer } from '@/components/ui/3d-card';
import { Users, Store, Package, ShoppingCart } from 'lucide-react';

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <CardContainer className="w-full">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: color }}>
            <div className="text-white">{icon}</div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </CardContent>
      </Card>
    </CardContainer>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{t('dashboard.title')}</h1>
      <p className="text-muted-foreground mb-6">
        Bienvenido, {user?.firstName} {user?.lastName}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-6 w-6" />} label={t('dashboard.totalCustomers')} value="—" color="#1976d2" />
        <StatCard icon={<Store className="h-6 w-6" />} label={t('dashboard.totalSuppliers')} value="—" color="#388e3c" />
        <StatCard icon={<Package className="h-6 w-6" />} label={t('dashboard.totalProducts')} value="—" color="#f57c00" />
        <StatCard icon={<ShoppingCart className="h-6 w-6" />} label="Pedidos" value="—" color="#d32f2f" />
      </div>
    </div>
  );
}
