import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateForeignExchangeDto } from './dto/create-foreign-exchange.dto';
import { UpdateForeignExchangeDto } from './dto/update-foreign-exchange.dto';

@Injectable()
export class ForeignExchangesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateForeignExchangeDto) {
    const fx = await this.prisma.foreignExchange.create({
      data: dto,
      include: { currency: true },
    });
    return { data: fx, message: 'FOREIGN_EXCHANGE.CREATED' };
  }

  async findAll() {
    return this.prisma.foreignExchange.findMany({
      include: { currency: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const fx = await this.prisma.foreignExchange.findUnique({
      where: { id },
      include: { currency: true },
    });
    if (!fx) throw new NotFoundException('FOREIGN_EXCHANGE.NOT_FOUND');
    return fx;
  }

  async update(id: number, dto: UpdateForeignExchangeDto) {
    await this.findOne(id);
    const fx = await this.prisma.foreignExchange.update({
      where: { id },
      data: dto,
    });
    return { data: fx, message: 'FOREIGN_EXCHANGE.UPDATED' };
  }

  async remove(id: number) {
    const fx = await this.findOne(id);
    await this.prisma.foreignExchange.delete({ where: { id } });
    return { data: fx, message: 'FOREIGN_EXCHANGE.DELETED' };
  }
}
