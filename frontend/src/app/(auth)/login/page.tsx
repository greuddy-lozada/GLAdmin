'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '@/features/auth/components/login-form';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return null;

  return <LoginForm />;
}
