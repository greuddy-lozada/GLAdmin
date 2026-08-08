export interface DashboardKpis {
  todaySalesCount: number;
  todayRevenue: number;
  avgTicket: number;
  lowStockCount: number;
  vsYesterday: {
    salesCount: number | null;
    revenue: number | null;
    avgTicket: number | null;
  };
}

export interface DashboardSaleFeedItem {
  id: string;
  code: string | null;
  amount: number;
  customerName: string;
  createdAt: string;
}

export interface DashboardStockAlert {
  id: string;
  name: string;
  totalExistence: number;
}

export interface DashboardArAp {
  receivableTotal: number;
  receivableOverdue: number;
  payableTotal: number;
  payableDue7d: number;
}

export interface DashboardOverview {
  connection: { timezone: string };
  kpis: DashboardKpis;
  recentSales: DashboardSaleFeedItem[];
  stockAlerts: DashboardStockAlert[];
  arAp?: DashboardArAp;
}

export type DashboardStreamEventType =
  | 'sale.created'
  | 'stock.low'
  | 'kpi.patch'
  | 'heartbeat';

export interface DashboardStreamEnvelope {
  type: DashboardStreamEventType;
  payload: unknown;
  at: string;
}
