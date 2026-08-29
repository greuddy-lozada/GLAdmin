import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UserRepository } from '../users/repository/user.repository';
import { AuthFactory } from './auth.factory';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SubscriptionLifecycleService } from '../subscriptions/subscription-lifecycle.service';

interface UserOrganizationWithRelations {
  userId: string;
  organizationId: string;
  roleId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: {
      id: string;
      name: string;
      label: string;
      features: string;
    } | null;
    subscriptionStatus: string;
    subscriptionExpiresAt: Date | null;
  };
  role: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authFactory: AuthFactory,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly subscriptionLifecycle: SubscriptionLifecycleService,
  ) {}

  async getInvitePreview(code: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        role: { select: { id: true, name: true, slug: true, type: true } },
      },
    });

    if (!invite || invite.used || invite.expiresAt <= new Date()) {
      throw new NotFoundException('AUTH.INVITE_INVALID');
    }

    return {
      data: {
        email: invite.email,
        organization: invite.organization,
        role: {
          id: invite.role.id,
          name: invite.role.name,
          slug: invite.role.slug,
        },
        expiresAt: invite.expiresAt,
      },
      message: 'AUTH.INVITE_VALID',
    };
  }

  async registerWithInvite(dto: RegisterWithInviteDto) {
    const invite = await this.prisma.invite.findUnique({
      where: { code: dto.code },
      include: {
        role: true,
        organization: { include: { plan: true } },
      },
    });

    if (!invite || invite.used || invite.expiresAt <= new Date()) {
      throw new NotFoundException('AUTH.INVITE_INVALID');
    }

    if (invite.role.type !== 'org') {
      throw new BadRequestException('AUTH.INVITE_ROLE_INVALID');
    }

    const emailTaken = await this.userRepository.findByEmail(invite.email);
    if (emailTaken) {
      throw new ConflictException('AUTH.EMAIL_ALREADY_EXISTS');
    }

    const userNameTaken = await this.userRepository.findByUserName(
      dto.userName,
    );
    if (userNameTaken) {
      throw new ConflictException('AUTH.USERNAME_ALREADY_EXISTS');
    }

    if (invite.organization.plan) {
      const count = await this.prisma.userOrganization.count({
        where: { organizationId: invite.organizationId },
      });
      if (count >= invite.organization.plan.maxUsers) {
        throw new ForbiddenException('ADMIN.MAX_USERS_REACHED');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const userId = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invite.updateMany({
        where: { id: invite.id, used: false },
        data: { used: true },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('AUTH.INVITE_ALREADY_USED');
      }

      const user = await tx.user.create({
        data: {
          email: invite.email,
          userName: dto.userName,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
          idRole: invite.roleId,
          isActive: true,
          currentOrganizationId: invite.organizationId,
        },
      });

      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: invite.organizationId,
          roleId: invite.roleId,
        },
      });

      return user.id;
    });

    this.auditLog
      .log({
        organizationId: invite.organizationId,
        userId,
        action: 'REGISTER_WITH_INVITE',
        entity: 'Invite',
        entityId: invite.id,
        metadata: { email: invite.email },
      })
      .catch(() => {});

    return this.login({ email: invite.email, password: dto.password });
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.auditLog
        .log({
          organizationId: '',
          userId: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          metadata: { reason: 'wrong_password', email: dto.email },
        })
        .catch(() => {});
      throw new UnauthorizedException('AUTH.INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      await this.auditLog
        .log({
          organizationId: '',
          userId: user.id,
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          metadata: { reason: 'inactive_user', email: dto.email },
        })
        .catch(() => {});
      throw new UnauthorizedException('AUTH.USER_INACTIVE');
    }

    const { raw, hash, tokenId } =
      await this.authFactory.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        tokenId,
        tokenHash: hash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const organizations = await this.getUserOrgs(user.id);

    this.auditLog
      .log({
        organizationId: organizations[0]?.id ?? '',
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
      })
      .catch(() => {});
    const loginResponse = this.authFactory.createLoginResponse(user, raw);

    if (organizations.length === 0) {
      return {
        data: { ...loginResponse, organizations: [] },
        message: 'AUTH.LOGIN_SUCCESS',
      };
    }

    if (organizations.length === 1) {
      const org = organizations[0];
      await this.prisma.user.update({
        where: { id: user.id },
        data: { currentOrganizationId: org.id },
      });

      const accessToken = this.authFactory.createOrgAccessToken(
        user,
        org.id,
        org.role,
      );
      return {
        data: {
          ...loginResponse,
          accessToken,
          // System role stays on user; org membership role on organization.role
          user: loginResponse.user,
          organizations,
          organization: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan
              ? {
                  name: org.plan.name,
                  label: org.plan.label,
                  features: org.plan.features,
                }
              : null,
            subscriptionStatus: org.subscriptionStatus,
            subscriptionExpiresAt: org.subscriptionExpiresAt,
            role: org.role,
          },
        },
        message: 'AUTH.LOGIN_SUCCESS',
      };
    }

    return {
      data: { ...loginResponse, organizations },
      message: 'AUTH.LOGIN_SUCCESS',
    };
  }

  async selectOrg(userId: string, organizationId: string) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      include: {
        organization: { include: { plan: true } },
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('AUTH.NOT_ORG_MEMBER');
    }

    this.subscriptionLifecycle
      .evaluateSubscription(organizationId)
      .catch((err) => {
        this.auditLog
          .log({
            organizationId,
            userId,
            action: 'SUBSCRIPTION_EVAL_FAILED',
            entity: 'Organization',
            entityId: organizationId,
            metadata: {
              error: err instanceof Error ? err.message : String(err),
            },
          })
          .catch(() => {});
      });

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentOrganizationId: organizationId },
    });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    const { raw, hash, tokenId } =
      await this.authFactory.generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        tokenId,
        tokenHash: hash,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.authFactory.createOrgAccessToken(
      user,
      organizationId,
      membership.role.slug,
    );

    const { password: _, ...userWithoutPassword } = user;
    return {
      data: {
        accessToken,
        refreshToken: raw,
        expiresIn: 900,
        // Keep system role on user; org membership role lives on organization.role
        user: userWithoutPassword,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          plan: membership.organization.plan
            ? {
                name: membership.organization.plan.name,
                label: membership.organization.plan.label,
                features: membership.organization.plan.features,
              }
            : null,
          subscriptionStatus: membership.organization.subscriptionStatus,
          subscriptionExpiresAt: membership.organization.subscriptionExpiresAt,
          role: membership.role.slug,
        },
      },
      message: 'AUTH.ORG_SELECTED',
    };
  }

  async refresh(dto: RefreshDto) {
    const dotIndex = dto.refreshToken.indexOf('.');
    if (dotIndex === -1) {
      throw new UnauthorizedException('AUTH.INVALID_REFRESH_TOKEN');
    }

    const tokenId = dto.refreshToken.substring(0, dotIndex);
    const rawSecret = dto.refreshToken.substring(dotIndex + 1);

    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenId, expiresAt: { gt: new Date() } },
      include: { user: { include: { role: true } } },
    });

    if (!token) {
      throw new UnauthorizedException('AUTH.INVALID_REFRESH_TOKEN');
    }

    const isValid = await this.authFactory.compareRefreshToken(
      rawSecret,
      token.tokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('AUTH.INVALID_REFRESH_TOKEN');
    }

    const user = token.user;

    await this.prisma.refreshToken.delete({
      where: { id: token.id },
    });

    const {
      raw,
      hash,
      tokenId: newTokenId,
    } = await this.authFactory.generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        tokenId: newTokenId,
        tokenHash: hash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const fullUser = await this.userRepository.findById(user.id);
    if (!fullUser) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    let accessToken: string;
    if (fullUser.currentOrganizationId) {
      const membership = await this.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: fullUser.currentOrganizationId,
          },
        },
        include: { role: true },
      });
      if (membership) {
        accessToken = this.authFactory.createOrgAccessToken(
          fullUser,
          fullUser.currentOrganizationId,
          membership.role.slug,
        );
      } else {
        accessToken = this.authFactory.createAccessToken(fullUser);
      }
    } else {
      accessToken = this.authFactory.createAccessToken(fullUser);
    }

    return {
      data: { accessToken, refreshToken: raw, expiresIn: 900 },
      message: 'AUTH.TOKEN_REFRESHED',
    };
  }

  async me(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('AUTH.USER_INACTIVE');
    }

    const { password: _, ...userWithoutPassword } = user;

    // Always return system role on user — org role is in JWT orgRole / organization.role
    return { data: userWithoutPassword, message: 'AUTH.USER_FOUND' };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { data: null, message: 'AUTH.LOGOUT_SUCCESS' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('AUTH.USER_NOT_FOUND');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new ForbiddenException('AUTH.INVALID_OLD_PASSWORD');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: false },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { data: null, message: 'AUTH.PASSWORD_CHANGED' };
  }

  private async getUserOrgs(userId: string) {
    const userOrgs: UserOrganizationWithRelations[] =
      await this.prisma.userOrganization.findMany({
        where: { userId },
        include: {
          organization: { include: { plan: true } },
          role: true,
        },
      });

    return userOrgs.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.name,
      slug: uo.organization.slug,
      plan: uo.organization.plan
        ? {
            name: uo.organization.plan.name,
            label: uo.organization.plan.label,
            features: uo.organization.plan.features,
          }
        : null,
      role: uo.role.slug,
      subscriptionStatus: uo.organization.subscriptionStatus,
      subscriptionExpiresAt: uo.organization.subscriptionExpiresAt,
    }));
  }
}
