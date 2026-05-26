import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../../modules/tenant/context.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  async create(dto: CreateBatchDto) {
    const ctx = this.contextService?.getCurrent();
    const orgId = ctx?.organizationId;
    const batch = await this.prisma.batch.create({ data: { ...dto, organizationId: orgId! } as any });
    return { data: batch, message: 'BATCH.CREATED' };
  }

  async findAll() {
    return this.prisma.batch.findMany();
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
