import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/api-client';

interface DashboardStats {
  customers: number;
  suppliers: number;
  products: number;
  orders: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get('/dashboard/stats');
  const d = res.data.data;
  return {
    customers: d?.customers ?? 0,
    suppliers: d?.suppliers ?? 0,
    products: d?.products ?? 0,
    orders: d?.orders ?? 0,
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });
}
