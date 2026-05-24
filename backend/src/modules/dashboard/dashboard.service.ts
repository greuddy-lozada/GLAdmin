import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

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
        this.prisma.$queryRawUnsafe<{ month: string | null; count: bigint }[]>(
          "SELECT strftime('%Y-%m', date) as month, COUNT(*) as count FROM PurchaseOrder WHERE date IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 6",
        ),
      ]);

    const productsWithExistence = allProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      existence: p.stocks.reduce((sum, s) => sum + s.existence, 0),
    }));

    productsWithExistence.sort((a, b) => b.existence - a.existence);
    const top5Products = productsWithExistence.slice(0, 5);

    const alerts = productsWithExistence
      .filter((p) => p.existence <= 5)
      .sort((a, b) => a.existence - b.existence)
      .slice(0, 5);

    const monthlyData = (Array.isArray(monthlyOrders) ? monthlyOrders : [])
      .filter((r) => r.month != null)
      .map((r) => ({ month: r.month, count: Number(r.count) }))
      .reverse();

    return {
      data: {
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          code: o.code,
          date: o.date?.toISOString() ?? null,
          amount: o.amount,
          supplierName: o.supplier.companyName,
        })),
        topProducts: top5Products,
        stockAlerts: alerts,
        topSuppliers: topSuppliers.map((s) => ({
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
