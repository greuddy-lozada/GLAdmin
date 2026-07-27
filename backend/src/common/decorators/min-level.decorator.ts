import { SetMetadata } from '@nestjs/common';

export const ROLE_LEVEL = {
  master: 100,
  admin: 90,
  executive: 80,
  manager: 60,
  employee: 40,
} as const;

export const MIN_LEVEL_KEY = 'minLevel';
export const MinLevel = (level: number) => SetMetadata(MIN_LEVEL_KEY, level);

export const MIN_ORG_LEVEL_KEY = 'minOrgLevel';
export const MinOrgLevel = (level: number) =>
  SetMetadata(MIN_ORG_LEVEL_KEY, level);
