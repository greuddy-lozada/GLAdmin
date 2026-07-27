import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
  MIN_LEVEL_KEY,
  MIN_ORG_LEVEL_KEY,
  ROLE_LEVEL,
} from '../decorators/min-level.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const minLevel = this.reflector.getAllAndOverride<number>(MIN_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const minOrgLevel = this.reflector.getAllAndOverride<number>(
      MIN_ORG_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request: { user?: { orgRole?: string; role?: string } } = context
      .switchToHttp()
      .getRequest();
    const user = request.user;

    if (minLevel !== undefined) {
      if (!user?.role) throw new ForbiddenException();
      const userLevel = ROLE_LEVEL[user.role as keyof typeof ROLE_LEVEL];
      if (userLevel === undefined || userLevel < minLevel)
        throw new ForbiddenException();
      return true;
    }

    if (minOrgLevel !== undefined) {
      if (!user?.orgRole) throw new ForbiddenException();
      const orgLevel = ROLE_LEVEL[user.orgRole as keyof typeof ROLE_LEVEL];
      if (orgLevel === undefined || orgLevel < minOrgLevel)
        throw new ForbiddenException();
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const effectiveRole = user?.orgRole || user?.role;
    if (!effectiveRole) throw new ForbiddenException();

    const hasRole = requiredRoles.includes(effectiveRole);
    if (!hasRole) throw new ForbiddenException();

    return true;
  }
}
