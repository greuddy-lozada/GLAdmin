'use client';

import { motion, useReducedMotion } from 'motion/react';
import { WifiOff, Coins, Smartphone, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';
import { NeoSurface } from './neo-surface';

const BENEFITS = [
  { icon: WifiOff, titleKey: 'landing.benefits.offline.title', descKey: 'landing.benefits.offline.desc' },
  { icon: Coins, titleKey: 'landing.benefits.currency.title', descKey: 'landing.benefits.currency.desc' },
  { icon: Smartphone, titleKey: 'landing.benefits.pagoMovil.title', descKey: 'landing.benefits.pagoMovil.desc' },
  { icon: RefreshCw, titleKey: 'landing.benefits.sync.title', descKey: 'landing.benefits.sync.desc' },
] as const;

export function BenefitsSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section id="producto" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
      <motion.div
        className="mb-10 max-w-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <h2 className="font-heading text-3xl font-extrabold tracking-tight neo-ink text-[#1a2332]">
          {t('landing.benefits.title')}
        </h2>
        <p className="mt-3 neo-muted text-[#5a6578]">{t('landing.benefits.subtitle')}</p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.titleKey}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : i * 0.1 }}
            >
              <NeoSurface pressable className="flex h-full flex-col gap-3 p-5">
                <div className="neo-raised flex size-11 items-center justify-center rounded-xl neo-accent text-[#3e93c1]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-heading text-base font-bold neo-ink text-[#1a2332]">
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed neo-muted text-[#5a6578]">{t(item.descKey)}</p>
              </NeoSurface>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
