import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

export interface ProductWithStock {
  id: number;
  name: string;
  price: number;
  available: boolean;
  organizationId: number;
  tax?: { id: number; name: string | null; percentage: number } | null;
  stocks: { existence: number }[];
  stock: number;
}

interface ProductWithStocks {
  id: number;
  name: string;
  price: number;
  available: boolean;
  organizationId: number;
  tax?: { id: number; name: string | null; percentage: number } | null;
  stocks: { existence: number }[];
}

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
      data: { ...dto, organizationId: orgId! } as unknown as Prisma.ProductCreateInput,
      include: { tax: true },
    });
    return { data: product, message: 'PRODUCT.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { available: true },
        include: { tax: true },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { available: true } }),
    ]);
    return { data, total, page, limit };
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

  async findAllWithStock(page = 1, limit = 20) {
    const orgId = this.contextService.getCurrent()?.organizationId;
    if (!orgId) throw new Error('No organization context');
    const skip = (page - 1) * limit;
    const where = { organizationId: orgId, available: true };
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          tax: true,
          stocks: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map((product: ProductWithStocks) => ({
      ...product,
      stock: product.stocks.reduce((sum: number, s: { existence: number }) => sum + s.existence, 0),
    })) as ProductWithStock[];

    return { data, total, page, limit };
  }
}
