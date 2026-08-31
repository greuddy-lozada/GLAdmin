import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ContextService } from '../tenant/context.service';
import { UserRepository } from './repository/user.repository';
import { UserFactory } from './user.factory';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { assertCanAssignRole } from '../../common/auth/role-hierarchy';

type SafeUser = Omit<UserEntity, 'password'>;

function stripPassword(user: UserEntity | SafeUser): SafeUser {
  if ('password' in user) {
    const { password: _, ...safe } = user;
    return safe;
  }
  return user;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userFactory: UserFactory,
    private readonly prisma: PrismaService,
    private readonly context: ContextService,
  ) {}

  private getCurrentOrgId(): string {
    const ctx = this.context.getCurrent();
    if (!ctx?.organizationId) {
      throw new ForbiddenException();
    }
    return ctx.organizationId;
  }

  private getActorRoleSlug(): string {
    const ctx = this.context.getCurrent();
    if (ctx?.isSuperAdmin || ctx?.systemRole === 'master') {
      return 'master';
    }
    if (ctx?.systemRole === 'admin') {
      return 'admin';
    }
    if (!ctx?.orgRole) {
      throw new ForbiddenException();
    }
    return ctx.orgRole;
  }

  async create(
    dto: CreateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    const organizationId = this.getCurrentOrgId();
    const actorSlug = this.getActorRoleSlug();

    const targetRole = await this.prisma.role.findUnique({
      where: { id: dto.idRole },
    });
    if (!targetRole) {
      throw new NotFoundException('USER.ROLE_NOT_FOUND');
    }
    assertCanAssignRole(actorSlug, targetRole.slug);

    const existing = await this.findIdentityMatch(dto.userName, dto.email);
    if (existing) {
      return this.restoreOrgUser(existing, dto, organizationId);
    }

    await this.assertCanAddMember(organizationId);

    const userData = await this.userFactory.createFromDto(dto);
    const user = await this.userRepository.create(userData);

    await this.prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId,
        roleId: dto.idRole,
      },
    });

    return {
      data: {
        ...stripPassword(user),
        idRole: targetRole.id,
        role: {
          id: targetRole.id,
          name: targetRole.name,
          slug: targetRole.slug,
        },
      },
      message: 'USER.CREATED',
    };
  }

  private async findIdentityMatch(userName: string, email: string) {
    const byName = await this.userRepository.findByUserName(userName);
    const byEmail = await this.userRepository.findByEmail(email);
    if (byName && byEmail && byName.id !== byEmail.id) {
      throw new ConflictException('USER.IDENTITY_CONFLICT');
    }
    return byName ?? byEmail;
  }

  private async assertCanAddMember(organizationId: string): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true },
    });
    if (org?.plan) {
      const count = await this.prisma.userOrganization.count({
        where: { organizationId },
      });
      if (count >= org.plan.maxUsers) {
        throw new ForbiddenException('ADMIN.MAX_USERS_REACHED');
      }
    }
  }

  private async restoreOrgUser(
    existing: UserEntity,
    dto: CreateUserDto,
    organizationId: string,
  ): Promise<{ data: SafeUser; message: string }> {
    const membership = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: existing.id, organizationId },
      },
    });

    if (membership && existing.isActive) {
      throw new ConflictException('USER.ALREADY_IN_ORG');
    }

    if (!membership) {
      await this.assertCanAddMember(organizationId);
    }

    if (!existing.isActive) {
      const userData = await this.userFactory.createFromDto(dto);
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          password: userData.password,
          isActive: true,
          deletedAt: null,
          currentOrganizationId: organizationId,
        },
      });
    } else if (!existing.currentOrganizationId) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { currentOrganizationId: organizationId },
      });
    }

    if (!membership) {
      await this.prisma.userOrganization.create({
        data: {
          userId: existing.id,
          organizationId,
          roleId: dto.idRole,
        },
      });
    } else {
      await this.prisma.userOrganization.update({
        where: {
          userId_organizationId: { userId: existing.id, organizationId },
        },
        data: { roleId: dto.idRole },
      });
    }

    const restored = await this.findById(existing.id);
    return { data: restored, message: 'USER.CREATED' };
  }

  async findAll(page = 1, limit = 20) {
    const organizationId = this.getCurrentOrgId();
    const skip = (page - 1) * limit;
    const where = { organizationId };

    const [memberships, total] = await Promise.all([
      this.prisma.userOrganization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { updatedAt: 'desc' } },
        include: {
          user: { include: { role: true } },
          role: true,
        },
      }),
      this.prisma.userOrganization.count({ where }),
    ]);

    const data = memberships.map(
      (m: {
        user: UserEntity;
        roleId: string;
        role: { id: string; name: string; slug: string };
      }) => ({
        ...stripPassword(m.user),
        idRole: m.roleId,
        role: {
          id: m.role.id,
          name: m.role.name,
          slug: m.role.slug,
        },
      }),
    );
    return { data, total, page, limit };
  }

  async findById(id: string): Promise<SafeUser> {
    const organizationId = this.getCurrentOrgId();

    const membership = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: id, organizationId },
      },
      include: {
        user: { include: { role: true } },
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('USER.NOT_FOUND');
    }

    return {
      ...stripPassword(membership.user),
      idRole: membership.roleId,
      role: {
        id: membership.role.id,
        name: membership.role.name,
        slug: membership.role.slug,
      },
    };
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    const organizationId = this.getCurrentOrgId();
    const actorSlug = this.getActorRoleSlug();

    const membership = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: id, organizationId },
      },
      include: { role: true },
    });
    if (!membership) {
      throw new NotFoundException('USER.NOT_FOUND');
    }

    assertCanAssignRole(actorSlug, membership.role.slug);

    if (dto.idRole !== undefined) {
      const targetRole = await this.prisma.role.findUnique({
        where: { id: dto.idRole },
      });
      if (!targetRole) {
        throw new NotFoundException('USER.ROLE_NOT_FOUND');
      }
      assertCanAssignRole(actorSlug, targetRole.slug);

      await this.prisma.userOrganization.update({
        where: {
          userId_organizationId: { userId: id, organizationId },
        },
        data: { roleId: dto.idRole },
      });
    }

    await this.userRepository.update(id, dto);
    const updated = await this.findById(id);
    return { data: updated, message: 'USER.UPDATED' };
  }

  async delete(id: string): Promise<{ data: SafeUser; message: string }> {
    const organizationId = this.getCurrentOrgId();
    const user = await this.findById(id);

    await this.prisma.userOrganization.delete({
      where: {
        userId_organizationId: { userId: id, organizationId },
      },
    });

    if (user.currentOrganizationId === organizationId) {
      await this.prisma.user.update({
        where: { id },
        data: { currentOrganizationId: null },
      });
    }

    return { data: stripPassword(user), message: 'USER.DELETED' };
  }
}
