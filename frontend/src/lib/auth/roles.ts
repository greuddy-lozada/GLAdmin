export const ROLE_LEVEL: Record<string, number> = {
  master: 100,
  executive: 80,
  manager: 60,
  employee: 40,
};

export function hasMinLevel(userRole: string, minLevel: number): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= minLevel;
}
