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
}
