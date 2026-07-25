import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { reportRegistry } from './report-registry';
import type { GenerateReportDto } from './dto/generate-report.dto';
import type { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private getOrgId(): string {
    const ctx = this.context.getCurrent();
    const orgId = ctx?.organizationId;
    if (!orgId) throw new Error('No organization context');
    return orgId;
  }

  async generate(dto: GenerateReportDto, userId: string) {
    const definition = reportRegistry.find((r) => r.type === dto.type);
    if (!definition) {
      throw new BadRequestException({
        code: 'REPORT_001',
        message: `Unknown report type: ${dto.type}`,
      });
    }

    const orgId = this.getOrgId();

    const report = await this.prisma.generatedReport.create({
      data: {
        organizationId: orgId,
        userId,
        type: dto.type,
        category: definition.category,
        name: new Date().toLocaleDateString('es-VE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        parameters: dto.parameters as Prisma.InputJsonValue,
        status: 'generating',
      },
    });

    try {
      const results = await definition.query(
        orgId,
        dto.parameters,
        this.prisma,
      );

      const updated = await this.prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          results: { rows: results } as Prisma.InputJsonValue,
          status: 'ready',
          generatedAt: new Date(),
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      });

      return {
        ...updated,
        user: undefined,
        userName: updated.user
          ? `${updated.user.firstName} ${updated.user.lastName}`
          : null,
      };
    } catch (error) {
      await this.prisma.generatedReport.update({
        where: { id: report.id },
        data: {
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw new InternalServerErrorException({
        code: 'REPORT_003',
        message: 'Report generation failed',
      });
    }
  }

  async findAll(query: ReportQueryDto) {
    const orgId = this.getOrgId();
    const { page = 1, limit = 20, category, type, fromDate, toDate } = query;

    const where: Record<string, unknown> = { organizationId: orgId };

    if (category) where.category = category;
    if (type) where.type = type;
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.gte = fromDate;
      if (toDate) dateFilter.lte = toDate;
      where.createdAt = dateFilter;
    }

    const [total, items] = await Promise.all([
      this.prisma.generatedReport.count({ where }),
      this.prisma.generatedReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      data: items.map((r) => ({
        ...r,
        user: undefined,
        userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const orgId = this.getOrgId();
    const report = await this.prisma.generatedReport.findFirst({
      where: { id, organizationId: orgId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      ...report,
      user: undefined,
      userName: report.user
        ? `${report.user.firstName} ${report.user.lastName}`
        : null,
    };
  }

  getTypes() {
    return reportRegistry.map((r) => ({
      type: r.type,
      category: r.category,
      name: r.name,
      description: r.description,
      parameters: r.parameters,
    }));
  }

  async remove(id: string) {
    const orgId = this.getOrgId();
    const report = await this.prisma.generatedReport.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.prisma.generatedReport.delete({ where: { id } });
    return { message: 'Report deleted' };
  }
}
