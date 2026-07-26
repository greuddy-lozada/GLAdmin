import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ContextService, TenantContext } from './context.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

const PLAN_CACHE_TTL = 600;

interface CachedOrgPlan {
  organizationId: string;
  organizationSlug: string;
  planName?: string;
  features: string[];
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: ContextService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly cache: CacheService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const orgId = await this.resolveOrgId(req);
    if (!orgId) {
      await this.contextService.run({} as TenantContext, async () => {
        next();
      });
      return;
    }

    const cacheKey = `plan:${orgId}`;
    let cached = await this.cache.get<CachedOrgPlan>(cacheKey);

    if (!cached) {
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

      cached = {
        organizationId: org.id,
        organizationSlug: org.slug,
        planName: org.plan?.name,
        features,
      };
      await this.cache.set(cacheKey, cached, PLAN_CACHE_TTL);
    }

    const tokenPayload = this.extractTokenPayload(req);
    const ctx: TenantContext = {
      organizationId: cached.organizationId,
      organizationSlug: cached.organizationSlug,
      orgRole: tokenPayload.orgRole,
      plan: cached.planName
        ? { name: cached.planName, features: cached.features }
        : undefined,
      planFeatures: cached.features,
    };

    await this.contextService.run(ctx, async () => {
      next();
    });
  }

  private extractTokenPayload(req: Request): {
    sub?: string;
    orgId?: string;
    orgRole?: string;
  } {
    const authHeader = req.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') return {};
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return {};
    try {
      return this.jwtService.verify(token) as {
        sub?: string;
        orgId?: string;
        orgRole?: string;
      };
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
