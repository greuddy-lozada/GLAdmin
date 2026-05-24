export interface RecentOrder {
  id: number;
  code: string | null;
  date: string | null;
  amount: number | null;
  supplierName: string;
}

export interface TopProduct {
  id: number;
  name: string;
  price: number;
  existence: number;
}

export interface StockAlert {
  id: number;
  name: string;
  price: number;
  existence: number;
}

export interface TopSupplier {
  id: number;
  companyName: string;
  orderCount: number;
}

export interface MonthlyOrder {
  month: string;
  count: number;
}

export interface DashboardAnalytics {
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
  stockAlerts: StockAlert[];
  topSuppliers: TopSupplier[];
  monthlyOrders: MonthlyOrder[];
}
