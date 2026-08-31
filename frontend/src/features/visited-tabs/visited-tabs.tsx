'use client';

import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useTabsStore } from '@/stores/tabs-store';
import { LayoutDashboard } from 'lucide-react';
import { usePosNavLock, isPosSafePath } from '@/lib/sync/hooks/use-pos-nav-lock';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VisitedTabsProps {
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  tabs?: { path: string; key: string }[];
}

export function VisitedTabs({ iconMap, tabs: propTabs }: VisitedTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const storeTabs = useTabsStore((s) => s.tabs);
  const removeTab = useTabsStore((s) => s.removeTab);
  const tabs = propTabs ?? storeTabs;
  const { lockNav } = usePosNavLock();
  const lockMessage = t('sync.posNavLocked');

  if (tabs.length === 0) return null;

  const goTo = (tabPath: string) => {
    if (lockNav && !isPosSafePath(tabPath)) return;
    router.push(tabPath);
  };

  const handleClose = (e: React.MouseEvent, tabPath: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (lockNav && isPosSafePath(pathname) && isPosSafePath(tabPath)) {
      return;
    }
    removeTab(tabPath);
    if (pathname === tabPath || pathname.startsWith(tabPath)) {
      const remaining = useTabsStore.getState().tabs.filter((t) => t.path !== tabPath);
      if (remaining.length > 0) {
        router.push(remaining[remaining.length - 1].path);
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="overflow-x-auto py-2 px-1 -mx-1">
      <div className="flex items-center gap-2 min-w-min">
      {tabs.map((tab) => {
        const active = pathname === tab.path || (tab.path !== '/dashboard' && pathname.startsWith(tab.path));
        const Icon = iconMap[tab.key] || LayoutDashboard;
        const tabLocked = lockNav && !isPosSafePath(tab.path);
        const tabEl = (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={tabLocked}
            onClick={() => goTo(tab.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goTo(tab.path);
              }
            }}
            className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl shrink-0 transition-all ${
              tabLocked
                ? 'cursor-not-allowed opacity-50 text-[#5a6578]'
                : active
                ? 'neo-nav-active text-[#3e93c1] font-medium cursor-pointer'
                : 'text-[#5a6578] hover:text-[#1a2332] cursor-pointer'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[120px]">{t(`nav.${tab.key}`)}</span>
            <button
              type="button"
              onClick={(e) => handleClose(e, tab.path)}
              className="ml-0.5 rounded-sm opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
              aria-label={`${t('common.close')} ${t(`nav.${tab.key}`)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
        if (!tabLocked) {
          return <div key={tab.path}>{tabEl}</div>;
        }
        return (
          <Tooltip key={tab.path}>
            <TooltipTrigger asChild>{tabEl}</TooltipTrigger>
            <TooltipContent>{lockMessage}</TooltipContent>
          </Tooltip>
        );
      })}
      </div>
    </div>
  );
}
