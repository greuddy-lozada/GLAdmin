import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import * as crypto from 'crypto';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AssignUserOrgDto } from './dto/assign-user-org.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { assertCanAssignRole } from '../../common/auth/role-hierarchy';

export interface UserWithRelations {
  id: string;
  email: string;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  idRole: string;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentOrganizationId: string | null;
  role: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
  organizations: {
    userId: string;
    organizationId: string;
    roleId: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      settings: string | null;
      planId: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    role: {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }[];
}

function stripPassword<T>(obj: T): T {
  const { password: _pw, ...rest } = obj as T & { password: string };
  return rest as unknown as T;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  // ─── Organizations ───────────────────────────

  async findAllOrgs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take: limit,
        include: {
          plan: true,
          _count: { select: { userMemberships: true } },
        },
      }),
      this.prisma.organization.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOneOrg(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        plan: true,
        userMemberships: {
          include: { user: true, role: true },
        },
      },
    });
    if (!org) throw new NotFoundException('ADMIN.ORG_NOT_FOUND');
    return org;
  }

  async createOrg(dto: CreateOrgDto) {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) throw new ConflictException('ADMIN.ORG_SLUG_EXISTS');

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        planId: dto.planId ?? null,
        isActive: dto.isActive ?? true,
      },
      include: { plan: true },
    });
    return { data: org, message: 'ADMIN.ORG_CREATED' };
  }

  async updateOrg(id: string, dto: UpdateOrgDto) {
    await this.findOneOrg(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.planId !== undefined) data.planId = dto.planId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (!data.slug && data.name) {
      data.slug = slugify(data.name as string);
    }

    if (data.slug) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug: data.slug as string },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('ADMIN.ORG_SLUG_EXISTS');
      }
    }

    const org = await this.prisma.organization.update({
      where: { id },
      data,
      include: { plan: true },
    });
    return { data: org, message: 'ADMIN.ORG_UPDATED' };
  }

  async removeOrg(id: string) {
    const org = await this.findOneOrg(id);
    await this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: org, message: 'ADMIN.ORG_DELETED' };
  }

  async assignUserToOrg(orgId: string, dto: AssignUserOrgDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('ADMIN.ORG_NOT_FOUND');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('ADMIN.USER_NOT_FOUND');

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) throw new NotFoundException('ADMIN.ROLE_NOT_FOUND');
    assertCanAssignRole('master', role.slug);

    const existing = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: dto.userId, organizationId: orgId },
      },
    });
    if (existing) throw new ConflictException('ADMIN.USER_ALREADY_IN_ORG');

    const membership = await this.prisma.userOrganization.create({
      data: {
        userId: dto.userId,
        organizationId: orgId,
        roleId: dto.roleId,
      },
      include: { user: true, role: true, organization: true },
    });
    return { data: membership, message: 'ADMIN.USER_ASSIGNED' };
  }

  async removeUserFromOrg(orgId: string, userId: string) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.MEMBERSHIP_NOT_FOUND');

    await this.prisma.userOrganization.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    return { data: null, message: 'ADMIN.USER_REMOVED' };
  }

  async changeUserRole(orgId: string, userId: string, roleId: string) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.MEMBERSHIP_NOT_FOUND');

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException('ADMIN.ROLE_NOT_FOUND');
    assertCanAssignRole('master', role.slug);

    const updated = await this.prisma.userOrganization.update({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      data: { roleId },
      include: { user: true, role: true, organization: true },
    });
    return { data: updated, message: 'ADMIN.ROLE_CHANGED' };
  }

  // ─── Users ───────────────────────────────────

  async findAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          role: true,
          organizations: {
            include: { organization: true, role: true },
          },
        },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: users.map((u: UserWithRelations) => stripPassword(u)),
      total,
      page,
      limit,
    };
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        organizations: {
          include: { organization: true, role: true },
        },
      },
    });
    if (!user) throw new NotFoundException('ADMIN.USER_NOT_FOUND');
    return stripPassword(user);
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    await this.findOneUser(id);

    const data: Record<string, unknown> = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.roleId !== undefined) data.idRole = dto.roleId;

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        organizations: {
          include: { organization: true, role: true },
        },
      },
    });
    return { data: stripPassword(user), message: 'ADMIN.USER_UPDATED' };
  }

  async deactivateUser(id: string) {
    const user = await this.findOneUser(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: stripPassword(user), message: 'ADMIN.USER_DELETED' };
  }

  // ─── Plans ───────────────────────────────────

  async findAllPlans(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({ skip, take: limit }),
      this.prisma.plan.count(),
    ]);
    return { data, total, page, limit };
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('ADMIN.PLAN_NOT_FOUND');
    return plan;
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        label: dto.label,
        amount: dto.amount,
        currency: dto.currency ?? 'usd',
        interval: dto.interval,
        features: dto.features ?? '',
        maxUsers: dto.maxUsers ?? 5,
        isActive: dto.isActive ?? true,
      },
    });
    return { data: plan, message: 'ADMIN.PLAN_CREATED' };
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.findOnePlan(id);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.interval !== undefined) data.interval = dto.interval;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.maxUsers !== undefined) data.maxUsers = dto.maxUsers;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const plan = await this.prisma.plan.update({
      where: { id },
      data,
    });
    return { data: plan, message: 'ADMIN.PLAN_UPDATED' };
  }

  async removePlan(id: string) {
    const plan = await this.findOnePlan(id);
    await this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: plan, message: 'ADMIN.PLAN_DELETED' };
  }

  // ─── Max Users ───────────────────────────────

  private async checkMaxUsers(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true },
    });
    if (!org) throw new NotFoundException('ADMIN.ORG_NOT_FOUND');

    const count = await this.prisma.userOrganization.count({
      where: { organizationId },
    });

    if (org.plan && count >= org.plan.maxUsers) {
      throw new ForbiddenException('ADMIN.MAX_USERS_REACHED');
    }
  }

  // ─── Invites ─────────────────────────────────

  async findAllInvites(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invite.findMany({
        skip,
        take: limit,
        include: {
          organization: true,
          role: true,
          invitedBy: true,
        },
      }),
      this.prisma.invite.count(),
    ]);
    return { data, total, page, limit };
  }

  async createInvite(dto: CreateInviteDto, invitedById: string) {
    await this.checkMaxUsers(dto.organizationId);

    const code = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.invite.create({
      data: {
        code,
        email: dto.email,
        organizationId: dto.organizationId,
        roleId: dto.roleId,
        invitedById,
        expiresAt,
      },
      include: { organization: true, role: true },
    });
    return { data: invite, message: 'ADMIN.INVITE_CREATED' };
  }

  async removeInvite(id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException('ADMIN.INVITE_NOT_FOUND');

    await this.prisma.invite.delete({ where: { id } });
    return { data: invite, message: 'ADMIN.INVITE_DELETED' };
  }
}
