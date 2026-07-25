import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import { OpenRegisterDto } from './dto/open-register.dto';
import { CloseRegisterDto } from './dto/close-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private get orgId(): string {
    const ctx = this.context.getCurrent();
    const id = ctx?.organizationId;
    if (!id) throw new Error('No organization context');
    return id;
  }

  async create(dto: CreateCashRegisterDto) {
    const cashRegister = await this.prisma.cashRegister.create({
      data: { ...dto, organizationId: this.orgId },
    });
    return { data: cashRegister, message: 'CASH_REGISTER.CREATED' };
  }

  async findAll() {
    const data = await this.prisma.cashRegister.findMany({
      where: { organizationId: this.orgId },
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  async findOne(id: string) {
    const cashRegister = await this.prisma.cashRegister.findFirst({
      where: { id, organizationId: this.orgId },
    });
    if (!cashRegister) throw new NotFoundException('CASH_REGISTER.NOT_FOUND');
    return cashRegister;
  }

  async update(id: string, dto: UpdateCashRegisterDto) {
    await this.findOne(id);
    const cashRegister = await this.prisma.cashRegister.update({
      where: { id },
      data: dto,
    });
    return { data: cashRegister, message: 'CASH_REGISTER.UPDATED' };
  }

  async remove(id: string) {
    await this.findOne(id);
    const cashRegister = await this.prisma.cashRegister.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { data: cashRegister, message: 'CASH_REGISTER.DELETED' };
  }

  async open(cashRegisterId: string, dto: OpenRegisterDto, userId: string) {
    const cashRegister = await this.findOne(cashRegisterId);
    if (!cashRegister.isActive)
      throw new BadRequestException('CASH_REGISTER.INACTIVE');

    const activeSession = await this.prisma.registerSession.findFirst({
      where: { userId, status: 'abierta', organizationId: this.orgId },
    });
    if (activeSession)
      throw new BadRequestException('CASH_REGISTER.ALREADY_OPEN');

    const session = await this.prisma.registerSession.create({
      data: {
        cashRegisterId,
        userId,
        organizationId: this.orgId,
        initialCash: dto.initialCash,
        initialCashUsd: dto.initialCashUsd ?? 0,
      },
    });
    return { data: session };
  }

  async close(sessionId: string, dto: CloseRegisterDto, userId: string) {
    const session = await this.prisma.registerSession.findFirst({
      where: { id: sessionId, organizationId: this.orgId },
      include: {
        sales: {
          include: { payments: true },
        },
      },
    });
    if (!session)
      throw new NotFoundException('CASH_REGISTER.SESSION_NOT_FOUND');
    if (session.status === 'cerrada')
      throw new BadRequestException('CASH_REGISTER.ALREADY_CLOSED');

    let totalCashSales = 0;
    for (const sale of session.sales) {
      for (const payment of sale.payments) {
        if (payment.method === 1) {
          totalCashSales += Number(payment.amount);
        }
      }
    }

    const expectedCash = Number(session.initialCash) + totalCashSales;
    const countedCash = dto.countedCash;
    const difference = countedCash - expectedCash;

    const [updated, settlement] = await this.prisma.$transaction([
      this.prisma.registerSession.update({
        where: { id: sessionId },
        data: {
          status: 'cerrada',
          closedAt: new Date(),
          notes: dto.notes,
        },
      }),
      this.prisma.registerSettlement.create({
        data: {
          sessionId,
          organizationId: this.orgId,
          expectedCash,
          countedCash,
          difference,
          closedById: userId,
          notes: dto.notes,
        },
      }),
    ]);

    return { data: { session: updated, settlement } };
  }

  async findSessions(status?: string) {
    const where: Record<string, unknown> = { organizationId: this.orgId };
    if (status) where.status = status;
    const data = await this.prisma.registerSession.findMany({
      where,
      include: { cashRegister: true },
      orderBy: { openedAt: 'desc' },
    });
    return { data };
  }

  async findMyActiveSession(userId: string) {
    const session = await this.prisma.registerSession.findFirst({
      where: { userId, status: 'abierta', organizationId: this.orgId },
      include: { cashRegister: true },
    });
    return { data: session ?? null };
  }
}
