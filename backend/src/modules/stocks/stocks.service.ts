import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  private async recalcTotalExistence(productId: number) {
    const result = await this.prisma.stock.aggregate({
      where: { idProduct: productId },
      _sum: { existence: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: { totalExistence: result._sum.existence ?? 0 },
    });
  }

  async create(dto: CreateStockDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const stock = await this.prisma.stock.create({
      data: {
        idProduct: dto.idProduct,
        idSupplier: dto.idSupplier,
        idBatch: dto.idBatch,
        existence: dto.existence,
        organizationId: orgId!,
      },
      include: { product: true, supplier: true, batch: true },
    });
    await this.recalcTotalExistence(dto.idProduct);
    return { data: stock, message: 'STOCK.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.stock.findMany({
        where: { available: true },
        include: { product: true, supplier: true, batch: true, stockDets: true },
        skip,
        take: limit,
      }),
      this.prisma.stock.count({ where: { available: true } }),
    ]);
    return { data, total, page, limit };
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
    const before = await this.findOne(id);
    const stock = await this.prisma.stock.update({
      where: { id },
      data: dto,
      include: { product: true, supplier: true, batch: true },
    });
    if (dto.existence !== undefined) {
      await this.recalcTotalExistence(before.idProduct);
    }
    return { data: stock, message: 'STOCK.UPDATED' };
  }

  async remove(id: number) {
    const stock = await this.findOne(id);
    await this.prisma.stock.update({
      where: { id },
      data: { available: false },
    });
    await this.recalcTotalExistence(stock.idProduct);
    return { data: stock, message: 'STOCK.DELETED' };
  }
}
