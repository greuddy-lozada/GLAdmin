'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#producto', labelKey: 'landing.nav.product' },
  { href: '#precios', labelKey: 'landing.nav.pricing' },
  { href: '#faq', labelKey: 'landing.nav.faq' },
] as const;

export function LandingNav() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-10"
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
    >
      <nav
        className={cn(
          'neo-raised mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6',
        )}
        aria-label={t('landing.nav.aria')}
      >
        <a href="#top" className="font-heading text-lg font-extrabold neo-accent text-[#3e93c1]">
          Cuadra
        </a>
        <div className="hidden items-center gap-6 text-sm font-medium neo-muted text-[#5a6578] md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-[#1a2332]"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </div>
        <Link
          href="/login"
          className="neo-raised neo-press rounded-xl px-4 py-2 text-sm font-semibold neo-ink text-[#1a2332]"
        >
          {t('landing.nav.login')}
        </Link>
      </nav>
    </motion.header>
  );
}
