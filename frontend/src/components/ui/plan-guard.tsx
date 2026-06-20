import { useFeature } from '@/hooks/use-feature';
import type { FeatureFlag } from '@/lib/feature-flags';
import { UpgradePrompt } from './upgrade-prompt';

interface PlanGuardProps {
  feature: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PlanGuard({ feature, children, fallback }: PlanGuardProps) {
  const hasAccess = useFeature(feature);
  if (!hasAccess) {
    return fallback ?? <UpgradePrompt feature={feature} />;
  }
  return children;
}
