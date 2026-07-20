'use client';

import { ReactNode, useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useUiStore } from '@/stores/ui-store';
import { navigationGroups, navigationConfig } from '@/config/navigation.config';
import { hasMinLevel } from '@/lib/auth/roles';
import { parsePlanFeatures } from '@/lib/parse-features';

import { useI18n } from '@/i18n';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { UserNav } from '@/components/ui/user-nav';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { SyncIndicator } from '@/components/sync-indicator';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { OrgSwitcher } from '@/components/ui/org-switcher';
import { LayoutDashboard, Users, UserCog, Truck, Building2, Package, Receipt, Tags, Store, ShoppingCart, DollarSign, ShieldCheck, Settings, CreditCard, Mail, ArrowLeftRight, Wallet, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

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
  roles: ShieldCheck,
  adminOrganizations: Building2,
  adminUsers: Users,
  adminPlans: CreditCard,
  adminInvites: Mail,
  settings: Settings,
  payments: Wallet,
  transactions: ArrowLeftRight,
  billing: CreditCard,
  syncConflicts: AlertCircle,
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
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const setLastVisitedPath = useUiStore(s => s.setLastVisitedPath);
  useEffect(() => {
    if (isAuthenticated && pathname) {
      setLastVisitedPath(pathname);
    }
  }, [isAuthenticated, pathname, setLastVisitedPath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const userRole = user?.role?.slug || 'employee';
  const userFeatures = parsePlanFeatures(currentOrg?.plan?.features);

  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: userRole === 'master'
        ? group.items
        : group.items.filter(
            (item) =>
              hasMinLevel(userRole, item.minLevel) &&
              (!item.requiredFeature || userFeatures.includes(item.requiredFeature)),
          ),
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
            <div className="relative h-[44px] flex items-center">
              <div className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <h2 className="text-lg font-bold text-foreground">Cuadra</h2>
                <p className="text-xs text-muted-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div className={`absolute inset-0 flex items-center transition-all duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-primary" />
              </div>
            </div>
            <nav className="mt-6 flex flex-col gap-1 overflow-hidden">
              {visibleGroups.map((group, gi) => {
                const GroupIcon = group.key ? groupIconMap[group.key] : undefined;
                return (
                <div key={group.key} className="relative">
                  {group.label && (
                    <div className="relative h-[36px]">
                      <button
                        type="button"
                        onClick={() => toggleGroup(gi)}
                        className={`group/sidebar absolute inset-0 flex w-full items-center justify-between pl-1 pr-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-foreground transition-colors overflow-hidden ${
                          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {GroupIcon && <GroupIcon className="h-5 w-5 shrink-0" />}
                          <span className="group-hover/sidebar:translate-x-1 transition duration-150">{t(group.label)}</span>
                        </span>
                        {expandedGroups.has(gi) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      {GroupIcon && (
                        <div className={`absolute inset-0 flex items-center gap-2 py-2 pl-1 transition-all duration-300 ${
                          sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}>
                          <GroupIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}
                  {group.label ? (
                    expandedGroups.has(gi) && (
                      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                        sidebarOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                      }`}>
                        <div className="flex flex-col gap-0.5 overflow-hidden min-h-0">
                        {group.items.map((item) => {
                          const active = pathname.startsWith(item.path);
                          return (
                            <Link
                              key={item.path}
                              href={item.path}
                              className={`flex items-center gap-2 pl-1 pr-3 py-2 text-sm transition-colors overflow-hidden group/sidebar ${
                                active
                                  ? 'bg-secondary text-secondary-foreground rounded-md font-medium'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {(() => { const Icon = iconMap[item.key] || LayoutDashboard; return <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />; })()}
                              <span className="group-hover/sidebar:translate-x-1 transition duration-150">{t(`nav.${item.key}`)}</span>
                            </Link>
                          );
                        })}
                        </div>
                      </div>
                    )
                  ) : (
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
                            className={active
                              ? 'bg-secondary text-secondary-foreground rounded-md font-medium'
                              : 'text-muted-foreground hover:text-foreground transition-colors'}
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
            <div className="border-t border-border/50 pt-3 px-3 relative min-h-[44px]">
              <div className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <OrgSwitcher />
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} title={currentOrg.name}>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground border border-border/50">
                  {currentOrg.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 flex flex-col overflow-hidden transition-[padding] duration-300" style={{ paddingRight: 'var(--panel-offset, 0px)' }}>
        <div className="flex items-center justify-between px-6 md:px-8 py-3 border-b border-border bg-card shrink-0 relative">
          <div className="absolute bottom-[-0.75rem] left-[-0.75rem] w-3 h-3 bg-background rounded-tr-xl z-10 pointer-events-none" />
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
            {showWelcome && (
              <p className="text-sm text-muted-foreground hidden sm:block">
                {tp('dashboard.welcome', { name: `${user?.firstName} ${user?.lastName}` })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <SyncIndicator />
            <UserNav />
          </div>
        </div>
        <div className="px-6 md:px-8 pt-4 pb-4 shrink-0">
          <Breadcrumb />
        </div>
        <div className="flex-1 overflow-hidden px-6 md:px-8 pb-6 md:pb-8">
          <div className="w-full h-full">
            <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-muted-foreground">{t('common.loading')}</p></div>}>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
