import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/api-client';
import type { DashboardAnalytics } from '../models/dashboard-analytics.model';

async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const res = await apiClient.get('/dashboard/analytics');
  return res.data.data as DashboardAnalytics;
}

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: fetchDashboardAnalytics,
  });
}
