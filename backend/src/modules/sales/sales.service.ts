import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private async recalcTotalExistence(
    productId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    const result = await db.stock.aggregate({
      where: { idProduct: productId },
      _sum: { existence: true },
    });
    await db.product.update({
      where: { id: productId },
      data: { totalExistence: result._sum.existence ?? 0 },
    });
  }

  async create(dto: CreateSaleDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          organizationId: orgId,
          code: dto.code,
          date: new Date(dto.date),
          amount: dto.amount,
          amountUsd: dto.amountUsd,
          exchangeRate: dto.exchangeRate,
          paymentMethod: dto.paymentMethod,
          status: dto.status,
          idCustomer: dto.idCustomer,
          totalTax: dto.totalTax,
          totalTaxUsd: dto.totalTaxUsd,
          withholdingPercentage: dto.withholdingPercentage,
          withholdingAmount: dto.withholdingAmount,
          withholdingAmountUsd: dto.withholdingAmountUsd,
          details: {
            create: dto.items.map((item) => ({
              organizationId: orgId,
              idProduct: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitPriceUsd: item.unitPriceUsd,
              subtotal: item.subtotal,
              subtotalUsd: item.subtotalUsd,
              observation: item.observation,
            })),
          },
          payments: dto.payments?.length
            ? {
                create: dto.payments.map((p) => ({
                  organizationId: orgId,
                  method: p.method,
                  amount: p.amount,
                  currency: p.currency,
                })),
              }
            : undefined,
        },
        include: {
          details: true,
          customer: true,
          payments: true,
        },
      });

      const seen = new Set<number>();
      for (const item of dto.items) {
        await tx.stock.updateMany({
          where: { idProduct: item.productId, organizationId: orgId },
          data: { existence: { decrement: item.quantity } },
        });
        if (!seen.has(item.productId)) {
          seen.add(item.productId);
          await this.recalcTotalExistence(item.productId, tx);
        }
      }

      return sale;
    });
  }

  async findAll(page = 1, limit = 20) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const skip = (page - 1) * limit;
    const where = { organizationId: orgId };
    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: { details: true, customer: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const sale = await this.prisma.sale.findFirst({
      where: { id, organizationId: orgId },
      include: {
        details: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async update(id: number, dto: UpdateSaleDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    const sale = await this.prisma.sale.update({
      where: { id, organizationId: orgId },
      data: {
        code: dto.code,
        date: dto.date ? new Date(dto.date) : undefined,
        amount: dto.amount,
        amountUsd: dto.amountUsd,
        exchangeRate: dto.exchangeRate,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        idCustomer: dto.idCustomer,
      },
      include: {
        details: true,
        customer: true,
      },
    });

    return sale;
  }

  async remove(id: number) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const sale = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      const seen = new Set<number>();
      for (const item of sale.details) {
        await tx.stock.updateMany({
          where: { idProduct: item.idProduct, organizationId: orgId },
          data: { existence: { increment: item.quantity || 0 } },
        });
        if (!seen.has(item.idProduct)) {
          seen.add(item.idProduct);
          await this.recalcTotalExistence(item.idProduct, tx);
        }
      }

      await tx.sale.delete({
        where: { id, organizationId: orgId },
      });
    });

    return sale;
  }
}
