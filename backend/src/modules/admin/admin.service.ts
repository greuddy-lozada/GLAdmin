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

interface UserWithRelations {
  id: number;
  email: string;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  idRole: number;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  currentOrganizationId: number | null;
  role: { id: number; name: string; slug: string; level: number };
  organizations: {
    userId: number;
    organizationId: number;
    roleId: number;
    organization: { id: number; name: string; slug: string };
    role: { id: number; name: string; slug: string; level: number };
  }[];
}

function stripPassword<T>(obj: T): Omit<T, 'password'> {
  const { password: _pw, ...rest } = obj as any;
  return rest;
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

  async findAllOrgs() {
    return this.prisma.organization.findMany({
      include: {
        plan: true,
        _count: { select: { userMemberships: true } },
      },
    });
  }

  async findOneOrg(id: number) {
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

  async updateOrg(id: number, dto: UpdateOrgDto) {
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

  async removeOrg(id: number) {
    const org = await this.findOneOrg(id);
    await this.prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: org, message: 'ADMIN.ORG_DELETED' };
  }

  async assignUserToOrg(orgId: number, dto: AssignUserOrgDto) {
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

  async removeUserFromOrg(orgId: number, userId: number) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.MEMBERSHIP_NOT_FOUND');

    await this.prisma.userOrganization.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    return { data: null, message: 'ADMIN.USER_REMOVED' };
  }

  async changeUserRole(orgId: number, userId: number, roleId: number) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('ADMIN.MEMBERSHIP_NOT_FOUND');

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException('ADMIN.ROLE_NOT_FOUND');

    const updated = await this.prisma.userOrganization.update({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      data: { roleId },
      include: { user: true, role: true, organization: true },
    });
    return { data: updated, message: 'ADMIN.ROLE_CHANGED' };
  }

  // ─── Users ───────────────────────────────────

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      include: {
        role: true,
        organizations: {
          include: { organization: true, role: true },
        },
      },
    });
    return users.map((u: UserWithRelations) => stripPassword(u));
  }

  async findOneUser(id: number) {
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

  async updateUser(id: number, dto: UpdateUserDto) {
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

  async deactivateUser(id: number) {
    const user = await this.findOneUser(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: stripPassword(user), message: 'ADMIN.USER_DELETED' };
  }

  // ─── Plans ───────────────────────────────────

  async findAllPlans() {
    return this.prisma.plan.findMany();
  }

  async findOnePlan(id: number) {
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

  async updatePlan(id: number, dto: UpdatePlanDto) {
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

  async removePlan(id: number) {
    const plan = await this.findOnePlan(id);
    await this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: plan, message: 'ADMIN.PLAN_DELETED' };
  }

  // ─── Max Users ───────────────────────────────

  private async checkMaxUsers(organizationId: number) {
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

  async findAllInvites() {
    return this.prisma.invite.findMany({
      include: {
        organization: true,
        role: true,
        invitedBy: true,
      },
    });
  }

  async createInvite(dto: CreateInviteDto, invitedById: number) {
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

  async removeInvite(id: number) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) throw new NotFoundException('ADMIN.INVITE_NOT_FOUND');

    await this.prisma.invite.delete({ where: { id } });
    return { data: invite, message: 'ADMIN.INVITE_DELETED' };
  }
}
