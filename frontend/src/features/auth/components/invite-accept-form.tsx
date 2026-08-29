'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { extractApiError } from '@/lib/api/extract-api-error';
import { authService, InvitePreview } from '@/features/auth/services/auth.service';

function InviteAcceptFormInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.trim() ?? '';
  const { registerWithInvite } = useAuth();
  const { t, tp } = useI18n();
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setPreviewError(t('auth.invite.invalid'));
        setLoadingPreview(false);
        return;
      }
      setLoadingPreview(true);
      setPreviewError('');
      try {
        const data = await authService.getInvite(code);
        if (!cancelled) {
          setPreview(data);
          const local = data.email.split('@')[0]?.replace(/[^a-zA-Z0-9._-]/g, '') ?? '';
          if (local.length >= 4) setUserName(local.slice(0, 30));
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(extractApiError(err) ?? t('auth.invite.invalid'));
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setError('');
    setLoading(true);
    try {
      await registerWithInvite({
        code,
        firstName,
        lastName,
        userName,
        password,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(extractApiError(err) ?? t('auth.invite.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingPreview) {
    return <p className="text-sm text-muted-foreground">{t('common.loading')}</p>;
  }

  if (previewError || !preview) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{previewError || t('auth.invite.invalid')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-heading font-semibold">{t('auth.invite.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tp('auth.invite.subtitle', {
            org: preview.organization.name,
            role: preview.role.name,
          })}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" value={preview.email} disabled className="h-11 px-4" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('users.field.firstName')}</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoFocus
            minLength={2}
            maxLength={20}
            disabled={loading}
            className="h-11 px-4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('users.field.lastName')}</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            minLength={2}
            maxLength={20}
            disabled={loading}
            className="h-11 px-4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userName">{t('users.field.userName')}</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            minLength={4}
            maxLength={30}
            disabled={loading}
            className="h-11 px-4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={5}
            maxLength={25}
            disabled={loading}
            className="h-11 px-4"
          />
        </div>
        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? t('auth.invite.submitting') : t('auth.invite.submit')}
        </Button>
      </form>
    </div>
  );
}

export default function InviteAcceptForm() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">{t('common.loading')}</p>}>
      <InviteAcceptFormInner />
    </Suspense>
  );
}
