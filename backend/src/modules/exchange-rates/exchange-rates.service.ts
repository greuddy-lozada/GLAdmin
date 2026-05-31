import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExchangeRatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateExchangeRateDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const rate = await this.prisma.exchangeRate.create({
      data: {
        rate: dto.rate,
        currencyId: dto.currencyId,
        type: dto.type ?? 'official',
        date: dto.date ? new Date(dto.date) : new Date(),
        source: dto.source,
        organizationId: orgId!,
      } as unknown as Prisma.ExchangeRateCreateInput,
      include: { currency: true },
    });
    return { data: rate, message: 'EXCHANGE_RATE.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.exchangeRate.findMany({
        skip,
        take: limit,
        include: { currency: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.exchangeRate.count(),
    ]);
    return { data, total, page, limit };
  }

  async findLatest() {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { type: 'official' },
      orderBy: { date: 'desc' },
      include: { currency: true },
    });
    return { data: rate, message: null };
  }

  async findOne(id: number) {
    const rate = await this.prisma.exchangeRate.findUnique({
      where: { id },
      include: { currency: true },
    });
    if (!rate) throw new NotFoundException('EXCHANGE_RATE.NOT_FOUND');
    return rate;
  }

  async update(id: number, dto: UpdateExchangeRateDto) {
    await this.findOne(id);
    const rate = await this.prisma.exchangeRate.update({
      where: { id },
      data: {
        rate: dto.rate,
        currencyId: dto.currencyId,
        type: dto.type,
        date: dto.date ? new Date(dto.date) : undefined,
        source: dto.source,
      },
      include: { currency: true },
    });
    return { data: rate, message: 'EXCHANGE_RATE.UPDATED' };
  }

  async remove(id: number) {
    const rate = await this.findOne(id);
    await this.prisma.exchangeRate.delete({ where: { id } });
    return { data: rate, message: 'EXCHANGE_RATE.DELETED' };
  }
}
