import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  private getOrgId(): number {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    if (!orgId) throw new BadRequestException('Organization context required');
    return orgId;
  }

  async syncFromApi() {
    const orgId = this.getOrgId();

    interface DolarApiRate {
      fuente: string;
      promedio: number;
    }

    let data: DolarApiRate[];
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`API responded with ${res.status}`);
      data = (await res.json()) as DolarApiRate[];
    } catch {
      throw new BadRequestException(
        'Failed to fetch exchange rates from external API',
      );
    }

    const oficial = data.find((d) => d.fuente === 'oficial');
    const paralelo = data.find((d) => d.fuente === 'paralelo');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = await this.prisma.exchangeRateDay.upsert({
      where: { organizationId_date: { organizationId: orgId, date: today } },
      update: {
        rateBcvUsd: oficial?.promedio ?? undefined,
        rateParalelo: paralelo?.promedio ?? undefined,
        source: 'dolarapi',
      },
      create: {
        date: today,
        rateBcvUsd: oficial?.promedio ?? null,
        rateParalelo: paralelo?.promedio ?? null,
        source: 'dolarapi',
        organizationId: orgId,
      },
    });

    return { data: day, message: 'EXCHANGE_RATE.SYNCED' };
  }

  async findAll(page = 1, limit = 20) {
    const orgId = this.getOrgId();
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.exchangeRateDay.findMany({
        where: { organizationId: orgId },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.exchangeRateDay.count({ where: { organizationId: orgId } }),
    ]);
    return { data, total, page, limit };
  }

  async findLatest() {
    const orgId = this.getOrgId();
    const day = await this.prisma.exchangeRateDay.findFirst({
      where: { organizationId: orgId },
      orderBy: { date: 'desc' },
    });
    return { data: day, message: null };
  }

  async findOne(id: number) {
    const orgId = this.getOrgId();
    const day = await this.prisma.exchangeRateDay.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!day) throw new NotFoundException('EXCHANGE_RATE.NOT_FOUND');
    return day;
  }

  async create(dto: CreateExchangeRateDto) {
    const orgId = this.getOrgId();
    const date = dto.date ? new Date(dto.date) : new Date();
    date.setHours(0, 0, 0, 0);

    const day = await this.prisma.exchangeRateDay.create({
      data: {
        date,
        rateBcvUsd: dto.rateBcvUsd ?? null,
        rateParalelo: dto.rateParalelo ?? null,
        source: dto.source ?? 'manual',
        organizationId: orgId,
      } as unknown as Prisma.ExchangeRateDayCreateInput,
    });
    return { data: day, message: 'EXCHANGE_RATE.CREATED' };
  }

  async update(id: number, dto: UpdateExchangeRateDto) {
    this.getOrgId();
    await this.findOne(id);

    const data: Partial<Prisma.ExchangeRateDayUpdateInput> = {};
    if (dto.rateBcvUsd !== undefined) data.rateBcvUsd = dto.rateBcvUsd;
    if (dto.rateParalelo !== undefined) data.rateParalelo = dto.rateParalelo;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.date !== undefined) {
      const d = new Date(dto.date);
      d.setHours(0, 0, 0, 0);
      data.date = d;
    }

    const day = await this.prisma.exchangeRateDay.update({
      where: { id },
      data,
    });
    return { data: day, message: 'EXCHANGE_RATE.UPDATED' };
  }

  async remove(id: number) {
    const day = await this.findOne(id);
    await this.prisma.exchangeRateDay.delete({ where: { id } });
    return { data: day, message: 'EXCHANGE_RATE.DELETED' };
  }
}
