'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { navigationGroups, navigationConfig } from '@/config/navigation.config';
import { hasMinLevel } from '@/lib/auth/roles';
import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { UserNav } from '@/components/ui/user-nav';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, UserCog, Truck, Building2, Package, Receipt, Tags, Store, ShoppingCart, DollarSign, FileText, ShieldCheck, Settings, CreditCard, Mail, ArrowLeftRight, Wallet, ChevronDown, ChevronRight } from 'lucide-react';

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
  exchangeRates: DollarSign,
  withholdings: FileText,
  roles: ShieldCheck,
  adminOrganizations: Building2,
  adminUsers: Users,
  adminPlans: CreditCard,
  adminInvites: Mail,
  settings: Settings,
  payments: Wallet,
  transactions: ArrowLeftRight,
  billing: CreditCard,
};

const groupIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  compras: ShoppingCart,
  ventas: UserCog,
  inventario: Package,
  admin: ShieldCheck,
  config: Settings,
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, currentOrg } = useAuth();
  const { t, tp } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (isLoading) return null;

  if (!isAuthenticated) return null;

  const userRole = user?.role?.slug || 'employee';
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasMinLevel(userRole, item.minLevel)),
    }))
    .filter((group) => group.items.length > 0);

  const currentPage = navigationConfig.find((item) => pathname.startsWith(item.path));
  const pageTitle = currentPage ? t(`nav.${currentPage.key}`) : '';
  const showWelcome = pathname === '/dashboard';

  const toggleGroup = (gi: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gi)) next.delete(gi);
      else next.add(gi);
      return next;
    });
  };

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
              {visibleGroups.map((group, gi) => {
                const GroupIcon = group.key ? groupIconMap[group.key] : undefined;
                return (
                <div key={gi}>
                  {group.label && sidebarOpen && (
                    <button
                      onClick={() => toggleGroup(gi)}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-foreground transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {GroupIcon && <GroupIcon className="h-3.5 w-3.5" />}
                        <span>{t(group.label)}</span>
                      </span>
                      {expandedGroups.has(gi) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  {!sidebarOpen && group.label && GroupIcon && (
                    <div className="flex items-center justify-start gap-2 py-2">
                      <GroupIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                  )}
                  {(sidebarOpen && (expandedGroups.has(gi) || !group.label)) && (
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const active = pathname.startsWith(item.path);
                        return group.label ? (
                          <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-2 px-3 pl-9 py-2 text-sm transition-colors ${
                              active
                                ? 'bg-secondary text-secondary-foreground rounded-md font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {t(`nav.${item.key}`)}
                          </Link>
                        ) : (
                          <SidebarLink
                            key={item.path}
                            link={{
                              label: t(`nav.${item.key}`),
                              href: item.path,
                              icon: (() => {
                                const Icon = iconMap[item.key] || LayoutDashboard;
                                return <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />;
                              })(),
                            }}
                            className={active ? 'bg-secondary text-secondary-foreground rounded-md' : ''}
                          />
                        );
                      })}
                    </div>
                  )}
                  {!sidebarOpen && !group.label && (
                    <div className="flex flex-col">
                      {group.items.map((item) => {
                        const Icon = iconMap[item.key] || LayoutDashboard;
                        const active = pathname.startsWith(item.path);
                        return (
                          <SidebarLink
                            key={item.path}
                            link={{
                              label: t(`nav.${item.key}`),
                              href: item.path,
                              icon: <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />,
                            }}
                            className={active ? 'bg-secondary text-secondary-foreground rounded-md' : ''}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                );
              })}
            </nav>
          </div>
          {currentOrg && (
            <div className="border-t pt-3 px-3">
              {sidebarOpen ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">{t('nav.org')}</p>
                  <p className="text-sm font-medium truncate">{currentOrg.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentOrg.slug}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1" title={currentOrg.name}>
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              )}
            </div>
          )}
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden transition-[padding] duration-300" style={{ paddingRight: 'var(--panel-offset, 0px)' }}>
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
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
