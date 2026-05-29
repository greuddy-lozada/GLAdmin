import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ContextService } from '../../modules/tenant/context.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly contextService?: ContextService) {
    super();
    this.applyMiddleware();
  }

  private applyMiddleware() {
    const contextService = this.contextService;
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            const ctx = contextService?.getCurrent();
            if (!ctx || ctx.isSuperAdmin || !ctx.organizationId) return query(args);
            if (model === 'User') return query(args);

            const businessModels = [
              'Supplier', 'Customer', 'Company', 'Product', 'Tax',
              'Batch', 'Stock', 'PurchaseOrder', 'PurchaseOrderDet',
              'Sale', 'SalesDet', 'ExchangeRate', 'WithholdingRecord',
              'AccountsPayable', 'AccountsReceivable',
              'PagoMovilConfig', 'PagoMovilTransaction', 'Invite',
            ];
            if (!businessModels.includes(model)) return query(args);

            if (operation === 'create') {
              if (!(args as any).data?.organizationId) {
                (args as any).data.organizationId = ctx.organizationId;
              }
              return query(args);
            }

            const actionsWithWhere = ['findUnique', 'findFirst', 'findMany', 'update', 'delete', 'updateMany', 'deleteMany'];
            if (actionsWithWhere.includes(operation)) {
              (args as any).where = { ...(args as any).where, organizationId: ctx.organizationId };
            }

            return query(args);
          },
        },
      },
    });

    Object.assign(this, extended);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
