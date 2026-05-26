import { SetMetadata } from '@nestjs/common';

export const REQUIRED_FEATURE_KEY = 'requiredFeature';
export const RequiresFeature = (feature: string) => SetMetadata(REQUIRED_FEATURE_KEY, feature);
