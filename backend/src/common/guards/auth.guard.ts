import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request: {
      headers: Record<string, string | string[] | undefined>;
      user?: Record<string, unknown>;
    } = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException();
      }

      const orgId =
        typeof payload.orgId === 'string' ? payload.orgId : undefined;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          isActive: true,
          email: true,
          role: { select: { slug: true } },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      let membershipOrgRole: string | undefined;
      if (orgId) {
        const membership = await this.prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: payload.sub as string,
              organizationId: orgId,
            },
          },
          select: { role: { select: { slug: true } } },
        });
        membershipOrgRole = membership?.role.slug;
      }

      request.user = {
        id: payload.sub,
        email: user.email ?? payload.email,
        // Prefer live DB system role over JWT claim (stale after role change).
        role: user.role?.slug ?? payload.role,
        orgId,
        orgRole: membershipOrgRole ?? payload.orgRole,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: {
    headers: Record<string, string | string[] | undefined>;
  }): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
