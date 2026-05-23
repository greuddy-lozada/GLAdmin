'use client';

import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('settings.title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('settings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('settings.description')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
