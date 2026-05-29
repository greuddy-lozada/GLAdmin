import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateSaleDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    const sale = await this.prisma.sale.create({
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
      },
      include: {
        details: true,
        customer: true,
      },
    });

    for (const item of dto.items) {
      await this.prisma.stock.updateMany({
        where: { idProduct: item.productId, organizationId: orgId },
        data: { existence: { decrement: item.quantity } },
      });
    }

    return sale;
  }

  async findAll() {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return this.prisma.sale.findMany({
      where: { organizationId: orgId },
      include: {
        details: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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

    for (const item of sale.details) {
      await this.prisma.stock.updateMany({
        where: { idProduct: item.idProduct, organizationId: orgId },
        data: { existence: { increment: item.quantity || 0 } },
      });
    }

    await this.prisma.sale.delete({
      where: { id, organizationId: orgId },
    });

    return sale;
  }
}
