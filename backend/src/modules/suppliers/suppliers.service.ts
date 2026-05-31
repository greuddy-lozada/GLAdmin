import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateSupplierDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const supplier = await this.prisma.supplier.create({
      data: {
        companyName: dto.companyName,
        businessName: dto.businessName,
        fiscalAddress: dto.fiscalAddress,
        taxId: dto.taxId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        address: dto.address,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        taxWithholdingAgent: dto.taxWithholdingAgent,
        organizationId: orgId!,
      },
    });
    return { data: supplier, message: 'SUPPLIER.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { available: true },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where: { available: true } }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('SUPPLIER.NOT_FOUND');
    return supplier;
  }

  async update(id: number, dto: UpdateSupplierDto) {
    await this.findOne(id);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
    return { data: supplier, message: 'SUPPLIER.UPDATED' };
  }

  async remove(id: number) {
    const supplier = await this.findOne(id);
    await this.prisma.supplier.update({
      where: { id },
      data: { available: false },
    });
    return { data: supplier, message: 'SUPPLIER.DELETED' };
  }
}
