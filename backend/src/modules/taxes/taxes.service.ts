import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateTaxDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const tax = await this.prisma.tax.create({
      data: {
        name: dto.name,
        percentage: dto.percentage,
        formula: dto.formula,
        organizationId: orgId!,
      },
    });
    return { data: tax, message: 'TAX.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tax.findMany({ skip, take: limit }),
      this.prisma.tax.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const tax = await this.prisma.tax.findUnique({ where: { id } });
    if (!tax) throw new NotFoundException('TAX.NOT_FOUND');
    return tax;
  }

  async update(id: number, dto: UpdateTaxDto) {
    await this.findOne(id);
    const tax = await this.prisma.tax.update({ where: { id }, data: dto });
    return { data: tax, message: 'TAX.UPDATED' };
  }

  async remove(id: number) {
    const tax = await this.findOne(id);
    await this.prisma.tax.delete({ where: { id } });
    return { data: tax, message: 'TAX.DELETED' };
  }
}
