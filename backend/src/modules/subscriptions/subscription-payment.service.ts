import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import {
  CreateSubscriptionPaymentDto,
  ReviewSubscriptionPaymentDto,
} from './subscription-payment.dto';

@Injectable()
export class SubscriptionPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private getOrgId(): number {
    const ctx = this.context.getCurrent();
    if (!ctx?.organizationId) throw new ForbiddenException();
    return ctx.organizationId;
  }

  async getSystemConfig() {
    return {
      pagoMovil: {
        phoneNumber: process.env.PAGO_MOVIL_PHONE ?? null,
        bankId: process.env.PAGO_MOVIL_BANK ?? null,
        idNumber: process.env.PAGO_MOVIL_ID_NUMBER ?? null,
      },
    };
  }

  async findAll(status?: string) {
    const organizationId = this.getOrgId();
    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;

    return this.prisma.subscriptionPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true, label: true, amount: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAllAdmin(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    return this.prisma.subscriptionPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true, label: true, amount: true } },
        organization: { select: { id: true, name: true, slug: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(dto: CreateSubscriptionPaymentDto, _userId: number) {
    const organizationId = this.getOrgId();

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('SUBSCRIPTION.PLAN_NOT_FOUND');
    if (!plan.isActive)
      throw new BadRequestException('SUBSCRIPTION.PLAN_INACTIVE');

    if (dto.method === 'pago_movil') {
      if (!dto.bankId || !dto.phoneNumber || !dto.reference) {
        throw new BadRequestException('SUBSCRIPTION.PAGO_MOVIL_INCOMPLETE');
      }
    }

    return this.prisma.subscriptionPayment.create({
      data: {
        organizationId,
        planId: dto.planId,
        method: dto.method,
        amountUsd: plan.amount / 100,
        status: 'pending',
        bankId: dto.bankId ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        reference: dto.reference ?? null,
        proofImage: dto.proofImage ?? null,
      },
    });
  }

  async review(
    id: number,
    dto: ReviewSubscriptionPaymentDto,
    reviewedBy: number,
  ) {
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { id },
    });
    if (!payment) throw new NotFoundException('SUBSCRIPTION.NOT_FOUND');
    if (payment.status !== 'pending') {
      throw new BadRequestException('SUBSCRIPTION.ALREADY_REVIEWED');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscriptionPayment.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedBy,
          reviewedAt: new Date(),
          notes: dto.notes ?? null,
        },
      });

      if (dto.status === 'approved') {
        await tx.organization.update({
          where: { id: payment.organizationId },
          data: { planId: payment.planId },
        });
      }

      return updated;
    });

    return result;
  }
}
