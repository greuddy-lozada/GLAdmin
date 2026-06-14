import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextService: ContextService,
  ) {}

  private get orgId(): number {
    const ctx = this.contextService?.getCurrent();
    const id = ctx?.organizationId;
    if (!id) throw new Error('No organization context');
    return id;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.idParent) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.idParent, organizationId: this.orgId },
      });
      if (!parent) throw new BadRequestException('CATEGORY.PARENT_NOT_FOUND');
    }
    const category = await this.prisma.category.create({
      data: { ...dto, organizationId: this.orgId },
    });
    return { data: category, message: 'CATEGORY.CREATED' };
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { organizationId: this.orgId, available: true };
    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ idParent: 'asc' as const }, { name: 'asc' }],
        include: { parent: { select: { id: true, name: true } } },
      }),
      this.prisma.category.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, organizationId: this.orgId },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          where: { available: true },
          select: { id: true, name: true },
        },
      },
    });
    if (!category) throw new NotFoundException('CATEGORY.NOT_FOUND');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.idParent) {
      if (dto.idParent === id)
        throw new BadRequestException('CATEGORY.CANNOT_BE_OWN_PARENT');
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.idParent, organizationId: this.orgId },
      });
      if (!parent) throw new BadRequestException('CATEGORY.PARENT_NOT_FOUND');
    }
    const category = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    return { data: category, message: 'CATEGORY.UPDATED' };
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    await this.prisma.category.update({
      where: { id },
      data: { available: false },
    });
    return { data: category, message: 'CATEGORY.DELETED' };
  }
}
