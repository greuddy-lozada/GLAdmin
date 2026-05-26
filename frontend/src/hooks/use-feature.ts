import { useAuth } from '@/providers/auth-provider';
import { hasFeature, FeatureFlag } from '@/lib/feature-flags';

export function useFeature(feature: FeatureFlag): boolean {
  const { currentOrg } = useAuth();
  const features = currentOrg?.plan?.features
    ? (() => { try { return JSON.parse(currentOrg.plan.features); } catch { return []; } })()
    : [];
  return hasFeature(features, feature);
}
