import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { REQUIRED_FEATURE_KEY } from '../decorators/feature-flag.decorator';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRED_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    if (request.user?.role === 'master') return true;

    const orgId = request.user?.orgId;

    if (!orgId) {
      throw new ForbiddenException('FEATURE.NO_ORG');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true },
    });

    if (!org?.plan) {
      throw new ForbiddenException('FEATURE.NO_PLAN');
    }

    let features: string[];
    try {
      features = JSON.parse(org.plan.features);
    } catch {
      features = [];
    }

    if (!features.includes(requiredFeature)) {
      throw new ForbiddenException('FEATURE.NOT_AVAILABLE');
    }

    return true;
  }
}
