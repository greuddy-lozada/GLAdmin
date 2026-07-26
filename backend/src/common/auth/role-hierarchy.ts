import { ForbiddenException } from '@nestjs/common';
import { ROLE_LEVEL } from '../decorators/min-level.decorator';

export { ROLE_LEVEL };

export function canAssignRole(actorSlug: string, targetSlug: string): boolean {
  const actorLevel = ROLE_LEVEL[actorSlug];
  const targetLevel = ROLE_LEVEL[targetSlug];
  if (actorLevel === undefined || targetLevel === undefined) {
    return false;
  }
  if (actorSlug === 'master') {
    return true;
  }
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
  return Object.keys(ROLE_LEVEL).filter((slug) =>
    canAssignRole(actorSlug, slug),
  );
}
