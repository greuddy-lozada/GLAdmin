import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StocksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStockDto) {
    const stock = await this.prisma.stock.create({
      data: dto,
      include: { product: true, supplier: true, batch: true },
    });
    return { data: stock, message: 'STOCK.CREATED' };
  }

  async findAll() {
    return this.prisma.stock.findMany({
      where: { available: true },
      include: { product: true, supplier: true, batch: true, stockDets: true },
    });
  }

  async findOne(id: number) {
    const stock = await this.prisma.stock.findUnique({
      where: { id },
      include: { product: true, supplier: true, batch: true, stockDets: true },
    });
    if (!stock) throw new NotFoundException('STOCK.NOT_FOUND');
    return stock;
  }

  async update(id: number, dto: UpdateStockDto) {
    await this.findOne(id);
    const stock = await this.prisma.stock.update({
      where: { id },
      data: dto,
      include: { product: true, supplier: true, batch: true },
    });
    return { data: stock, message: 'STOCK.UPDATED' };
  }

  async remove(id: number) {
    const stock = await this.findOne(id);
    await this.prisma.stock.update({
      where: { id },
      data: { available: false },
    });
    return { data: stock, message: 'STOCK.DELETED' };
  }
}
