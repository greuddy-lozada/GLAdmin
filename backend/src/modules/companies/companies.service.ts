import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    const company = await this.prisma.company.create({ data: dto });
    return { data: company, message: 'COMPANY.CREATED' };
  }

  async findAll() {
    return this.prisma.company.findMany();
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('COMPANY.NOT_FOUND');
    return company;
  }

  async update(id: number, dto: UpdateCompanyDto) {
    await this.findOne(id);
    const company = await this.prisma.company.update({
      where: { id },
      data: dto,
    });
    return { data: company, message: 'COMPANY.UPDATED' };
  }

  async remove(id: number) {
    const company = await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
    return { data: company, message: 'COMPANY.DELETED' };
  }
}
