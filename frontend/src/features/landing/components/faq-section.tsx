'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const FAQ_KEYS = ['offline', 'pricing', 'pagoMovil', 'devices', 'sync', 'support'] as const;

export function FaqSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<string | null>('offline');

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-10">
      <motion.div
        className="mb-10 text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: reduceMotion ? 0 : 0.5 }}
      >
        <h2 className="font-heading text-3xl font-extrabold tracking-tight neo-ink text-[#1a2332]">
          {t('landing.faq.title')}
        </h2>
        <p className="mt-3 neo-muted text-[#5a6578]">{t('landing.faq.subtitle')}</p>
      </motion.div>

      <div className="space-y-3">
        {FAQ_KEYS.map((key) => {
          const isOpen = open === key;
          return (
            <div
              key={key}
              className={cn('rounded-2xl', isOpen ? 'neo-inset' : 'neo-raised')}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : key)}
              >
                <span className="font-heading text-sm font-bold neo-ink text-[#1a2332] sm:text-base">
                  {t(`landing.faq.${key}.q`)}
                </span>
                <ChevronDown
                  className={cn(
                    'size-5 shrink-0 neo-muted text-[#5a6578] transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm leading-relaxed neo-muted text-[#5a6578]">
                      {t(`landing.faq.${key}.a`)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
