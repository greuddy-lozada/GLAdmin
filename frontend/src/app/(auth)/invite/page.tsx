'use client';

import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import InviteAcceptForm from '@/features/auth/components/invite-accept-form';
import { StripedBackground } from '@/components/ui/striped-background';

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
    <div className="relative h-full overflow-hidden">
      <StripedBackground />
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card text-foreground rounded-xl p-6 shadow-xl space-y-5">
          <div className="text-lg font-heading font-bold">Cuadra</div>
          <InviteAcceptForm />
        </div>
      </div>
    </div>
  );
}
