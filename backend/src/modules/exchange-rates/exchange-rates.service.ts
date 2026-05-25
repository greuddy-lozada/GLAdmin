import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExchangeRateDto) {
    const rate = await this.prisma.exchangeRate.create({
      data: {
        rate: dto.rate,
        currencyId: dto.currencyId,
        type: dto.type ?? 'official',
        date: dto.date ? new Date(dto.date) : new Date(),
        source: dto.source,
      },
      include: { currency: true },
    });
    return { data: rate, message: 'EXCHANGE_RATE.CREATED' };
  }

  async findAll() {
    return this.prisma.exchangeRate.findMany({
      include: { currency: true },
      orderBy: { date: 'desc' },
    });
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
