'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { useI18n } from '@/i18n';
import { NeoSurface } from './neo-surface';

export function FinalCtaSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-10">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <NeoSurface className="px-6 py-12 text-center sm:px-10">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight neo-ink text-[#1a2332]">
            {t('landing.finalCta.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-md neo-muted text-[#5a6578]">
            {t('landing.finalCta.subtitle')}
          </p>
          <Link
            href="/login"
            className="neo-cta mt-8 inline-flex rounded-2xl px-6 py-3.5 text-sm font-semibold"
          >
            {t('landing.finalCta.cta')}
          </Link>
        </NeoSurface>
      </motion.div>
    </section>
  );
}
