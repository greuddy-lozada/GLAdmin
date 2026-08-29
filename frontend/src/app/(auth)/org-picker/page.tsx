'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function OrgPickerPage() {
  const { organizations, selectOrg, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSelect = async (orgId: string) => {
    setSelectedId(orgId);
    await selectOrg(orgId);
    router.push('/dashboard');
  };

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neo-raised w-full max-w-md space-y-6 rounded-2xl p-8"
      >
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-2xl font-bold text-primary">{t('orgPicker.title')}</h2>
          <p className="text-muted-foreground">{t('orgPicker.description')}</p>
        </div>
        <div className="space-y-3">
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant="outline"
              disabled={selectedId === org.id}
              onClick={() => handleSelect(org.id)}
              className="neo-press flex h-auto w-full items-center justify-start gap-3 rounded-2xl p-4"
            >
              <Building2 className="h-8 w-8 shrink-0 text-primary" />
              <div className="text-left">
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-muted-foreground">{org.plan?.label || org.role}</div>
              </div>
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
