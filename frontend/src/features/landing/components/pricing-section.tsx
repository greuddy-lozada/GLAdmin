'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { NeoSurface } from './neo-surface';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'free',
    nameKey: 'landing.pricing.free.name',
    priceKey: 'landing.pricing.free.price',
    descKey: 'landing.pricing.free.desc',
    features: [
      'landing.pricing.free.f1',
      'landing.pricing.free.f2',
      'landing.pricing.free.f3',
    ],
    highlighted: false,
  },
  {
    id: 'starter',
    nameKey: 'landing.pricing.starter.name',
    priceKey: 'landing.pricing.starter.price',
    descKey: 'landing.pricing.starter.desc',
    features: [
      'landing.pricing.starter.f1',
      'landing.pricing.starter.f2',
      'landing.pricing.starter.f3',
    ],
    highlighted: false,
  },
  {
    id: 'professional',
    nameKey: 'landing.pricing.professional.name',
    priceKey: 'landing.pricing.professional.price',
    descKey: 'landing.pricing.professional.desc',
    features: [
      'landing.pricing.professional.f1',
      'landing.pricing.professional.f2',
      'landing.pricing.professional.f3',
      'landing.pricing.professional.f4',
    ],
    highlighted: true,
  },
] as const;

export function PricingSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section id="precios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
      <motion.div
        className="mb-10 max-w-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <h2 className="font-heading text-3xl font-extrabold tracking-tight neo-ink text-[#1a2332]">
          {t('landing.pricing.title')}
        </h2>
        <p className="mt-3 neo-muted text-[#5a6578]">{t('landing.pricing.subtitle')}</p>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : i * 0.12 }}
          >
            <NeoSurface
              className={cn(
                'flex h-full flex-col p-6',
                plan.highlighted && 'ring-2 ring-[#3e93c1]/40',
              )}
            >
              {plan.highlighted && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-[#3e93c1]/15 px-2.5 py-0.5 text-xs font-semibold neo-accent text-[#3e93c1]">
                  {t('landing.pricing.popular')}
                </span>
              )}
              <h3 className="font-heading text-xl font-bold neo-ink text-[#1a2332]">
                {t(plan.nameKey)}
              </h3>
              <p className="mt-1 text-sm neo-muted text-[#5a6578]">{t(plan.descKey)}</p>
              <p className="mt-4 font-heading text-3xl font-extrabold neo-ink text-[#1a2332]">
                {t(plan.priceKey)}
                <span className="ml-1 text-sm font-medium neo-muted text-[#5a6578]">
                  {t('landing.pricing.perMonth')}
                </span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm neo-ink text-[#1a2332]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#12b886]" aria-hidden />
                    {t(f)}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={cn(
                  'mt-6 inline-flex justify-center rounded-2xl px-4 py-3 text-sm font-semibold',
                  plan.highlighted
                    ? 'neo-cta'
                    : 'neo-raised neo-press neo-ink text-[#1a2332]',
                )}
              >
                {t('landing.pricing.cta')}
              </Link>
            </NeoSurface>
          </motion.div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm neo-muted text-[#5a6578]">
        {t('landing.pricing.enterpriseNote')}
      </p>
    </section>
  );
}
