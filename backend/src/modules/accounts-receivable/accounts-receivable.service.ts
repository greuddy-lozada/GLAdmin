import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ArApStatus } from '../../common/types/payment-method';
import type { RegisterArPaymentDto } from './dto/register-payment.dto';
import type { ArQueryDto } from './dto/ar-query.dto';

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
    private readonly auditLog: AuditLogService,
  ) {}

  private getOrgId(): string {
    const orgId = this.context.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return orgId;
  }

  private mapRow(r: {
    id: string;
    amount: Prisma.Decimal | null;
    credit: Prisma.Decimal | null;
    issueDate: Date | null;
    dueDate: Date | null;
    status: number | null;
    createdAt: Date;
    sale: {
      id: string;
      code: string | null;
      customer: { id: string; firstName: string; lastName: string } | null;
    } | null;
  }) {
    const amount = Number(r.amount ?? 0);
    const credit = Number(r.credit ?? 0);
    const balance = Math.max(0, amount - credit);
    return {
      id: r.id,
      amount,
      credit,
      balance,
      issueDate: r.issueDate?.toISOString() ?? null,
      dueDate: r.dueDate?.toISOString() ?? null,
      status: r.status ?? ArApStatus.Open,
      createdAt: r.createdAt.toISOString(),
      saleId: r.sale?.id ?? null,
      saleCode: r.sale?.code ?? null,
      customerId: r.sale?.customer?.id ?? null,
      customerName: r.sale?.customer
        ? `${r.sale.customer.firstName} ${r.sale.customer.lastName}`
        : '—',
    };
  }

  async findAll(query: ArQueryDto) {
    const orgId = this.getOrgId();
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const statusFilter = query.status ?? 'open';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.AccountsReceivableWhereInput = {
      organizationId: orgId,
      deletedAt: null,
    };

    if (statusFilter === 'open') {
      where.status = ArApStatus.Open;
    } else if (statusFilter === 'paid') {
      where.status = ArApStatus.Paid;
    } else if (statusFilter === 'overdue') {
      where.status = ArApStatus.Open;
      where.dueDate = { lt: today };
    }

    const [total, rows] = await Promise.all([
      this.prisma.accountsReceivable.count({ where }),
      this.prisma.accountsReceivable.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          sale: {
            select: {
              id: true,
              code: true,
              customer: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: rows.map((r) => this.mapRow(r)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const orgId = this.getOrgId();
    const row = await this.prisma.accountsReceivable.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        sale: {
          select: {
            id: true,
            code: true,
            customer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Accounts receivable not found');
    return { data: this.mapRow(row) };
  }

  async registerPayment(id: string, dto: RegisterArPaymentDto) {
    const orgId = this.getOrgId();
    const row = await this.prisma.accountsReceivable.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Accounts receivable not found');

    const amount = Number(row.amount ?? 0);
    const credit = Number(row.credit ?? 0);
    const balance = amount - credit;
    if (balance <= 0.01) {
      throw new BadRequestException('Already paid');
    }
    if (dto.amount > balance + 0.01) {
      throw new BadRequestException('Payment exceeds balance');
    }

    const newCredit = credit + dto.amount;
    const paid = newCredit >= amount - 0.01;

    const updated = await this.prisma.accountsReceivable.update({
      where: { id },
      data: {
        credit: newCredit,
        status: paid ? ArApStatus.Paid : ArApStatus.Open,
      },
      include: {
        sale: {
          select: {
            id: true,
            code: true,
            customer: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    await this.auditLog.log({
      organizationId: orgId,
      action: 'PAYMENT',
      entity: 'AccountsReceivable',
      entityId: id,
      metadata: { amount: dto.amount, method: dto.method, note: dto.note },
    });

    return { data: this.mapRow(updated), message: null };
  }
}
