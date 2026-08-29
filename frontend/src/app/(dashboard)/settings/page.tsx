'use client';

import { useI18n } from '@/i18n';
import { Palette } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <Card className="neo-raised border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#1a2332]">
            <Palette className="h-5 w-5 text-[#3e93c1]" />
            {t('settings.personalization')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium text-[#1a2332]">{t('settings.theme')}</p>
            <p className="text-sm text-[#5a6578]">{t('settings.themeSoftTech')}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="neo-raised border-0 shadow-none">
        <CardContent>
          <p className="text-sm text-[#5a6578]">{t('settings.description')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
