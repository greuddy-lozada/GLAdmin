import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  private getOrgId(): string {
    const orgId = this.contextService.getCurrent()?.organizationId;
    if (!orgId) {
      throw new ForbiddenException();
    }
    return orgId;
  }

  async create(dto: CreateCompanyDto) {
    const organizationId = this.getOrgId();
    const company = await this.prisma.company.create({
      data: {
        ...dto,
        organizationId,
      } as unknown as Prisma.CompanyCreateInput,
    });
    return { data: company, message: 'COMPANY.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const organizationId = this.getOrgId();
    const skip = (page - 1) * limit;
    const where = { organizationId };
    const [data, total] = await Promise.all([
      this.prisma.company.findMany({ where, skip, take: limit }),
      this.prisma.company.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const organizationId = this.getOrgId();
    const company = await this.prisma.company.findFirst({
      where: { id, organizationId },
    });
    if (!company) throw new NotFoundException('COMPANY.NOT_FOUND');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    const company = await this.prisma.company.update({
      where: { id },
      data: dto,
    });
    return { data: company, message: 'COMPANY.UPDATED' };
  }

  async remove(id: string) {
    const company = await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
    return { data: company, message: 'COMPANY.DELETED' };
  }
}
