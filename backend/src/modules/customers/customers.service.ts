import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateCustomerDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const customer = await this.prisma.customer.create({
      data: {
        ...dto,
        organizationId: orgId!,
      } as unknown as Prisma.CustomerCreateInput,
    });
    return { data: customer, message: 'CUSTOMER.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: { available: true },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where: { available: true } }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('CUSTOMER.NOT_FOUND');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });
    return { data: customer, message: 'CUSTOMER.UPDATED' };
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { available: false },
    });
    return { data: customer, message: 'CUSTOMER.DELETED' };
  }
}
