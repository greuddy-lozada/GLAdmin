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

export function isPlatformOperator(slug: string | undefined): boolean {
  return slug === 'master' || slug === 'admin';
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

/** Canonical role levels — keep in sync with ROLE_LEVEL / security.md. */
export const CANONICAL_ROLES: {
  name: string;
  slug: string;
  type: string;
  level: number;
}[] = [
  { name: 'Master', slug: 'master', type: 'system', level: 100 },
  { name: 'Admin', slug: 'admin', type: 'system', level: 90 },
  { name: 'Executive', slug: 'executive', type: 'org', level: 80 },
  { name: 'Manager', slug: 'manager', type: 'org', level: 60 },
  { name: 'Employee', slug: 'employee', type: 'org', level: 40 },
];

@Injectable()
export class RoleHierarchyInitService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const r of CANONICAL_ROLES) {
      await this.prisma.role.upsert({
        where: { slug: r.slug },
        create: r,
        update: { name: r.name, type: r.type, level: r.level },
      });
    }
    const roles = await this.prisma.role.findMany();
    const levels: Record<string, number> = {};
    for (const role of roles) {
      levels[role.slug] = role.level;
    }
    setRoleLevels(levels);
  }
}
