import { useAuth } from '@/providers/auth-provider';
import type { FeatureFlag } from '@/lib/feature-flags';

export function useFeature(feature: FeatureFlag): boolean {
  const { currentOrg } = useAuth();
  const features = currentOrg?.plan?.features
    ? (() => { try { return JSON.parse(currentOrg.plan.features); } catch { return []; } })()
    : [];
  return features.includes(feature);
}
