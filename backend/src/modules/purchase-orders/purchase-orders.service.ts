import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreatePurchaseOrderDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const { details } = dto;
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        idSupplier: dto.idSupplier,
        code: dto.code,
        date: dto.date ? new Date(dto.date) : undefined,
        amount: dto.amount,
        amountUsd: dto.amountUsd,
        exchangeRate: dto.exchangeRate,
        exchangeRateId: dto.exchangeRateId,
        officialExchangeRate: dto.officialExchangeRate,
        officialExchangeRateId: dto.officialExchangeRateId,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        organizationId: orgId!,
        details: details
          ? {
              create: details.map((d) => ({
                idProduct: d.idProduct,
                quantity: d.quantity,
                unitPrice: d.unitPrice,
                unitPriceUsd: d.unitPriceUsd,
                subtotal: d.subtotal,
                subtotalUsd: d.subtotalUsd,
                observation: d.observation,
                organizationId: orgId!,
              })),
            }
          : undefined,
      },
      include: { supplier: true, details: { include: { product: true } }, exchangeRateRef: true, officialExchangeRateRef: true },
    });
    return { data: purchaseOrder, message: 'PURCHASE_ORDER.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const include = { supplier: true, details: { include: { product: true } }, exchangeRateRef: true, officialExchangeRateRef: true };
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({ skip, take: limit, include }),
      this.prisma.purchaseOrder.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        details: { include: { product: true } },
        accountsPayables: true,
        exchangeRateRef: true,
        officialExchangeRateRef: true,
        withholdingRecords: true,
      },
    });
    if (!purchaseOrder) throw new NotFoundException('PURCHASE_ORDER.NOT_FOUND');
    return purchaseOrder;
  }

  async update(id: number, dto: UpdatePurchaseOrderDto) {
    await this.findOne(id);
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const { details, ...header } = dto;
    const purchaseOrder = await this.prisma.$transaction(async (tx) => {
      if (details) {
        await tx.purchaseOrderDet.deleteMany({ where: { idPurchaseOrder: id } });
        if (details.length > 0) {
          await tx.purchaseOrderDet.createMany({
            data: details.map((d) => ({
              idPurchaseOrder: id,
              idProduct: d.idProduct,
              quantity: d.quantity,
              unitPrice: d.unitPrice,
              unitPriceUsd: d.unitPriceUsd,
              subtotal: d.subtotal,
              subtotalUsd: d.subtotalUsd,
              observation: d.observation,
              organizationId: orgId!,
            })),
          });
        }
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: header,
        include: { supplier: true, details: { include: { product: true } }, exchangeRateRef: true, officialExchangeRateRef: true },
      });
    });
    return { data: purchaseOrder, message: 'PURCHASE_ORDER.UPDATED' };
  }

  async remove(id: number) {
    const po = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseOrderDet.deleteMany({
        where: { idPurchaseOrder: id },
      });
      await tx.purchaseOrder.delete({ where: { id } });
    });
    return { data: po, message: 'PURCHASE_ORDER.DELETED' };
  }
}
