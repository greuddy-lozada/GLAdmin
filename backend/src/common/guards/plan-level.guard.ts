import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_LEVEL_KEY, PLAN_ORDER } from '../decorators/plan-level.decorator';
import { ContextService } from '../../modules/tenant/context.service';

@Injectable()
export class PlanLevelGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly context: ContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevel = this.reflector.getAllAndOverride<string>(
      PLAN_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredLevel) return true;

    const required = PLAN_ORDER[requiredLevel];
    if (required === undefined) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    if (request.user?.role === 'master') return true;

    const ctx = this.context.getCurrent();
    const planName = ctx?.plan?.name;

    if (!planName) {
      throw new ForbiddenException('PLAN.NO_PLAN');
    }

    const current = PLAN_ORDER[planName];
    if (current === undefined || current < required) {
      throw new ForbiddenException('PLAN.UPGRADE_REQUIRED');
    }

    return true;
  }
}
