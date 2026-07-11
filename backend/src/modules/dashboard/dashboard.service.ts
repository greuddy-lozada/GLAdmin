import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';

export interface ProductWithExistence {
  id: number;
  name: string;
  price: number;
  existence: number;
}

interface RecentOrder {
  id: number;
  code: string;
  date: Date;
  amount: number;
  supplier: { companyName: string };
}

interface SaleWithCustomer {
  id: number;
  code: string;
  date: Date;
  amount: number;
  customer: { firstName: string; lastName: string } | null;
}

interface TopSupplier {
  id: number;
  companyName: string;
  _count: { purchaseOrders: number };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  private getOrgId(): number {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return orgId;
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

    interface ProductWithStock {
      id: number;
      name: string;
      price: number;
      stocks: { existence: number }[];
    }

    const productsWithExistence: ProductWithExistence[] = (
      allProducts as ProductWithStock[]
    ).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      existence: p.stocks.reduce(
        (sum: number, s: { existence: number }) => sum + s.existence,
        0,
      ),
    }));

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
        recentOrders: recentOrders.map((o: RecentOrder) => ({
          id: o.id,
          code: o.code,
          date: o.date?.toISOString() ?? null,
          amount: o.amount,
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
    const totalRevenue = allSales.reduce((sum, s) => sum + (s.amount ?? 0), 0);

    return {
      data: {
        recentSales: recentSales.map((s: SaleWithCustomer) => ({
          id: s.id,
          code: s.code,
          date: s.date?.toISOString() ?? null,
          amount: s.amount,
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
