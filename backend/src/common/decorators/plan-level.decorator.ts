import { SetMetadata } from '@nestjs/common';

export const PLAN_LEVEL_KEY = 'planLevel';

export const PLAN_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export const PlanLevel = (level: string) => SetMetadata(PLAN_LEVEL_KEY, level);
