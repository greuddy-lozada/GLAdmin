import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/api-client';
import type { DashboardAnalytics, SalesAnalytics } from '../models/dashboard-analytics.model';

async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const [analyticsRes, salesRes] = await Promise.all([
    apiClient.get('/dashboard/analytics'),
    apiClient.get('/dashboard/sales-analytics'),
  ]);
  return {
    ...analyticsRes.data.data,
    salesAnalytics: salesRes.data.data as SalesAnalytics,
  };
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: fetchDashboardAnalytics,
  });
}
