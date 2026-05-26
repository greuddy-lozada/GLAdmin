import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateWithholdingDto } from './dto/create-withholding.dto';
import { UpdateWithholdingDto } from './dto/update-withholding.dto';

@Injectable()
export class WithholdingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateWithholdingDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const record = await this.prisma.withholdingRecord.create({
      data: {
        idSupplier: dto.idSupplier,
        idPurchaseOrder: dto.idPurchaseOrder,
        type: dto.type,
        percentage: dto.percentage,
        baseAmount: dto.baseAmount,
        baseAmountUsd: dto.baseAmountUsd,
        withheldAmount: dto.withheldAmount ?? 0,
        withheldAmountUsd: dto.withheldAmountUsd,
        exchangeRate: dto.exchangeRate,
        documentNumber: dto.documentNumber,
        period: dto.period,
        organizationId: orgId!,
      } as any,
      include: { supplier: true, purchaseOrder: true },
    });
    return { data: record, message: 'WITHHOLDING.CREATED' };
  }

  async findAll() {
    return this.prisma.withholdingRecord.findMany({
      include: { supplier: true, purchaseOrder: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.withholdingRecord.findUnique({
      where: { id },
      include: { supplier: true, purchaseOrder: true },
    });
    if (!record) throw new NotFoundException('WITHHOLDING.NOT_FOUND');
    return record;
  }

  async update(id: number, dto: UpdateWithholdingDto) {
    await this.findOne(id);
    const record = await this.prisma.withholdingRecord.update({
      where: { id },
      data: {
        idSupplier: dto.idSupplier,
        idPurchaseOrder: dto.idPurchaseOrder,
        type: dto.type,
        percentage: dto.percentage,
        baseAmount: dto.baseAmount,
        baseAmountUsd: dto.baseAmountUsd,
        withheldAmount: dto.withheldAmount,
        withheldAmountUsd: dto.withheldAmountUsd,
        exchangeRate: dto.exchangeRate,
        documentNumber: dto.documentNumber,
        period: dto.period,
      },
      include: { supplier: true, purchaseOrder: true },
    });
    return { data: record, message: 'WITHHOLDING.UPDATED' };
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    await this.prisma.withholdingRecord.delete({ where: { id } });
    return { data: record, message: 'WITHHOLDING.DELETED' };
  }
}
