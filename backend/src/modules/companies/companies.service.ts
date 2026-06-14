import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateCompanyDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const company = await this.prisma.company.create({
      data: {
        ...dto,
        organizationId: orgId!,
      } as unknown as Prisma.CompanyCreateInput,
    });
    return { data: company, message: 'COMPANY.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({ skip, take: limit }),
      this.prisma.company.count(),
    ]);
    return { data, total, page, limit };
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
