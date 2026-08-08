import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { ROLE_LEVEL } from '../../common/decorators/min-level.decorator';
import { SaleStatus } from '../../common/types/statuses';
import { DashboardEventsService } from './dashboard-events.service';
import {
  DASHBOARD_TZ,
  addDaysYmd,
  dayRange,
  localYmd,
  pctChange,
} from './dashboard-day.util';

export const LOW_STOCK_THRESHOLD = 5;

export interface ProductWithExistence {
  id: string;
  name: string;
  price: number;
  existence: number;
}

interface TopSupplier {
  id: string;
  companyName: string;
  _count: { purchaseOrders: number };
}

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

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
    private readonly events: DashboardEventsService,
  ) {}

  private getOrgId(): string {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return orgId;
  }

  private getOrgRole(): string | undefined {
    return this.contextService?.getCurrent()?.orgRole;
  }

  private canSeeArAp(orgRole?: string): boolean {
    const level = ROLE_LEVEL[orgRole as keyof typeof ROLE_LEVEL] ?? 0;
    return level >= ROLE_LEVEL.manager;
  }

  async getOverview() {
    const orgId = this.getOrgId();
    const includeArAp = this.canSeeArAp(this.getOrgRole());

    const [kpis, recentSales, stockAlerts, arAp] = await Promise.all([
      this.computeKpis(orgId),
      this.getRecentSales(orgId, 20),
      this.getStockAlerts(orgId),
      includeArAp ? this.getArApSummary(orgId) : Promise.resolve(null),
    ]);

    return {
      data: {
        connection: { timezone: DASHBOARD_TZ },
        kpis,
        recentSales,
        stockAlerts,
        ...(includeArAp ? { arAp } : {}),
      },
      message: null,
    };
  }

  async computeKpis(orgId: string): Promise<DashboardKpis> {
    const todayYmd = localYmd();
    const yesterdayYmd = addDaysYmd(todayYmd, -1);
    const today = dayRange(todayYmd);
    const yesterday = dayRange(yesterdayYmd);

    const [todayAgg, yesterdayAgg, lowStockCount] = await Promise.all([
      this.aggregateSales(orgId, today.start, today.end),
      this.aggregateSales(orgId, yesterday.start, yesterday.end),
      this.prisma.product.count({
        where: {
          organizationId: orgId,
          available: true,
          totalExistence: { lte: LOW_STOCK_THRESHOLD },
        },
      }),
    ]);

    const avgTicket =
      todayAgg.count === 0 ? 0 : todayAgg.revenue / todayAgg.count;
    const yesterdayAvg =
      yesterdayAgg.count === 0 ? 0 : yesterdayAgg.revenue / yesterdayAgg.count;

    return {
      todaySalesCount: todayAgg.count,
      todayRevenue: todayAgg.revenue,
      avgTicket,
      lowStockCount,
      vsYesterday: {
        salesCount: pctChange(todayAgg.count, yesterdayAgg.count),
        revenue: pctChange(todayAgg.revenue, yesterdayAgg.revenue),
        avgTicket: pctChange(avgTicket, yesterdayAvg),
      },
    };
  }

  private async aggregateSales(
    orgId: string,
    start: Date,
    end: Date,
  ): Promise<{ count: number; revenue: number }> {
    const rows = await this.prisma.sale.aggregate({
      where: {
        organizationId: orgId,
        status: { not: SaleStatus.ANNULLED },
        date: { gte: start, lt: end },
      },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return {
      count: rows._count._all,
      revenue: Number(rows._sum.amount ?? 0),
    };
  }

  private async getRecentSales(
    orgId: string,
    take: number,
  ): Promise<DashboardSaleFeedItem[]> {
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId: orgId,
        status: { not: SaleStatus.ANNULLED },
      },
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        amount: true,
        createdAt: true,
        customer: { select: { firstName: true, lastName: true } },
      },
    });
    return sales.map((s) => this.toFeedItem(s));
  }

  toFeedItem(sale: {
    id: string;
    code: string | null;
    amount: Prisma.Decimal | number | null;
    createdAt: Date;
    customer?: { firstName: string; lastName: string } | null;
  }): DashboardSaleFeedItem {
    return {
      id: sale.id,
      code: sale.code,
      amount: Number(sale.amount ?? 0),
      customerName: sale.customer
        ? `${sale.customer.firstName} ${sale.customer.lastName}`
        : '—',
      createdAt: sale.createdAt.toISOString(),
    };
  }

  private async getStockAlerts(orgId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        organizationId: orgId,
        available: true,
        totalExistence: { lte: LOW_STOCK_THRESHOLD },
      },
      select: { id: true, name: true, totalExistence: true },
      orderBy: { totalExistence: 'asc' },
      take: 10,
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      totalExistence: p.totalExistence,
    }));
  }

  private async getArApSummary(orgId: string) {
    const todayStart = dayRange(localYmd()).start;
    const in7 = new Date(todayStart.getTime() + 7 * 86_400_000);

    const [receivables, payables] = await Promise.all([
      this.prisma.accountsReceivable.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: { amount: true, credit: true, dueDate: true },
      }),
      this.prisma.accountsPayable.findMany({
        where: { organizationId: orgId, deletedAt: null },
        select: { amount: true, credit: true, dueDate: true },
      }),
    ]);

    let receivableTotal = 0;
    let receivableOverdue = 0;
    for (const r of receivables) {
      const bal = Number(r.amount ?? 0) - Number(r.credit ?? 0);
      if (bal <= 0) continue;
      receivableTotal += bal;
      if (r.dueDate && r.dueDate < todayStart) receivableOverdue += bal;
    }

    let payableTotal = 0;
    let payableDue7d = 0;
    for (const p of payables) {
      const bal = Number(p.amount ?? 0) - Number(p.credit ?? 0);
      if (bal <= 0) continue;
      payableTotal += bal;
      if (p.dueDate && p.dueDate >= todayStart && p.dueDate < in7) {
        payableDue7d += bal;
      }
    }

    return {
      receivableTotal,
      receivableOverdue,
      payableTotal,
      payableDue7d,
    };
  }

  /** Fail-open notify after sale create (sync or HTTP). */
  async notifySaleCreated(
    orgId: string,
    sale: {
      id: string;
      code: string | null;
      amount: Prisma.Decimal | number | null;
      createdAt: Date;
      customer?: { firstName: string; lastName: string } | null;
      details?: { idProduct: string }[];
    },
  ): Promise<void> {
    try {
      this.events.publish(orgId, 'sale.created', this.toFeedItem(sale));
      const kpis = await this.computeKpis(orgId);
      this.events.publish(orgId, 'kpi.patch', kpis);

      const productIds = [
        ...new Set((sale.details ?? []).map((d) => d.idProduct)),
      ];
      if (productIds.length === 0) return;

      const low = await this.prisma.product.findMany({
        where: {
          organizationId: orgId,
          id: { in: productIds },
          available: true,
          totalExistence: { lte: LOW_STOCK_THRESHOLD },
        },
        select: { id: true, name: true, totalExistence: true },
      });
      for (const p of low) {
        this.events.publish(orgId, 'stock.low', {
          id: p.id,
          name: p.name,
          totalExistence: p.totalExistence,
        });
      }
    } catch (err) {
      this.logger.warn(
        `notifySaleCreated failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async getStats() {
    const orgId = this.getOrgId();
    const [customers, suppliers, products, orders, sales] = await Promise.all([
      this.prisma.customer.count({
        where: { available: true, organizationId: orgId },
      }),
      this.prisma.supplier.count({
        where: { available: true, organizationId: orgId },
      }),
      this.prisma.product.count({
        where: { available: true, organizationId: orgId },
      }),
      this.prisma.purchaseOrder.count({ where: { organizationId: orgId } }),
      this.prisma.sale.count({ where: { organizationId: orgId } }),
    ]);

    return {
      data: { customers, suppliers, products, orders, sales },
      message: null,
    };
  }

  async getAnalytics() {
    const orgId = this.getOrgId();
    const [recentOrders, allProducts, topSuppliers, monthlyOrders] =
      await Promise.all([
        this.prisma.purchaseOrder.findMany({
          where: { organizationId: orgId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            date: true,
            amount: true,
            supplier: { select: { companyName: true } },
          },
        }),
        this.prisma.product.findMany({
          where: { available: true, organizationId: orgId },
          select: {
            id: true,
            name: true,
            price: true,
            stocks: { select: { existence: true } },
          },
          take: 200,
        }),
        this.prisma.supplier.findMany({
          where: { available: true, organizationId: orgId },
          select: {
            id: true,
            companyName: true,
            _count: { select: { purchaseOrders: true } },
          },
          orderBy: { purchaseOrders: { _count: 'desc' } },
          take: 5,
        }),
        this.prisma.purchaseOrder.findMany({
          where: { date: { not: null }, organizationId: orgId },
          select: { date: true },
          orderBy: { date: 'desc' },
          take: 100,
        }),
      ]);

    const productsWithExistence: ProductWithExistence[] = allProducts.map(
      (p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        existence: p.stocks.reduce(
          (sum: number, s: { existence: number }) => sum + s.existence,
          0,
        ),
      }),
    );

    productsWithExistence.sort((a, b) => b.existence - a.existence);
    const top5Products = productsWithExistence.slice(0, 5);

    const monthCounts = new Map<string, number>();
    for (const order of monthlyOrders as { date: Date | null }[]) {
      if (!order.date) continue;
      const month = order.date.toISOString().substring(0, 7);
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    }

    const monthlyData = Array.from(monthCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6)
      .reverse();

    return {
      data: {
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          code: o.code,
          date: o.date?.toISOString() ?? null,
          amount: Number(o.amount ?? 0),
          supplierName: o.supplier.companyName,
        })),
        topProducts: top5Products,
        topSuppliers: topSuppliers.map((s: TopSupplier) => ({
          id: s.id,
          companyName: s.companyName,
          orderCount: s._count.purchaseOrders,
        })),
        monthlyOrders: monthlyData,
      },
      message: null,
    };
  }

  async getSalesAnalytics() {
    const orgId = this.getOrgId();

    const [recentSales, allSales] = await Promise.all([
      this.prisma.sale.findMany({
        where: { organizationId: orgId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          date: true,
          amount: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.sale.findMany({
        where: { organizationId: orgId, date: { not: null } },
        select: { date: true, amount: true },
        orderBy: { date: 'desc' },
        take: 100,
      }),
    ]);

    const monthCounts = new Map<string, number>();
    for (const sale of allSales) {
      if (!sale.date) continue;
      const month = sale.date.toISOString().substring(0, 7);
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    }

    const monthlySales = Array.from(monthCounts.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6)
      .reverse();

    const totalSales = allSales.length;
    const totalRevenue = allSales.reduce(
      (sum, s) => sum + Number(s.amount ?? 0),
      0,
    );

    return {
      data: {
        recentSales: recentSales.map((s) => ({
          id: s.id,
          code: s.code,
          date: s.date?.toISOString() ?? null,
          amount: Number(s.amount ?? 0),
          customerName: s.customer
            ? `${s.customer.firstName} ${s.customer.lastName}`
            : '—',
        })),
        monthlySales,
        totalSales,
        totalRevenue,
      },
      message: null,
    };
  }
}
