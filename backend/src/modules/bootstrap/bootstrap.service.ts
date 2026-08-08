import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { SetupDto } from './dto/setup.dto';
import { CANONICAL_ROLES } from '../../common/auth/role-hierarchy';

@Injectable()
export class BootstrapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getStatus() {
    const count = await this.prisma.organization.count();
    return { data: { requiresSetup: count === 0 } };
  }

  async setup(dto: SetupDto) {
    const existingOrgs = await this.prisma.organization.count();
    if (existingOrgs > 0) {
      throw new BadRequestException('BOOTSTRAP.ALREADY_SETUP');
    }

    const slug =
      dto.organizationSlug ??
      dto.organizationName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (emailExists) {
      throw new ConflictException('AUTH.EMAIL_EXISTS');
    }

    const slugExists = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (slugExists) {
      throw new ConflictException('BOOTSTRAP.SLUG_TAKEN');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let masterRole: { id: string; slug: string } | null = null;
      for (const r of CANONICAL_ROLES) {
        const role = await tx.role.upsert({
          where: { slug: r.slug },
          create: r,
          update: { name: r.name, type: r.type, level: r.level },
        });
        if (r.slug === 'master') masterRole = role;
      }

      let plan = await tx.plan.findFirst({ where: { name: 'Free' } });
      if (!plan) {
        plan = await tx.plan.create({
          data: {
            name: 'Free',
            label: 'Free',
            amount: 0,
            currency: 'usd',
            interval: 'month',
            features: '[]',
            maxUsers: 5,
          },
        });
      }

      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          planId: plan.id,
        },
      });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.adminPassword, salt);

      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          userName: dto.adminEmail,
          email: dto.adminEmail,
          password: hashedPassword,
          idRole: masterRole!.id,
        },
        include: { role: true },
      });

      await tx.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: masterRole!.id,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { currentOrganizationId: organization.id },
      });

      const tokenId = crypto.randomUUID();
      const rawRefresh = crypto.randomBytes(32).toString('hex');
      const refreshHash = await bcrypt.hash(rawRefresh, 10);
      await tx.refreshToken.create({
        data: {
          tokenId,
          tokenHash: refreshHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role.slug,
          orgId: organization.id,
          orgRole: masterRole!.slug,
          type: 'access',
        },
        { expiresIn: '15m' },
      );

      const { password: _, ...userWithoutPassword } = user;

      return {
        data: {
          accessToken,
          refreshToken: `${tokenId}.${rawRefresh}`,
          expiresIn: 900,
          user: userWithoutPassword,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            plan: {
              name: plan.name,
              label: plan.label,
              features: plan.features,
            },
          },
        },
        message: 'BOOTSTRAP.SETUP_SUCCESS',
      };
    });
  }
}
