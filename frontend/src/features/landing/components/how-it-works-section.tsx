'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useI18n } from '@/i18n';
import { NeoSurface } from './neo-surface';

const STEPS = [
  { num: '01', titleKey: 'landing.how.step1.title', descKey: 'landing.how.step1.desc' },
  { num: '02', titleKey: 'landing.how.step2.title', descKey: 'landing.how.step2.desc' },
  { num: '03', titleKey: 'landing.how.step3.title', descKey: 'landing.how.step3.desc' },
] as const;

export function HowItWorksSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
      <motion.div
        className="mb-10 max-w-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <h2 className="font-heading text-3xl font-extrabold tracking-tight neo-ink text-[#1a2332]">
          {t('landing.how.title')}
        </h2>
        <p className="mt-3 neo-muted text-[#5a6578]">{t('landing.how.subtitle')}</p>
      </motion.div>

      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.titleKey}
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : i * 0.15 }}
          >
            <NeoSurface className="h-full p-6">
              <span className="font-heading text-3xl font-extrabold neo-accent text-[#3e93c1]/40">
                {step.num}
              </span>
              <h3 className="mt-3 font-heading text-lg font-bold neo-ink text-[#1a2332]">
                {t(step.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed neo-muted text-[#5a6578]">{t(step.descKey)}</p>
            </NeoSurface>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
