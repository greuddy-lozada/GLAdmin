'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useI18n } from '@/i18n';
import { ShoppingBag, Package, Search } from 'lucide-react';

const PRODUCTS = [
  { nameKey: 'landing.pos.product1', price: '45,00', stock: '24' },
  { nameKey: 'landing.pos.product2', price: '12,50', stock: '80' },
  { nameKey: 'landing.pos.product3', price: '8,00', stock: '120' },
] as const;

export function PosPreview() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <div className="neo-raised overflow-hidden rounded-2xl md:rounded-3xl">
      <div className="flex min-h-[320px] md:min-h-[400px]">
        {/* Sidebar */}
        <aside className="hidden w-20 shrink-0 flex-col gap-2 border-r border-black/5 p-3 sm:flex">
          {[
            { icon: ShoppingBag, active: true, label: t('landing.pos.navSale') },
            { icon: Package, active: false, label: t('landing.pos.navProducts') },
          ].map(({ icon: Icon, active, label }) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] ${
                active ? 'neo-raised neo-accent text-[#3e93c1]' : 'neo-muted text-[#5a6578]'
              }`}
            >
              <Icon className="size-4" aria-hidden />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </aside>

        {/* Products */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          <div className="neo-inset flex items-center gap-2 rounded-xl px-3 py-2 text-sm neo-muted text-[#5a6578]">
            <Search className="size-4 shrink-0" aria-hidden />
            <span>{t('landing.pos.search')}</span>
          </div>

          <ul className="flex flex-1 flex-col gap-2">
            {PRODUCTS.map((p) => (
              <li
                key={p.nameKey}
                className="neo-raised flex items-center justify-between rounded-xl px-3 py-2.5 text-sm"
              >
                <div>
                  <p className="font-semibold neo-ink text-[#1a2332]">{t(p.nameKey)}</p>
                  <p className="text-xs neo-muted text-[#5a6578]">
                    {t('landing.pos.stock')}: {p.stock}
                  </p>
                </div>
                <span className="tabular-nums font-semibold neo-accent text-[#3e93c1]">
                  {p.price} VES
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cart */}
        <div className="flex w-[40%] min-w-[140px] max-w-[200px] flex-col border-l border-black/5 p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide neo-muted text-[#5a6578]">
            {t('landing.pos.cart')}
          </p>
          <div className="mb-3 flex-1 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <span className="truncate neo-ink text-[#1a2332]">{t('landing.pos.product1')}</span>
              <span className="tabular-nums neo-muted text-[#5a6578]">×1</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="truncate neo-ink text-[#1a2332]">{t('landing.pos.product2')}</span>
              <span className="tabular-nums neo-muted text-[#5a6578]">×2</span>
            </div>
          </div>
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span>{t('landing.pos.total')}</span>
            <span className="tabular-nums neo-accent text-[#3e93c1]">70,00 VES</span>
          </div>
          <motion.button
            type="button"
            tabIndex={-1}
            aria-hidden
            className="neo-cta w-full rounded-xl px-3 py-2.5 text-sm font-semibold"
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      '6px 6px 14px #c5cedc, -3px -3px 10px #ffffff',
                      '8px 8px 20px #c5cedc, -2px -2px 8px #ffffff',
                      '6px 6px 14px #c5cedc, -3px -3px 10px #ffffff',
                    ],
                  }
            }
            transition={
              reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            {t('landing.pos.charge')}
          </motion.button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-black/5 px-4 py-2.5 text-xs neo-muted text-[#5a6578]">
        <motion.span
          className="inline-block size-2 rounded-full bg-[#12b886]"
          animate={reduceMotion ? undefined : { opacity: [1, 0.45, 1], scale: [1, 1.15, 1] }}
          transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity }}
          aria-hidden
        />
        {t('landing.hero.syncOnline')}
      </div>
    </div>
  );
}
