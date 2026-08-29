'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';

export function LandingFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-heading text-sm font-bold neo-accent text-[#3e93c1]">Cuadra</p>
        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-[#5a6578]">
          <a href="#producto" className="transition-colors hover:text-[#1a2332]">
            {t('landing.nav.product')}
          </a>
          <a href="#precios" className="transition-colors hover:text-[#1a2332]">
            {t('landing.nav.pricing')}
          </a>
          <a href="#faq" className="transition-colors hover:text-[#1a2332]">
            {t('landing.nav.faq')}
          </a>
          <Link href="/login" className="transition-colors hover:text-[#1a2332]">
            {t('landing.nav.login')}
          </Link>
        </nav>
        <p className="text-xs neo-muted text-[#5a6578]">
          © {year} Cuadra. {t('landing.footer.rights')}
        </p>
      </div>
    </footer>
  );
}
