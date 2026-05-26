import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ContextService, TenantContext } from './context.service';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: ContextService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const orgId = this.resolveOrgId(req);
    if (!orgId) {
      await this.contextService.run({} as TenantContext, async () => { next(); });
      return;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId, isActive: true },
      include: { plan: true },
    });

    if (!org) {
      await this.contextService.run({} as TenantContext, async () => { next(); });
      return;
    }

    let features: string[] = [];
    try {
      features = org.plan ? JSON.parse(org.plan.features) : [];
    } catch { features = []; }

    const ctx: TenantContext = {
      organizationId: org.id,
      organizationSlug: org.slug,
      plan: org.plan ? { name: org.plan.name, features } : undefined,
      planFeatures: features,
    };

    await this.contextService.run(ctx, async () => { next(); });
  }

  private resolveOrgId(req: Request): number | undefined {
    const header = req.headers['x-organization-id'];
    if (header) return parseInt(header as string, 10);

    const cookie = req.cookies?.['organization_id'];
    if (cookie) return parseInt(cookie, 10);

    const jwtOrg = (req as any).user?.orgId;
    if (jwtOrg) return jwtOrg;

    return undefined;
  }
}
