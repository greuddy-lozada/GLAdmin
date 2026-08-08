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
import type { RegisterApPaymentDto } from './dto/register-payment.dto';
import type { ApQueryDto } from './dto/ap-query.dto';

@Injectable()
export class AccountsPayableService {
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
    purchaseOrder: {
      id: string;
      code: string | null;
      supplier: { id: string; companyName: string } | null;
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
      purchaseOrderId: r.purchaseOrder?.id ?? null,
      purchaseOrderCode: r.purchaseOrder?.code ?? null,
      supplierId: r.purchaseOrder?.supplier?.id ?? null,
      supplierName: r.purchaseOrder?.supplier?.companyName ?? '—',
    };
  }

  async findAll(query: ApQueryDto) {
    const orgId = this.getOrgId();
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const statusFilter = query.status ?? 'open';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.AccountsPayableWhereInput = {
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
      this.prisma.accountsPayable.count({ where }),
      this.prisma.accountsPayable.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          purchaseOrder: {
            select: {
              id: true,
              code: true,
              supplier: { select: { id: true, companyName: true } },
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
    const row = await this.prisma.accountsPayable.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            code: true,
            supplier: { select: { id: true, companyName: true } },
          },
        },
      },
    });
    if (!row) throw new NotFoundException('Accounts payable not found');
    return { data: this.mapRow(row) };
  }

  async registerPayment(id: string, dto: RegisterApPaymentDto) {
    const orgId = this.getOrgId();
    const row = await this.prisma.accountsPayable.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!row) throw new NotFoundException('Accounts payable not found');

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

    const updated = await this.prisma.accountsPayable.update({
      where: { id },
      data: {
        credit: newCredit,
        status: paid ? ArApStatus.Paid : ArApStatus.Open,
      },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            code: true,
            supplier: { select: { id: true, companyName: true } },
          },
        },
      },
    });

    await this.auditLog.log({
      organizationId: orgId,
      action: 'PAYMENT',
      entity: 'AccountsPayable',
      entityId: id,
      metadata: { amount: dto.amount, method: dto.method, note: dto.note },
    });

    return { data: this.mapRow(updated), message: null };
  }
}
