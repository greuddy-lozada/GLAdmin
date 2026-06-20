import { useI18n } from '@/i18n';
import type { FeatureFlag } from '@/lib/feature-flags';

interface UpgradePromptProps {
  feature: FeatureFlag;
}

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
      <p className="text-muted-foreground text-center">
        {t('common.upgrade_required')}
        <br />
        <span className="text-xs">({feature})</span>
      </p>
    </div>
  );
}
