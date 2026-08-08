import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface LogApprovalParams {
  action: string;
  entity: string;
  entityId: string;
  description: string;
  performedById: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AdminApprovalsService {
  private readonly logger = new Logger(AdminApprovalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogApprovalParams) {
    return this.prisma.adminApproval.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        performedById: params.performedById,
        metadata: (params.metadata ?? {}) as object,
      },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.adminApproval.findMany({
        skip,
        take: limit,
        where,
        orderBy: { performedAt: 'desc' },
        include: {
          performedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.adminApproval.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const record = await this.prisma.adminApproval.findUnique({
      where: { id },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!record) throw new NotFoundException('ADMIN_APPROVAL_NOT_FOUND');
    return record;
  }

  async approve(id: string, approvedById: string) {
    const record = await this.findOne(id);
    if (record.status !== 'pending')
      throw new ForbiddenException('ADMIN_APPROVAL_ALREADY_REVIEWED');
    return this.prisma.adminApproval.update({
      where: { id },
      data: { status: 'approved', approvedById, approvedAt: new Date() },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async reject(id: string, approvedById: string, reason?: string) {
    const record = await this.findOne(id);
    if (record.status !== 'pending')
      throw new ForbiddenException('ADMIN_APPROVAL_ALREADY_REVIEWED');
    await this.compensate(record);
    return this.prisma.adminApproval.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedById,
        approvedAt: new Date(),
        rejectionReason: reason ?? null,
      },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  private async compensate(record: {
    action: string;
    entity: string;
    entityId: string;
    metadata: unknown;
  }) {
    const meta = (record.metadata ?? {}) as Record<string, unknown>;
    try {
      switch (record.action) {
        case 'CREATE_ORG':
          await this.prisma.organization.update({
            where: { id: record.entityId },
            data: { isActive: false, deletedAt: new Date() },
          });
          break;
        case 'UPDATE_ORG': {
          const old = meta.oldValues as Record<string, unknown> | undefined;
          if (!old) throw new Error('missing oldValues');
          await this.prisma.organization.update({
            where: { id: record.entityId },
            data: old as never,
          });
          break;
        }
        case 'DELETE_ORG':
          await this.prisma.organization.update({
            where: { id: record.entityId },
            data: { isActive: true, deletedAt: null },
          });
          break;
        case 'CREATE_PLAN':
          await this.prisma.plan.update({
            where: { id: record.entityId },
            data: { isActive: false },
          });
          break;
        case 'UPDATE_PLAN': {
          const oldPlan = meta.oldValues as Record<string, unknown> | undefined;
          if (!oldPlan) throw new Error('missing oldValues');
          await this.prisma.plan.update({
            where: { id: record.entityId },
            data: oldPlan as never,
          });
          break;
        }
        case 'DELETE_PLAN':
          await this.prisma.plan.update({
            where: { id: record.entityId },
            data: { isActive: true },
          });
          break;
        case 'CREATE_ADMIN_USER':
          await this.prisma.user.update({
            where: { id: record.entityId },
            data: { isActive: false },
          });
          break;
        case 'UPDATE_ADMIN_USER': {
          const oldUser = meta.oldValues as Record<string, unknown> | undefined;
          if (!oldUser) throw new Error('missing oldValues');
          await this.prisma.user.update({
            where: { id: record.entityId },
            data: oldUser as never,
          });
          break;
        }
        case 'DEACTIVATE_ADMIN_USER':
          await this.prisma.user.update({
            where: { id: record.entityId },
            data: { isActive: true },
          });
          break;
        case 'ASSIGN_USER_ORG': {
          const userId = meta.userId as string | undefined;
          const orgId = meta.orgId as string | undefined;
          if (!userId || !orgId) throw new Error('missing membership keys');
          await this.prisma.userOrganization.delete({
            where: {
              userId_organizationId: {
                userId,
                organizationId: orgId,
              },
            },
          });
          break;
        }
        case 'REMOVE_USER_ORG': {
          const oldMembership = meta.oldMembership as
            | {
                userId: string;
                organizationId: string;
                roleId: string;
              }
            | undefined;
          if (!oldMembership) throw new Error('missing oldMembership');
          await this.prisma.userOrganization.create({
            data: {
              userId: oldMembership.userId,
              organizationId: oldMembership.organizationId,
              roleId: oldMembership.roleId,
            },
          });
          break;
        }
        case 'CHANGE_USER_ROLE': {
          const oldRoleId = meta.oldRoleId as string | undefined;
          const userId = meta.userId as string | undefined;
          const orgId = meta.orgId as string | undefined;
          if (!oldRoleId || !userId || !orgId) {
            throw new Error('missing role revert keys');
          }
          await this.prisma.userOrganization.update({
            where: {
              userId_organizationId: {
                userId,
                organizationId: orgId,
              },
            },
            data: { roleId: oldRoleId },
          });
          break;
        }
        case 'CREATE_INVITE':
          await this.prisma.invite.delete({ where: { id: record.entityId } });
          break;
        case 'DELETE_INVITE': {
          const oldInvite = meta.oldInvite as
            | Record<string, unknown>
            | undefined;
          if (!oldInvite) throw new Error('missing oldInvite');
          const {
            id: _id,
            createdAt: _ca,
            updatedAt: _ua,
            ...rest
          } = oldInvite;
          await this.prisma.invite.create({ data: rest as never });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      this.logger.error(
        `Compensation failed for ${record.action} ${record.entityId}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException(
        'ADMIN_APPROVAL_COMPENSATE_FAILED',
      );
    }
  }
}
