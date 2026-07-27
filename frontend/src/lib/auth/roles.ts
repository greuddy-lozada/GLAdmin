export const ROLE_LEVEL: Record<string, number> = {
  master: 100,
  admin: 90,
  executive: 80,
  manager: 60,
  employee: 40,
};

export function hasMinLevel(userRole: string, minLevel: number): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= minLevel;
}

export function canAssignRole(actorSlug: string, targetSlug: string): boolean {
  if (targetSlug === 'admin' && actorSlug !== 'master') return false;
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

export function assignableRoleSlugs(actorSlug: string): string[] {
  return Object.keys(ROLE_LEVEL).filter((slug) =>
    canAssignRole(actorSlug, slug),
  );
}
