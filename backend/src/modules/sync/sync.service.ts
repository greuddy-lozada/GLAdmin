import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { SalesService } from '../sales/sales.service';
import { PushMutationDto } from './dto/push-mutation.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { CreateSaleDto } from '../sales/dto/create-sale.dto';

@Injectable()
export class SyncService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
    private readonly salesService: SalesService,
  ) {}

  async pull(since?: string) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const sinceDate = since ? new Date(since) : new Date(0);

    const products = await this.prisma.product.findMany({
      where: {
        organizationId: orgId,
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        name: true,
        price: true,
        dollarPrice: true,
        idTax: true,
        updatedAt: true,
        stocks: {
          select: {
            existence: true,
          },
        },
      },
    });

    const customers = await this.prisma.customer.findMany({
      where: {
        organizationId: orgId,
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        idCardNumber: true,
        phoneNumber: true,
        updatedAt: true,
      },
    });

    const exchangeRates = await this.prisma.exchangeRate.findMany({
      where: {
        organizationId: orgId,
        updatedAt: { gt: sinceDate },
      },
      select: {
        id: true,
        rate: true,
        updatedAt: true,
      },
    });

    const lastPullAt = new Date();

    await this.prisma.syncCursor.upsert({
      where: { organizationId: orgId },
      update: { lastPullAt },
      create: {
        organizationId: orgId,
        lastPullAt,
        lastPushAt: new Date(0),
      },
    });

    const productsWithStock = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      dollarPrice: p.dollarPrice,
      idTax: p.idTax,
      updatedAt: p.updatedAt,
      stock: p.stocks.reduce((sum, s) => sum + s.existence, 0),
    }));

    return {
      products: productsWithStock,
      customers,
      exchangeRates,
      cursor: { lastPullAt: lastPullAt.toISOString() },
    };
  }

  async push(mutations: PushMutationDto[]) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const accepted: number[] = [];
    const conflicts: Array<{ localTimestamp: string; recordId?: number; issue: string; description: string }> = [];
    const errors: Array<{ localTimestamp: string; error: string }> = [];

    for (const mutation of mutations) {
      try {
        if (mutation.table === 'sales' && mutation.operation === 'create') {
          const mutationItems = mutation.data as {
            items: Array<{ productId: number; quantity: number }>;
          };

          let hasConflict = false;

          for (const item of mutationItems.items) {
            const currentStock = await this.prisma.stock.findFirst({
              where: { idProduct: item.productId, organizationId: orgId },
            });

            if (!currentStock || currentStock.existence < item.quantity) {
              const salesSince = await this.prisma.sale.findMany({
                where: {
                  organizationId: orgId,
                  createdAt: { gt: new Date(mutation.localTimestamp) },
                  details: {
                    some: { idProduct: item.productId },
                  },
                },
                include: { details: true },
              });

              const consumedSince = salesSince.reduce((sum, sale) => {
                const detail = sale.details.find((d) => d.idProduct === item.productId);
                return sum + (detail?.quantity || 0);
              }, 0);

              const available = (currentStock?.existence || 0) - consumedSince;

              if (available < item.quantity) {
                hasConflict = true;
                conflicts.push({
                  localTimestamp: mutation.localTimestamp,
                  recordId: mutation.recordId,
                  issue: 'oversold',
                  description: `Product ${item.productId}: requested ${item.quantity}, available ${available}`,
                });

                await this.prisma.syncConflict.create({
                  data: {
                    organizationId: orgId,
                    table: 'sales',
                    recordId: mutation.recordId,
                    localData: JSON.stringify(mutation.data),
                    serverData: JSON.stringify({ currentStock: currentStock?.existence || 0, consumedSince }),
                    localTimestamp: new Date(mutation.localTimestamp),
                    description: `Oversold product ${item.productId}: requested ${item.quantity}, available ${available}`,
                    status: 'pending',
                  },
                });

                break;
              }
            }

          }

          if (hasConflict) continue;

          const createSaleDto: CreateSaleDto = {
            code: mutation.data.code as string,
            date: new Date(mutation.data.date as string).toISOString(),
            amount: mutation.data.amount as number,
            amountUsd: mutation.data.amountUsd as number,
            exchangeRate: mutation.data.exchangeRate as number,
            paymentMethod: mutation.data.paymentMethod as number,
            status: mutation.data.status as number,
            idCustomer: mutation.data.idCustomer as number,
            items: (mutation.data.items as Array<{ productId: number; quantity: number; unitPrice: number; unitPriceUsd: number; subtotal: number; subtotalUsd: number }>).map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitPriceUsd: item.unitPriceUsd,
              subtotal: item.subtotal,
              subtotalUsd: item.subtotalUsd,
            })),
          };

          const sale = await this.salesService.create(createSaleDto);
          accepted.push(sale.id);
        } else {
          accepted.push(0);
        }
      } catch (error) {
        errors.push({
          localTimestamp: mutation.localTimestamp,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const lastPushAt = new Date();
    await this.prisma.syncCursor.upsert({
      where: { organizationId: orgId },
      update: { lastPushAt },
      create: {
        organizationId: orgId,
        lastPullAt: new Date(0),
        lastPushAt,
      },
    });

    return { accepted, conflicts, errors };
  }

  async getConflicts() {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return this.prisma.syncConflict.findMany({
      where: { organizationId: orgId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveConflict(id: number, dto: ResolveConflictDto) {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');

    return this.prisma.syncConflict.update({
      where: { id, organizationId: orgId },
      data: {
        status: dto.status,
        resolvedAt: new Date(),
      },
    });
  }
}
