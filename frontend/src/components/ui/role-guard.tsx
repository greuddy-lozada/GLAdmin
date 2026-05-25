'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { hasMinLevel } from '@/lib/auth/roles';

interface RoleGuardProps {
  minLevel: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ minLevel, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  const role = user?.role?.slug ?? 'employee';
  return hasMinLevel(role, minLevel) ? children : fallback;
}
