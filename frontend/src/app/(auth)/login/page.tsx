'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useUiStore } from '@/stores/ui-store';
import { useI18n } from '@/i18n';
import LoginForm from '@/features/auth/components/login-form';

export default function LoginPage() {
  const { isAuthenticated, isLoading, user, organizations } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  useEffect(() => {
    const checkBootstrap = async () => {
      try {
        const res = await fetch('/api/bootstrap/status');
        const json = await res.json();
        if (json.data?.requiresSetup) {
          router.replace('/setup');
          return;
        }
      } catch {
        // If bootstrap endpoint fails, proceed to login normally
      }
      setCheckingBootstrap(false);
    };
    checkBootstrap();
  }, [router]);

  useEffect(() => {
    if (checkingBootstrap) return;
    if (!isLoading && isAuthenticated) {
      const slug = user?.role?.slug ?? '';
      const isSystemRole = slug === 'master' || slug === 'admin';
      if (isSystemRole && organizations.length === 0) {
        router.replace('/dashboard');
        return;
      }
      const savedOrgId = localStorage.getItem('currentOrgId');
      const lastPath = useUiStore.getState().lastVisitedPath;
      useUiStore.getState().clearLastVisitedPath();
      const target = savedOrgId && lastPath ? lastPath : savedOrgId ? '/dashboard' : '/org-picker';
      router.replace(target);
    }
  }, [isLoading, isAuthenticated, checkingBootstrap, router, user, organizations]);

  if (isLoading || checkingBootstrap) {
    return <div className="min-h-screen bg-[#e4e9f2]" aria-busy="true" />;
  }

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0.01, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="marketing light min-h-screen bg-[#e4e9f2] font-heading text-[#1a2332] antialiased">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-10">
        <div>
          <motion.div {...fadeUp(0.05)}>
            <Link
              href="/"
              className="neo-raised neo-press mb-8 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#5a6578]"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('common.back')}
            </Link>
          </motion.div>

          <motion.p
            className="mb-3 font-heading text-sm font-bold tracking-wide text-[#3e93c1]"
            {...fadeUp(0.12)}
          >
            Cuadra
          </motion.p>
          <motion.h1
            className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-[#1a2332] sm:text-5xl"
            {...fadeUp(0.22)}
          >
            {t('common.slogan')}
          </motion.h1>
          <motion.p
            className="mt-4 max-w-md text-base leading-relaxed text-[#5a6578] sm:text-lg"
            {...fadeUp(0.32)}
          >
            {t('landing.hero.subtitle')}
          </motion.p>
          <motion.div
            className="neo-raised mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-[#5a6578]"
            {...fadeUp(0.4)}
          >
            <span className="size-2 rounded-full bg-[#12b886]" aria-hidden />
            {t('landing.hero.syncOnline')}
          </motion.div>
        </div>

        <motion.div
          className="neo-raised w-full rounded-3xl p-6 sm:p-8"
          initial={reduceMotion ? false : { opacity: 0.01, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <h2 className="mb-1 font-heading text-xl font-bold text-[#1a2332]">
            {t('auth.loginTitle')}
          </h2>
          <p className="mb-6 text-sm text-[#5a6578]">{t('auth.loginSubtitle')}</p>
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}
