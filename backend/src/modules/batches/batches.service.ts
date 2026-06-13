import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateBatchDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const batch = await this.prisma.batch.create({ data: { ...dto, organizationId: orgId! } as unknown as Prisma.BatchCreateInput });
    return { data: batch, message: 'BATCH.CREATED' };
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.BatchWhereInput = {};
    if (search) {
      where.code = { contains: search };
    }
    const [data, total] = await Promise.all([
      this.prisma.batch.findMany({ where, skip, take: limit }),
      this.prisma.batch.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('BATCH.NOT_FOUND');
    return batch;
  }

  async update(id: number, dto: UpdateBatchDto) {
    await this.findOne(id);
    const batch = await this.prisma.batch.update({ where: { id }, data: dto });
    return { data: batch, message: 'BATCH.UPDATED' };
  }

  async remove(id: number) {
    const batch = await this.findOne(id);
    await this.prisma.batch.delete({ where: { id } });
    return { data: batch, message: 'BATCH.DELETED' };
  }
}
