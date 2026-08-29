'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useI18n } from '@/i18n';
import { NeoSurface } from './neo-surface';

const QUOTES = [
  {
    quoteKey: 'landing.testimonials.q1.quote',
    nameKey: 'landing.testimonials.q1.name',
    roleKey: 'landing.testimonials.q1.role',
  },
  {
    quoteKey: 'landing.testimonials.q2.quote',
    nameKey: 'landing.testimonials.q2.name',
    roleKey: 'landing.testimonials.q2.role',
  },
  {
    quoteKey: 'landing.testimonials.q3.quote',
    nameKey: 'landing.testimonials.q3.name',
    roleKey: 'landing.testimonials.q3.role',
  },
] as const;

export function TestimonialsSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
      <motion.div
        className="mb-10 max-w-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <h2 className="font-heading text-3xl font-extrabold tracking-tight neo-ink text-[#1a2332]">
          {t('landing.testimonials.title')}
        </h2>
        <p className="mt-3 neo-muted text-[#5a6578]">{t('landing.testimonials.subtitle')}</p>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        {QUOTES.map((q, i) => (
          <motion.blockquote
            key={q.quoteKey}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : i * 0.1 }}
          >
            <NeoSurface className="flex h-full flex-col p-6">
              <p className="flex-1 text-sm leading-relaxed neo-ink text-[#1a2332]">
                &ldquo;{t(q.quoteKey)}&rdquo;
              </p>
              <footer className="mt-5">
                <cite className="not-italic font-heading text-sm font-bold neo-ink text-[#1a2332]">
                  {t(q.nameKey)}
                </cite>
                <p className="text-xs neo-muted text-[#5a6578]">{t(q.roleKey)}</p>
              </footer>
            </NeoSurface>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
