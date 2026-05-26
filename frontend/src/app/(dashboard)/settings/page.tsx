'use client';

import { useI18n } from '@/i18n';
import { useTheme } from 'next-themes';
import { Sun, Moon, Palette } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.personalization')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('settings.theme')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.themeDescription')}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="gap-2"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            </Button>
          </div>
        </CardContent>
      </Card>

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
