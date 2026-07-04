import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AppException } from '../../common/errors';
import { SaleStatus, SALE_STATUS_META } from '../../common/types/statuses';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
    private readonly auditLog: AuditLogService,
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

    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          organizationId: orgId,
          code: dto.code,
          date: new Date(dto.date),
          amount: dto.amount,
          amountUsd: dto.amountUsd,
          exchangeRate: dto.exchangeRate,
          paymentMethod: dto.paymentMethod,
          status: SaleStatus.DRAFT,
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
        }
      }
      for (const productId of seen) {
        await this.recalcTotalExistence(productId, tx);
      }

      return created;
    });

    await this.auditLog.log({
      organizationId: orgId,
      action: 'CREATE',
      entity: 'Sale',
      entityId: sale.id,
    });
    return sale;
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
      throw new AppException('SALE_002', HttpStatus.NOT_FOUND);
    }

    return sale;
  }

  async update(id: number, dto: UpdateSaleDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    const existing = await this.prisma.sale.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new AppException('SALE_002', HttpStatus.NOT_FOUND);
    if (
      existing.status &&
      !SALE_STATUS_META[existing.status as SaleStatus]?.isMutable
    ) {
      throw new AppException('SALE_001', HttpStatus.FORBIDDEN);
    }

    const sale = await this.prisma.sale.update({
      where: { id, organizationId: orgId },
      data: {
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.paymentMethod !== undefined && {
          paymentMethod: dto.paymentMethod,
        }),
        ...(dto.idCustomer !== undefined && { idCustomer: dto.idCustomer }),
      },
      include: {
        details: true,
        customer: true,
      },
    });

    await this.auditLog.log({
      organizationId: orgId,
      action: 'UPDATE',
      entity: 'Sale',
      entityId: id,
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
        }
      }
      for (const productId of seen) {
        await this.recalcTotalExistence(productId, tx);
      }

      await tx.sale.delete({
        where: { id, organizationId: orgId },
      });
    });

    await this.auditLog.log({
      organizationId: orgId,
      action: 'DELETE',
      entity: 'Sale',
      entityId: id,
    });
    return sale;
  }
}
