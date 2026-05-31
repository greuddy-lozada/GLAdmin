'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SetupPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    orgName: '',
    orgSlug: '',
    adminEmail: '',
    adminPassword: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useI18n();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bootstrap/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: form.orgName,
          organizationSlug: form.orgSlug || form.orgName.toLowerCase().replace(/\s+/g, '-'),
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          firstName: form.firstName,
          lastName: form.lastName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.errors || t('bootstrap.error'));

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      await login(form.adminEmail, form.adminPassword);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: t('bootstrap.step.org'), fields: ['orgName', 'orgSlug'] },
    { title: t('bootstrap.step.admin'), fields: ['firstName', 'lastName', 'adminEmail', 'adminPassword'] },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('bootstrap.title')}</h1>
          <p className="text-muted-foreground">{t('bootstrap.subtitle')}</p>
        </div>

        <div className="flex gap-2 justify-center">
          {steps.map((s, i) => (
            <div key={i} className={`h-2 w-16 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>{t('bootstrap.field.orgName')}</Label>
                <Input
                  value={form.orgName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      orgName: e.target.value,
                      orgSlug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    }))
                  }
                  placeholder="My Company"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('bootstrap.field.orgSlug')}</Label>
                <Input
                  value={form.orgSlug}
                  onChange={(e) => setForm((f) => ({ ...f, orgSlug: e.target.value }))}
                  placeholder="my-company"
                />
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('bootstrap.field.firstName')}</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('bootstrap.field.lastName')}</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('bootstrap.field.email')}</Label>
                <Input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('bootstrap.field.password')}</Label>
                <Input
                  type="password"
                  value={form.adminPassword}
                  onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
              {t('bootstrap.back')}
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="flex-1">
              {t('bootstrap.next')}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? t('bootstrap.loading') : t('bootstrap.finish')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
