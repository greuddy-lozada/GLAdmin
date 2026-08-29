'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ShoppingBag, Play } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PosPreview } from './pos-preview';

export function HeroSplit() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const posY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 36]);

  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0.01, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section
      ref={sectionRef}
      id="top"
      className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10 lg:py-16"
    >
      <div>
        <motion.p
          className="mb-3 font-heading text-sm font-bold tracking-wide neo-accent text-[#3e93c1]"
          {...fadeUp(0.15)}
        >
          Cuadra
        </motion.p>
        <motion.h1
          className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight neo-ink text-[#1a2332] sm:text-5xl"
          {...fadeUp(0.28)}
        >
          {t('landing.hero.title')}
        </motion.h1>
        <motion.p
          className="mt-4 max-w-md text-base leading-relaxed neo-muted text-[#5a6578] sm:text-lg"
          {...fadeUp(0.4)}
        >
          {t('landing.hero.subtitle')}
        </motion.p>
        <motion.div className="mt-8 flex flex-wrap items-center gap-3" {...fadeUp(0.52)}>
          <Link
            href="/login"
            className="neo-cta inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
          >
            <ShoppingBag className="size-4" aria-hidden />
            {t('landing.hero.ctaPrimary')}
          </Link>
          <a
            href="#como-funciona"
            className="neo-raised neo-press inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold neo-ink text-[#1a2332]"
          >
            <Play className="size-4" aria-hidden />
            {t('landing.hero.ctaSecondary')}
          </a>
        </motion.div>
        <motion.div
          className="neo-raised mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium neo-muted text-[#5a6578]"
          {...fadeUp(0.64)}
        >
          <span className="size-2 rounded-full bg-[#12b886]" aria-hidden />
          {t('landing.hero.syncOnline')}
        </motion.div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <motion.div style={{ y: posY }}>
          <PosPreview />
        </motion.div>
      </motion.div>
    </section>
  );
}
