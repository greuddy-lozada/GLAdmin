import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  private async recalcTotalExistence(
    productId: number,
    tx: Prisma.TransactionClient,
  ) {
    const result = await tx.stock.aggregate({
      where: { idProduct: productId },
      _sum: { existence: true },
    });
    await tx.product.update({
      where: { id: productId },
      data: { totalExistence: result._sum.existence ?? 0 },
    });
  }

  private get orgId(): number {
    const ctx = this.contextService?.getCurrent();
    const id = ctx?.organizationId;
    if (!id) throw new Error('No organization context');
    return id;
  }

  private include = {
    supplier: true,
    details: { include: { product: true } },
    exchangeRateRef: true,
    exchangeRateDayRef: true,
    officialExchangeRateRef: true,
    withholdingRecords: true,
  };

  async create(dto: CreatePurchaseOrderDto) {
    const orgId = this.orgId;
    const {
      details,
      applyWithholding,
      withholdingPercentage,
      withholdingProof,
      ...header
    } = dto;

    if (applyWithholding) {
      const orgCompany = await this.prisma.company.findFirst({
        where: { organizationId: orgId },
      });
      if (!orgCompany?.isWithholdingAgent) {
        throw new BadRequestException(
          'La organización no es agente de retención',
        );
      }
      if (!withholdingPercentage) {
        throw new BadRequestException(
          'Debe especificar un porcentaje de retención (75 o 100)',
        );
      }
      if (!withholdingProof) {
        throw new BadRequestException(
          'Debe adjuntar el comprobante de retención',
        );
      }
    }

    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        ...header,
        idSupplier: dto.idSupplier,
        date: dto.date ? new Date(dto.date) : undefined,
        organizationId: orgId,
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
                organizationId: orgId,
              })),
            }
          : undefined,
        withholdingRecords: applyWithholding
          ? {
              create: {
                idSupplier: dto.idSupplier,
                type: 'IVA',
                percentage: withholdingPercentage!,
                baseAmount: dto.ivaAmount ?? 0,
                baseAmountUsd: dto.ivaAmountUsd ?? 0,
                withheldAmount:
                  (dto.ivaAmount ?? 0) * (withholdingPercentage! / 100),
                withheldAmountUsd:
                  (dto.ivaAmountUsd ?? 0) * (withholdingPercentage! / 100),
                withholdingProof: withholdingProof,
                organizationId: orgId,
              },
            }
          : undefined,
      },
      include: this.include,
    });
    return { data: purchaseOrder, message: 'PURCHASE_ORDER.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        skip,
        take: limit,
        include: this.include,
      }),
      this.prisma.purchaseOrder.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        ...this.include,
        accountsPayables: true,
      },
    });
    if (!purchaseOrder) throw new NotFoundException('PURCHASE_ORDER.NOT_FOUND');
    return purchaseOrder;
  }

  async update(id: number, dto: UpdatePurchaseOrderDto) {
    const existing = await this.findOne(id);
    const orgId = this.orgId;
    const {
      details: dtoDetails,
      applyWithholding,
      withholdingPercentage,
      withholdingProof,
      ...header
    } = dto;

    if (applyWithholding) {
      const orgCompany = await this.prisma.company.findFirst({
        where: { organizationId: orgId },
      });
      if (!orgCompany?.isWithholdingAgent) {
        throw new BadRequestException(
          'La organización no es agente de retención',
        );
      }
      if (!withholdingPercentage && !existing.withholdingRecords?.length) {
        throw new BadRequestException(
          'Debe especificar un porcentaje de retención (75 o 100)',
        );
      }
      if (!withholdingProof && !existing.withholdingRecords?.length) {
        throw new BadRequestException(
          'Debe adjuntar el comprobante de retención',
        );
      }
    }

    const purchaseOrder = await this.prisma.$transaction(async (tx) => {
      if (dtoDetails) {
        await tx.purchaseOrderDet.deleteMany({
          where: { idPurchaseOrder: id },
        });
        if (dtoDetails.length > 0) {
          await tx.purchaseOrderDet.createMany({
            data: dtoDetails.map((d) => ({
              idPurchaseOrder: id,
              idProduct: d.idProduct,
              quantity: d.quantity,
              unitPrice: d.unitPrice,
              unitPriceUsd: d.unitPriceUsd,
              subtotal: d.subtotal,
              subtotalUsd: d.subtotalUsd,
              observation: d.observation,
              organizationId: orgId,
            })),
          });
        }
      }

      if (applyWithholding !== undefined) {
        const existingRecord = existing.withholdingRecords?.[0];
        if (applyWithholding) {
          const pct = withholdingPercentage ?? existingRecord?.percentage ?? 75;
          const proof =
            withholdingProof ?? existingRecord?.withholdingProof ?? '';
          const baseAmt = dto.ivaAmount ?? existing.ivaAmount ?? 0;
          const baseAmtUsd = dto.ivaAmountUsd ?? existing.ivaAmountUsd ?? 0;
          const data = {
            idSupplier: dto.idSupplier ?? existing.idSupplier,
            idPurchaseOrder: id,
            type: 'IVA',
            percentage: pct,
            baseAmount: baseAmt,
            baseAmountUsd: baseAmtUsd,
            withheldAmount: baseAmt * (pct / 100),
            withheldAmountUsd: baseAmtUsd * (pct / 100),
            withholdingProof: proof,
            organizationId: orgId,
          };
          if (existingRecord) {
            await tx.withholdingRecord.update({
              where: { id: existingRecord.id },
              data,
            });
          } else {
            await tx.withholdingRecord.create({ data });
          }
        } else {
          if (existingRecord) {
            await tx.withholdingRecord.delete({
              where: { id: existingRecord.id },
            });
          }
        }
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: header,
        include: this.include,
      });

      return updated;
    });
    return { data: purchaseOrder, message: 'PURCHASE_ORDER.UPDATED' };
  }

  async receive(id: number, dto: ReceivePurchaseOrderDto) {
    const existing = await this.findOne(id);
    if (existing.status === 4) {
      throw new BadRequestException('PURCHASE_ORDER.ALREADY_RECEIVED');
    }
    const orgId = this.orgId;

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.details) {
        const line = existing.details.find((d) => d.id === item.id);
        if (!line)
          throw new BadRequestException(
            `Detail id ${item.id} not found in PO ${id}`,
          );

        const newReceived = line.receivedQuantity + item.quantity;
        if (newReceived > (line.quantity ?? 0)) {
          throw new BadRequestException(
            `Cannot receive ${item.quantity} more for detail ${item.id}: ordered ${line.quantity}, already received ${line.receivedQuantity}`,
          );
        }

        await tx.purchaseOrderDet.update({
          where: { id: item.id },
          data: { receivedQuantity: newReceived },
        });

        let stock = await tx.stock.findFirst({
          where: {
            idProduct: line.idProduct,
            idSupplier: existing.idSupplier,
            organizationId: orgId,
          },
        });

        if (stock) {
          stock = await tx.stock.update({
            where: { id: stock.id },
            data: {
              existence: { increment: item.quantity },
              version: { increment: 1 },
              idPurchaseOrder: id,
            },
          });
        } else {
          stock = await tx.stock.create({
            data: {
              idProduct: line.idProduct,
              idSupplier: existing.idSupplier,
              existence: item.quantity,
              organizationId: orgId,
              idPurchaseOrder: id,
            },
          });
        }

        await tx.stockDet.create({
          data: {
            idStock: stock.id,
            type: 1,
            quantity: item.quantity,
            observation: `Ingreso parcial por pedido ${existing.code ?? id}`,
          },
        });
      }

      const refreshedLines = await tx.purchaseOrderDet.findMany({
        where: { idPurchaseOrder: id },
      });
      const allReceived = refreshedLines.every(
        (l) => l.receivedQuantity >= (l.quantity ?? 0),
      );
      if (allReceived) {
        await tx.purchaseOrder.update({ where: { id }, data: { status: 4 } });
      }
    });

    return this.findOne(id);
  }

  async remove(id: number) {
    const po = await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.withholdingRecord.deleteMany({ where: { idPurchaseOrder: id } });
      await tx.purchaseOrderDet.deleteMany({ where: { idPurchaseOrder: id } });
      await tx.accountsPayable.deleteMany({ where: { idPurchaseOrder: id } });
      await tx.purchaseOrder.delete({ where: { id } });
    });
    return { data: po, message: 'PURCHASE_ORDER.DELETED' };
  }
}
