import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseOrderDto) {
    const { details, ...header } = dto;
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        ...header,
        details: details
          ? {
              create: details,
            }
          : undefined,
      },
      include: { supplier: true, details: { include: { product: true } }, exchangeRateRef: true, officialExchangeRateRef: true },
    });
    return { data: purchaseOrder, message: 'PURCHASE_ORDER.CREATED' };
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: { supplier: true, details: { include: { product: true } }, exchangeRateRef: true, officialExchangeRateRef: true },
    });
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
    const { details: _details, ...header } = dto;
    const purchaseOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: header,
      include: { supplier: true, details: { include: { product: true } }, exchangeRateRef: true, officialExchangeRateRef: true },
    });
    return { data: purchaseOrder, message: 'PURCHASE_ORDER.UPDATED' };
  }

  async remove(id: number) {
    const po = await this.findOne(id);
    await this.prisma.purchaseOrderDet.deleteMany({
      where: { idPurchaseOrder: id },
    });
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return { data: po, message: 'PURCHASE_ORDER.DELETED' };
  }
}
