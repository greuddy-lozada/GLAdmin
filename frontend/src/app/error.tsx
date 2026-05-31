'use client';

import { useEffect } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.warn('Page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-destructive">!</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t('common.errorTitle')}
      </p>
      <Button onClick={reset} className="mt-6">
        {t('common.errorRetry')}
      </Button>
    </div>
  );
}
