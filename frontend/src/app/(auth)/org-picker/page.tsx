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
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSelect = async (orgId: number) => {
    setSelectedId(orgId);
    await selectOrg(orgId);
    router.push('/dashboard');
  };

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-md w-full"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t('orgPicker.title')}</h2>
          <p className="text-muted-foreground">{t('orgPicker.description')}</p>
        </div>
        <div className="space-y-3">
          {organizations.map((org) => (
            <Button
              key={org.id}
              variant="outline"
              disabled={selectedId === org.id}
              onClick={() => handleSelect(org.id)}
              className="w-full h-auto p-4 flex items-center gap-3 justify-start"
            >
              <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
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
