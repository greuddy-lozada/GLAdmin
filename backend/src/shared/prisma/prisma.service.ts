import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ContextService } from '../../modules/tenant/context.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly contextService?: ContextService) {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '5';
    const sep = dbUrl.includes('?') ? '&' : '?';
    super({
      datasources: {
        db: {
          url: `${dbUrl}${sep}connection_limit=${connectionLimit}`,
        },
      },
    });
  }

  async onModuleInit() {
    const contextService = this.contextService;
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({
            model,
            operation,
            args,
            query,
          }: {
            model: string;
            operation: string;
            args: Record<string, unknown>;
            query: (args: Record<string, unknown>) => Promise<unknown>;
          }) {
            const ctx = contextService?.getCurrent();
            if (!ctx || ctx.isSuperAdmin || !ctx.organizationId)
              return query(args);
            if (model === 'User') return query(args);

            const businessModels = [
              'Supplier',
              'Customer',
              'Company',
              'Product',
              'Tax',
              'Batch',
              'Stock',
              'PurchaseOrder',
              'PurchaseOrderDet',
              'Sale',
              'SalesDet',
              'ExchangeRate',
              'WithholdingRecord',
              'AccountsPayable',
              'AccountsReceivable',
              'PagoMovilConfig',
              'PagoMovilTransaction',
              'Invite',
            ];
            if (!businessModels.includes(model)) return query(args);

            if (operation === 'create') {
              const data = args.data as Record<string, unknown> | undefined;
              if (!data?.organizationId) {
                args.data = { ...data, organizationId: ctx.organizationId };
              }
              return query(args);
            }

            const actionsWithWhere = [
              'findUnique',
              'findFirst',
              'findMany',
              'update',
              'delete',
              'updateMany',
              'deleteMany',
            ];
            if (actionsWithWhere.includes(operation)) {
              args.where = {
                ...(args.where as Record<string, unknown>),
                organizationId: ctx.organizationId,
              };
            }

            // Auto-increment version on update for optimistic locking
            const versionedModels = [
              'Supplier',
              'Customer',
              'Company',
              'Product',
              'Tax',
              'Batch',
              'Stock',
              'PurchaseOrder',
              'PurchaseOrderDet',
              'Sale',
              'SalesDet',
              'ExchangeRate',
              'WithholdingRecord',
              'AccountsPayable',
              'AccountsReceivable',
              'License',
              'PagoMovilConfig',
              'PagoMovilTransaction',
              'Invite',
              'User',
              'Organization',
              'Plan',
            ];
            if (
              (operation === 'update' || operation === 'updateMany') &&
              versionedModels.includes(model) &&
              args.data
            ) {
              (args.data as Record<string, unknown>).version = { increment: 1 };
            }

            return query(args);
          },
        },
      },
    });

    Object.assign(this, extended);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
