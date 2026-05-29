import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateProductDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const product = await this.prisma.product.create({
      data: { ...dto, organizationId: orgId! } as any,
      include: { tax: true },
    });
    return { data: product, message: 'PRODUCT.CREATED' };
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { available: true },
      include: { tax: true },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { tax: true },
    });
    if (!product) throw new NotFoundException('PRODUCT.NOT_FOUND');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: { tax: true },
    });
    return { data: product, message: 'PRODUCT.UPDATED' };
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    await this.prisma.product.update({
      where: { id },
      data: { available: false },
    });
    return { data: product, message: 'PRODUCT.DELETED' };
  }

  async findAllWithStock() {
    const orgId = this.contextService.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const products = await this.prisma.product.findMany({
      where: { organizationId: orgId, available: true },
      include: {
        tax: true,
        stocks: true,
      },
    });

    return products.map((product) => ({
      ...product,
      stock: product.stocks.reduce((sum, s) => sum + s.existence, 0),
    }));
  }
}
