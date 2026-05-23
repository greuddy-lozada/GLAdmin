'use client';

import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div>
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('settings.description')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
