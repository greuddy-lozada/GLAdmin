export interface RecentOrder {
  id: number;
  code: string | null;
  date: string | null;
  amount: number | null;
  supplierName: string;
}

export interface RecentSale {
  id: number;
  code: string | null;
  date: string | null;
  amount: number | null;
  customerName: string;
}

export interface MonthlySale {
  month: string;
  count: number;
}

export interface SalesAnalytics {
  recentSales: RecentSale[];
  monthlySales: MonthlySale[];
  totalSales: number;
  totalRevenue: number;
}

export interface DashboardAnalytics {
  recentOrders: RecentOrder[];
  salesAnalytics: SalesAnalytics;
}
