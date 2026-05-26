import { SetMetadata } from '@nestjs/common';

export const ROLE_LEVEL: Record<string, number> = {
  master: 100,
  executive: 80,
  manager: 60,
  employee: 40,
};

export const MIN_LEVEL_KEY = 'minLevel';
export const MinLevel = (level: number) => SetMetadata(MIN_LEVEL_KEY, level);
