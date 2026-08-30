'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardOverview, type StreamStatus } from '../hooks/use-dashboard-overview';
import type {
  DashboardArAp,
  DashboardKpis,
  DashboardSaleFeedItem,
  DashboardStockAlert,
} from '../models/dashboard-overview.model';

function formatMoney(amount: number): string {
  return `Bs. ${amount.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPct(pct: number | null): { text: string; tone: 'up' | 'down' | 'flat' } {
  if (pct === null || Number.isNaN(pct)) return { text: '—', tone: 'flat' };
  const rounded = Math.round(pct * 10) / 10;
  if (rounded > 0) return { text: `${rounded}%`, tone: 'up' };
  if (rounded < 0) return { text: `${Math.abs(rounded)}%`, tone: 'down' };
  return { text: '0%', tone: 'flat' };
}

function relativeTime(
  iso: string,
  tp: (k: string, p: Record<string, string>) => string,
  t: (k: string) => string,
): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t('dashboard.live.justNow');
  if (mins < 60) return tp('dashboard.live.minutesAgo', { n: String(mins) });
  return tp('dashboard.live.hoursAgo', { n: String(Math.floor(mins / 60)) });
}

function LiveDot({ status }: { status: StreamStatus }) {
  const { t } = useI18n();
  const label =
    status === 'live'
      ? t('dashboard.live.connected')
      : status === 'reconnecting' || status === 'connecting'
        ? t('dashboard.live.reconnecting')
        : t('dashboard.live.idle');
  const color =
    status === 'live'
      ? 'bg-emerald-500'
      : status === 'idle'
        ? 'bg-muted-foreground'
        : 'bg-amber-500 animate-pulse';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Delta({ pct }: { pct: number | null }) {
  const { t } = useI18n();
  const { text, tone } = formatPct(pct);
  const cls =
    tone === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${cls}`}>
      <Icon className="h-3 w-3" />
      {text}
      <span className="text-muted-foreground ml-1">{t('dashboard.kpi.vsYesterday')}</span>
    </span>
  );
}

function KpiCell({
  label,
  value,
  delta,
  hint,
  warn,
}: {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <Card className="neo-raised min-w-0 border-0 shadow-none">
      <CardContent className="p-4">
        <p className="text-xs text-[#5a6578] truncate">{label}</p>
        <p className={`text-2xl font-bold mt-1 tracking-tight tabular-nums ${warn ? 'text-destructive' : 'text-[#1a2332]'}`}>
          {value}
        </p>
        {hint !== undefined ? (
          <p className="text-xs text-[#5a6578] mt-1">{hint}</p>
        ) : (
          <div className="mt-1">
            <Delta pct={delta ?? null} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SalesFeed({ sales }: { sales: DashboardSaleFeedItem[] }) {
  const { t, tp } = useI18n();
  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">{t('dashboard.live.emptySales')}</p>
        <Link href="/pos" className="text-xs text-primary hover:underline">
          {t('dashboard.live.goPos')}
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border overflow-y-auto max-h-[320px]">
      {sales.map((s, i) => (
        <li key={s.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
          />
          <span className="font-medium truncate w-20">{s.code ?? '—'}</span>
          <span className="truncate flex-1 text-muted-foreground">{s.customerName}</span>
          <span className="font-semibold tabular-nums">{formatMoney(s.amount)}</span>
          <span className="text-xs text-muted-foreground w-14 text-right shrink-0">
            {relativeTime(s.createdAt, tp, t)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StockPanel({ alerts }: { alerts: DashboardStockAlert[] }) {
  const { t } = useI18n();
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">{t('dashboard.analytics.stockAlertNone')}</p>
    );
  }
  return (
    <ul className="space-y-2 overflow-y-auto max-h-[280px]">
      {alerts.map((a) => (
        <li key={a.id} className="flex items-center gap-2 text-sm">
          <AlertTriangle
            className={`h-4 w-4 shrink-0 ${a.totalExistence <= 0 ? 'text-destructive' : 'text-amber-500'}`}
          />
          <span className="truncate flex-1">{a.name}</span>
          <span
            className={`font-medium tabular-nums ${a.totalExistence <= 0 ? 'text-destructive' : ''}`}
          >
            {a.totalExistence}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ArApPanel({ arAp }: { arAp: DashboardArAp }) {
  const { t } = useI18n();
  const rows = [
    { label: t('dashboard.arap.receivable'), value: formatMoney(arAp.receivableTotal) },
    {
      label: t('dashboard.arap.receivableOverdue'),
      value: formatMoney(arAp.receivableOverdue),
      danger: arAp.receivableOverdue > 0,
    },
    { label: t('dashboard.arap.payable'), value: formatMoney(arAp.payableTotal) },
    { label: t('dashboard.arap.payableDue7d'), value: formatMoney(arAp.payableDue7d) },
  ];
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="flex justify-between text-sm gap-3">
          <span className={r.danger ? 'text-destructive' : 'text-muted-foreground'}>{r.label}</span>
          <span className={`font-medium tabular-nums ${r.danger ? 'text-destructive' : ''}`}>
            {r.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Row1Kpis({ kpis, streamStatus }: { kpis: DashboardKpis; streamStatus: StreamStatus }) {
  const { t } = useI18n();
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-end">
        <LiveDot status={streamStatus} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCell
          label={t('dashboard.kpi.salesToday')}
          value={kpis.todaySalesCount.toLocaleString('es-VE')}
          delta={kpis.vsYesterday.salesCount}
        />
        <KpiCell
          label={t('dashboard.kpi.revenueToday')}
          value={formatMoney(kpis.todayRevenue)}
          delta={kpis.vsYesterday.revenue}
        />
        <KpiCell
          label={t('dashboard.kpi.avgTicket')}
          value={formatMoney(kpis.avgTicket)}
          delta={kpis.vsYesterday.avgTicket}
        />
        <KpiCell
          label={t('dashboard.kpi.lowStock')}
          value={String(kpis.lowStockCount)}
          hint={t('dashboard.kpi.products')}
          warn={kpis.lowStockCount > 0}
        />
      </div>
    </section>
  );
}

function Row2Panels({
  sales,
  alerts,
  arAp,
}: {
  sales: DashboardSaleFeedItem[];
  alerts: DashboardStockAlert[];
  arAp?: DashboardArAp;
}) {
  const { t } = useI18n();
  const cols = arAp ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <section className={`grid grid-cols-1 ${cols} gap-4 min-h-0`}>
      <Card className="neo-raised min-h-0 border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-[#3e93c1]" />
            <h3 className="text-sm font-semibold text-[#1a2332]">{t('dashboard.live.salesFeed')}</h3>
          </div>
          <SalesFeed sales={sales} />
        </CardContent>
      </Card>

      <Card className="neo-raised min-h-0 border-0 shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[#3e93c1]" />
            <h3 className="text-sm font-semibold text-[#1a2332]">{t('dashboard.analytics.stockAlerts')}</h3>
          </div>
          <StockPanel alerts={alerts} />
        </CardContent>
      </Card>

      {arAp && (
        <Card className="neo-raised min-h-0 border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-4 w-4 text-[#3e93c1]" />
              <h3 className="text-sm font-semibold text-[#1a2332]">{t('dashboard.arap.title')}</h3>
            </div>
            <ArApPanel arAp={arAp} />
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export function LiveDashboard() {
  const { data, isLoading, streamStatus } = useDashboardOverview();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <Row1Kpis kpis={data.kpis} streamStatus={streamStatus} />
      <Row2Panels sales={data.recentSales} alerts={data.stockAlerts} arAp={data.arAp} />
    </div>
  );
}
