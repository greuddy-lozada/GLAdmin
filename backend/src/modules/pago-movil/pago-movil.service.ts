import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import {
  CreatePagoMovilConfigDto,
  UpdatePagoMovilConfigDto,
} from './pago-movil-config.dto';
import {
  CreatePagoMovilTransactionDto,
  ReviewPagoMovilTransactionDto,
} from './pago-movil-transaction.dto';

@Injectable()
export class PagoMovilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private getOrgId(): string {
    const ctx = this.context.getCurrent();
    if (!ctx?.organizationId) throw new ForbiddenException();
    return ctx.organizationId;
  }

  // ─── Config ──────────────────────────────────

  async getConfig() {
    const organizationId = this.getOrgId();
    return this.prisma.pagoMovilConfig.findUnique({
      where: { organizationId },
    });
  }

  async createConfig(dto: CreatePagoMovilConfigDto) {
    const organizationId = this.getOrgId();
    const existing = await this.prisma.pagoMovilConfig.findUnique({
      where: { organizationId },
    });
    if (existing) {
      throw new BadRequestException('PagoMovil config already exists');
    }
    return this.prisma.pagoMovilConfig.create({
      data: {
        organizationId,
        phoneNumber: dto.phoneNumber,
        bankId: dto.bankId,
        idNumber: dto.idNumber,
        exchangeRate: dto.exchangeRate,
        isActive: true,
      },
    });
  }

  async updateConfig(dto: UpdatePagoMovilConfigDto) {
    const organizationId = this.getOrgId();
    const config = await this.prisma.pagoMovilConfig.findUnique({
      where: { organizationId },
    });
    if (!config) throw new NotFoundException('PagoMovil config not found');

    return this.prisma.pagoMovilConfig.update({
      where: { organizationId },
      data: {
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.bankId !== undefined && { bankId: dto.bankId }),
        ...(dto.idNumber !== undefined && { idNumber: dto.idNumber }),
        ...(dto.exchangeRate !== undefined && {
          exchangeRate: dto.exchangeRate,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deactivateConfig() {
    const organizationId = this.getOrgId();
    const config = await this.prisma.pagoMovilConfig.findUnique({
      where: { organizationId },
    });
    if (!config) throw new NotFoundException('PagoMovil config not found');

    return this.prisma.pagoMovilConfig.update({
      where: { organizationId },
      data: { isActive: false },
    });
  }

  // ─── Transactions ────────────────────────────

  async getTransactions(status?: string) {
    const organizationId = this.getOrgId();
    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;

    return this.prisma.pagoMovilTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async createTransaction(dto: CreatePagoMovilTransactionDto, userId: string) {
    const organizationId = this.getOrgId();

    const config = await this.prisma.pagoMovilConfig.findUnique({
      where: { organizationId },
    });
    if (!config || !config.isActive) {
      throw new BadRequestException(
        'PagoMovil is not configured or is inactive',
      );
    }

    return this.prisma.pagoMovilTransaction.create({
      data: {
        organizationId,
        userId,
        amountVes: dto.amountVes,
        amountUsd: dto.amountUsd,
        bankId: dto.bankId,
        phoneNumber: dto.phoneNumber,
        reference: dto.reference,
        proofImage: dto.proofImage ?? null,
        status: 'pending',
      },
    });
  }

  async getTransaction(id: string) {
    const organizationId = this.getOrgId();
    const tx = await this.prisma.pagoMovilTransaction.findFirst({
      where: { id, organizationId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async reviewTransaction(
    id: string,
    dto: ReviewPagoMovilTransactionDto,
    reviewedBy: string,
  ) {
    const organizationId = this.getOrgId();
    const tx = await this.prisma.pagoMovilTransaction.findFirst({
      where: { id, organizationId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'pending') {
      throw new BadRequestException('Transaction already reviewed');
    }

    return this.prisma.pagoMovilTransaction.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }
}
