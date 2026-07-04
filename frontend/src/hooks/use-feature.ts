import { useAuth } from '@/providers/auth-provider';
import type { FeatureFlag } from '@/lib/feature-flags';
import { parsePlanFeatures } from '@/lib/parse-features';

export function useFeature(feature: FeatureFlag): boolean {
  const { currentOrg } = useAuth();
  const features = parsePlanFeatures(currentOrg?.plan?.features);
  return features.includes(feature);
}
