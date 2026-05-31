import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

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

interface TopSupplier {
  id: number;
  companyName: string;
  _count: { purchaseOrders: number };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [customers, suppliers, products, orders] = await Promise.all([
      this.prisma.customer.count({ where: { available: true } }),
      this.prisma.supplier.count({ where: { available: true } }),
      this.prisma.product.count({ where: { available: true } }),
      this.prisma.purchaseOrder.count(),
    ]);

    return { data: { customers, suppliers, products, orders }, message: null };
  }

  async getAnalytics() {
    const [recentOrders, allProducts, topSuppliers, monthlyOrders] =
      await Promise.all([
        this.prisma.purchaseOrder.findMany({
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
          where: { available: true },
          select: {
            id: true,
            name: true,
            price: true,
            stocks: { select: { existence: true } },
          },
        }),
        this.prisma.supplier.findMany({
          where: { available: true },
          select: {
            id: true,
            companyName: true,
            _count: { select: { purchaseOrders: true } },
          },
          orderBy: { purchaseOrders: { _count: 'desc' } },
          take: 5,
        }),
        this.prisma.purchaseOrder.findMany({
          where: { date: { not: null } },
          select: { date: true },
          orderBy: { date: 'desc' },
          take: 500,
        }),
      ]);

    interface ProductWithStock {
  id: number;
  name: string;
  price: number;
  stocks: { existence: number }[];
}

const productsWithExistence: ProductWithExistence[] = (allProducts as ProductWithStock[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      existence: p.stocks.reduce((sum: number, s: { existence: number }) => sum + s.existence, 0),
    }));

    productsWithExistence.sort((a, b) => b.existence - a.existence);
    const top5Products = productsWithExistence.slice(0, 5);

    const alerts = productsWithExistence
      .filter((p) => p.existence <= 5)
      .sort((a, b) => a.existence - b.existence)
      .slice(0, 5);

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
        stockAlerts: alerts,
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
}
