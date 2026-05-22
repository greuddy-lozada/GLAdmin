import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaxDto) {
    const tax = await this.prisma.tax.create({ data: dto });
    return { data: tax, message: 'TAX.CREATED' };
  }

  async findAll() {
    return this.prisma.tax.findMany();
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
