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

  private getCurrentOrgId(): number {
    const ctx = this.context.getCurrent();
    if (!ctx?.organizationId) {
      throw new ForbiddenException();
    }
    return ctx.organizationId;
  }

  async create(
    dto: CreateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    const organizationId = this.getCurrentOrgId();

    const existing = await this.userRepository.findByUserName(dto.userName);
    if (existing) {
      throw new ConflictException('USER.ALREADY_EXISTS');
    }

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

    const userData = await this.userFactory.createFromDto(dto);
    const user = await this.userRepository.create(userData);

    await this.prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId,
        roleId: dto.idRole,
      },
    });

    return { data: stripPassword(user), message: 'USER.CREATED' };
  }

  async findAll(): Promise<SafeUser[]> {
    const organizationId = this.getCurrentOrgId();

    const memberships = await this.prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: { include: { role: true } },
      },
    });

    return memberships.map((m) => stripPassword(m.user));
  }

  async findById(id: number): Promise<SafeUser> {
    const organizationId = this.getCurrentOrgId();

    const membership = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId: id, organizationId },
      },
      include: {
        user: { include: { role: true } },
      },
    });

    if (!membership) {
      throw new NotFoundException('USER.NOT_FOUND');
    }

    return stripPassword(membership.user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    await this.findById(id);
    const user = await this.userRepository.update(id, dto);
    return { data: stripPassword(user), message: 'USER.UPDATED' };
  }

  async delete(id: number): Promise<{ data: SafeUser; message: string }> {
    const organizationId = this.getCurrentOrgId();
    const user = await this.findById(id);

    await this.prisma.userOrganization.delete({
      where: {
        userId_organizationId: { userId: id, organizationId },
      },
    });

    await this.userRepository.delete(id);
    return { data: stripPassword(user), message: 'USER.DELETED' };
  }
}
