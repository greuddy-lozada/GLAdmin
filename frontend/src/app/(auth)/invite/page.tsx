'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import InviteAcceptForm from '@/features/auth/components/invite-accept-form';

export default function InvitePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return null;

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-background p-4">
      <div className="neo-raised w-full max-w-sm space-y-5 rounded-2xl p-6 text-foreground">
        <div className="text-lg font-heading font-bold text-primary">Cuadra</div>
        <InviteAcceptForm />
      </div>
    </div>
  );
}
