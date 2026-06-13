import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  private get orgId() {
    return this.contextService?.getCurrent()?.organizationId!;
  }

  async create(dto: CreateBrandDto) {
    const brand = await this.prisma.brand.create({
      data: { ...dto, organizationId: this.orgId },
    });
    return { data: brand, message: 'BRAND.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { organizationId: this.orgId, available: true };
    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.brand.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const brand = await this.prisma.brand.findFirst({
      where: { id, organizationId: this.orgId },
    });
    if (!brand) throw new NotFoundException('BRAND.NOT_FOUND');
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto) {
    await this.findOne(id);
    const brand = await this.prisma.brand.update({ where: { id }, data: dto });
    return { data: brand, message: 'BRAND.UPDATED' };
  }

  async remove(id: number) {
    const brand = await this.findOne(id);
    await this.prisma.brand.update({ where: { id }, data: { available: false } });
    return { data: brand, message: 'BRAND.DELETED' };
  }
}
