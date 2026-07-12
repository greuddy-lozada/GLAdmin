import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ContextService, TenantContext } from './context.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: ContextService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const orgId = await this.resolveOrgId(req);
    if (!orgId) {
      await this.contextService.run({} as TenantContext, async () => {
        next();
      });
      return;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId, isActive: true },
      include: { plan: true },
    });

    if (!org) {
      await this.contextService.run({} as TenantContext, async () => {
        next();
      });
      return;
    }

    let features: string[] = [];
    try {
      features = org.plan ? JSON.parse(org.plan.features) : [];
    } catch {
      features = [];
    }

    const ctx: TenantContext = {
      organizationId: org.id,
      organizationSlug: org.slug,
      plan: org.plan ? { name: org.plan.name, features } : undefined,
      planFeatures: features,
    };

    await this.contextService.run(ctx, async () => {
      next();
    });
  }

  private extractTokenPayload(req: Request): { sub?: string; orgId?: string } {
    const authHeader = req.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') return {};
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return {};
    try {
      return this.jwtService.verify(token) as { sub?: string; orgId?: string };
    } catch {
      return {};
    }
  }

  private async resolveOrgId(req: Request): Promise<string | undefined> {
    const tokenPayload = this.extractTokenPayload(req);
    const userId = tokenPayload.sub;

    const header = req.headers['x-organization-id'];
    if (header && userId) {
      const requestedOrgId = header as string;
      const membership = await this.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: requestedOrgId,
          },
        },
      });
      if (membership) return requestedOrgId;
    }

    if (tokenPayload.orgId) return tokenPayload.orgId;

    const cookie = req.cookies?.['organization_id'];
    if (cookie) {
      return String(cookie);
    }

    return undefined;
  }
}
