'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t('common.pageNotFound')}
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">{t('common.goHome')}</Link>
      </Button>
    </div>
  );
}
