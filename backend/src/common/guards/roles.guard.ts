import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MIN_LEVEL_KEY, ROLE_LEVEL } from '../decorators/min-level.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const minLevel = this.reflector.getAllAndOverride<number>(
      MIN_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const effectiveRole = user?.orgRole || user?.role;

    if (minLevel !== undefined) {
      if (!user || !effectiveRole) {
        throw new ForbiddenException();
      }

      const userLevel = ROLE_LEVEL[effectiveRole];
      if (userLevel === undefined || userLevel < minLevel) {
        throw new ForbiddenException();
      }

      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user || !effectiveRole) {
      throw new ForbiddenException();
    }

    const hasRole = requiredRoles.includes(effectiveRole);
    if (!hasRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}
