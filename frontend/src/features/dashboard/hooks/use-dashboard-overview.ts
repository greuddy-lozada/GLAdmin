'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import type {
  DashboardKpis,
  DashboardOverview,
  DashboardSaleFeedItem,
  DashboardStockAlert,
  DashboardStreamEnvelope,
} from '../models/dashboard-overview.model';

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'idle';

const OVERVIEW_KEY = ['dashboard-overview'] as const;

function upsertSale(
  list: DashboardSaleFeedItem[],
  item: DashboardSaleFeedItem,
): DashboardSaleFeedItem[] {
  const without = list.filter((s) => s.id !== item.id);
  return [item, ...without].slice(0, 20);
}

function upsertAlert(
  list: DashboardStockAlert[],
  item: DashboardStockAlert,
): DashboardStockAlert[] {
  const without = list.filter((a) => a.id !== item.id);
  return [item, ...without]
    .sort((a, b) => a.totalExistence - b.totalExistence)
    .slice(0, 10);
}

function applyEvent(
  prev: DashboardOverview,
  event: DashboardStreamEnvelope,
): DashboardOverview {
  switch (event.type) {
    case 'sale.created':
      return {
        ...prev,
        recentSales: upsertSale(
          prev.recentSales,
          event.payload as DashboardSaleFeedItem,
        ),
      };
    case 'stock.low':
      return {
        ...prev,
        stockAlerts: upsertAlert(
          prev.stockAlerts,
          event.payload as DashboardStockAlert,
        ),
      };
    case 'kpi.patch':
      return {
        ...prev,
        kpis: { ...prev.kpis, ...(event.payload as DashboardKpis) },
      };
    default:
      return prev;
  }
}

export function useDashboardOverview() {
  const queryClient = useQueryClient();
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const retryRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const query = useQuery({
    queryKey: OVERVIEW_KEY,
    queryFn: () => dashboardService.getOverview(),
  });

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      if (cancelled) return;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setStreamStatus(retryRef.current > 0 ? 'reconnecting' : 'connecting');

      try {
        const stream = dashboardService.stream(ac.signal);
        setStreamStatus('live');
        retryRef.current = 0;

        for await (const event of stream) {
          if (cancelled) break;
          if (event.type === 'heartbeat') continue;
          queryClient.setQueryData<DashboardOverview>(OVERVIEW_KEY, (prev) =>
            prev ? applyEvent(prev, event) : prev,
          );
        }

        if (!cancelled && !ac.signal.aborted) {
          throw new Error('Stream ended');
        }
      } catch {
        if (cancelled || ac.signal.aborted) return;
        setStreamStatus('reconnecting');
        retryRef.current += 1;
        const delay = Math.min(1000 * 2 ** Math.min(retryRef.current, 4), 16_000);
        await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;
        await queryClient.invalidateQueries({ queryKey: OVERVIEW_KEY });
        void connect();
      }
    };

    void connect();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      setStreamStatus('idle');
    };
  }, [queryClient]);

  return { ...query, streamStatus };
}
