import { ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

const roleLevelCache = new Map<string, number>();

export function getRoleLevel(slug: string): number | undefined {
  return roleLevelCache.get(slug);
}

export function setRoleLevels(levels: Record<string, number>): void {
  roleLevelCache.clear();
  Object.entries(levels).forEach(([slug, level]) =>
    roleLevelCache.set(slug, level),
  );
}

export function canAssignRole(actorSlug: string, targetSlug: string): boolean {
  if (targetSlug === 'admin' && actorSlug !== 'master') return false;
  const actorLevel = roleLevelCache.get(actorSlug);
  const targetLevel = roleLevelCache.get(targetSlug);
  if (actorLevel === undefined || targetLevel === undefined) return false;
  if (actorSlug === 'master') return true;
  return targetLevel < actorLevel;
}

export function assertCanAssignRole(
  actorSlug: string,
  targetSlug: string,
): void {
  if (!canAssignRole(actorSlug, targetSlug)) {
    throw new ForbiddenException('USER.ROLE_HIERARCHY');
  }
}

export function assignableRoleSlugs(actorSlug: string): string[] {
  const allSlugs = Array.from(roleLevelCache.keys());
  return allSlugs.filter((slug) => canAssignRole(actorSlug, slug));
}

@Injectable()
export class RoleHierarchyInitService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const roles = await this.prisma.role.findMany();
    const levels: Record<string, number> = {};
    for (const r of roles) {
      levels[r.slug] = r.level;
    }
    setRoleLevels(levels);
  }
}
