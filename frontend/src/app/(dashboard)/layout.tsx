'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { navigationConfig } from '@/config/navigation.config';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { UserNav } from '@/components/ui/user-nav';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, UserCog, Truck, Building2, Package, Receipt, Tags, Store, ShoppingCart, ArrowLeftRight, ShieldCheck, Settings } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  users: Users,
  customers: UserCog,
  suppliers: Truck,
  companies: Building2,
  products: Package,
  taxes: Receipt,
  batches: Tags,
  stocks: Store,
  purchaseOrders: ShoppingCart,
  foreignExchanges: ArrowLeftRight,
  roles: ShieldCheck,
  settings: Settings,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, tp } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) return null;

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  const userRole = user?.role?.slug || 'employee';
  const visibleNavItems = navigationConfig.filter(
    (item) => item.roles.includes(userRole),
  );

  const currentPage = navigationConfig.find((item) => pathname.startsWith(item.path));
  const pageTitle = currentPage ? t(`nav.${currentPage.key}`) : '';
  const showWelcome = pathname === '/dashboard';

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-6">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {sidebarOpen ? (
              <div>
                <h2 className="text-lg font-bold text-foreground">GLAdmin</h2>
                <p className="text-xs text-muted-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            ) : (
              <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-primary" />
            )}
            <nav className="mt-6 flex flex-col gap-1">
              {visibleNavItems.map((item) => {
                const Icon = iconMap[item.key] || LayoutDashboard;
                return (
                  <SidebarLink
                    key={item.path}
                    link={{
                      label: t(`nav.${item.key}`),
                      href: item.path,
                      icon: <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />,
                    }}
                    className={pathname.startsWith(item.path) ? 'bg-secondary text-secondary-foreground rounded-md' : ''}
                  />
                );
              })}
            </nav>
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 md:px-8 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
            {showWelcome && (
              <p className="text-sm text-muted-foreground hidden sm:block">
                {tp('dashboard.welcome', { name: `${user?.firstName} ${user?.lastName}` })}
              </p>
            )}
          </div>
          <UserNav />
        </div>
        <div className="px-6 md:px-8 pt-4 pb-4 shrink-0">
          <Breadcrumb />
        </div>
        <div className="flex-1 overflow-hidden px-6 md:px-8 pb-6 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
