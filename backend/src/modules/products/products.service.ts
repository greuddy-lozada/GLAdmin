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
  brand?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
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
  brand?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  stocks: { existence: number }[];
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  private async enrichWithPvp(
    dto: CreateProductDto | UpdateProductDto,
  ): Promise<void> {
    const record = dto as Record<string, unknown>;
    const baseCost = record.baseCost;
    const margin = record.margin;
    const hasExplicitDollarPrice =
      'dollarPrice' in dto && dto.dollarPrice !== undefined;

    if (baseCost != null && margin != null) {
      const computed = Number(baseCost) * (1 + Number(margin) / 100);
      if (!hasExplicitDollarPrice) {
        record.dollarPrice = computed;
      }
    }

    const missingPrice =
      !('price' in dto) || dto.price === undefined || dto.price === null;
    const currentDollarPrice = hasExplicitDollarPrice
      ? dto.dollarPrice
      : (record.dollarPrice as number | undefined);

    if (missingPrice && currentDollarPrice != null && currentDollarPrice > 0) {
      try {
        const orgId = this.contextService?.getCurrent()?.organizationId;
        if (orgId) {
          const latest = await this.prisma.exchangeRateDay.findFirst({
            where: { organizationId: orgId },
            orderBy: { date: 'desc' },
          });
          if (latest?.rateBcvUsd) {
            record.price = Number(currentDollarPrice) * latest.rateBcvUsd;
          }
        }
      } catch {
        // silencioso — si falla la tasa, no bloquear la operación
      }
    }
  }

  async create(dto: CreateProductDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    await this.enrichWithPvp(dto);
    const product = await this.prisma.product.create({
      data: {
        ...dto,
        organizationId: orgId!,
      } as unknown as Prisma.ProductCreateInput,
      include: { tax: true, brand: true, category: true },
    });
    return { data: product, message: 'PRODUCT.CREATED' };
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = { available: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { tax: true, brand: true, category: true },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { tax: true, brand: true, category: true },
    });
    if (!product) throw new NotFoundException('PRODUCT.NOT_FOUND');
    return product;
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    await this.enrichWithPvp(dto);
    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: { tax: true, brand: true, category: true },
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
          brand: true,
          category: true,
          stocks: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const data = products.map((product: ProductWithStocks) => ({
      ...product,
      stock: product.stocks.reduce(
        (sum: number, s: { existence: number }) => sum + s.existence,
        0,
      ),
    })) as ProductWithStock[];

    return { data, total, page, limit };
  }
}
