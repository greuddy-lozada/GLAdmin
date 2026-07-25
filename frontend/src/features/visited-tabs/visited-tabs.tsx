'use client';

import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useTabsStore } from '@/stores/tabs-store';
import { LayoutDashboard } from 'lucide-react';

interface VisitedTabsProps {
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
}

export function VisitedTabs({ iconMap }: VisitedTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const tabs = useTabsStore((s) => s.tabs);
  const removeTab = useTabsStore((s) => s.removeTab);

  if (tabs.length === 0) return null;

  const handleClose = (e: React.MouseEvent, tabPath: string) => {
    e.stopPropagation();
    e.preventDefault();
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
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.path || (tab.path !== '/dashboard' && pathname.startsWith(tab.path));
        const Icon = iconMap[tab.key] || LayoutDashboard;
        return (
          <div
            key={tab.path}
            role="button"
            tabIndex={0}
            onClick={() => router.push(tab.path)}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(tab.path); }}
            className={`group flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md cursor-pointer shrink-0 transition-colors ${
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[120px]">{t(`nav.${tab.key}`)}</span>
            <button
              type="button"
              onClick={(e) => handleClose(e, tab.path)}
              className="ml-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
              aria-label={`Cerrar ${t(`nav.${tab.key}`)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
