'use client';

import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n';

interface SlideFormProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  panel: ReactNode;
  panelWidth?: number;
  loading?: boolean;
}

export function SlideForm({ open, title, onClose, children, panel, panelWidth = 420, loading }: SlideFormProps) {
  const { t } = useI18n();

  useEffect(() => {
    const applyOffset = () => {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      document.documentElement.style.setProperty(
        '--panel-offset',
        open && !mobile ? `${panelWidth}px` : '0px',
      );
    };
    applyOffset();
    const mq = window.matchMedia('(max-width: 767px)');
    mq.addEventListener('change', applyOffset);
    return () => {
      mq.removeEventListener('change', applyOffset);
      document.documentElement.style.setProperty('--panel-offset', '0px');
    };
  }, [open, panelWidth]);

  return (
    <div className="flex-1 h-full min-h-0">
      {children}

      <AnimatePresence>
        {open && (
          <motion.div
            key="slide-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onClose();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="slide-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 360, mass: 0.9 }}
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-0 bg-card text-foreground shadow-none md:w-auto"
            data-slot="slide-form-panel"
            style={{ ['--panel-w' as string]: `${panelWidth}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full w-full flex-col md:w-[var(--panel-w)]">
              <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-6 md:py-5">
                <h2 className="truncate pr-2 text-lg font-semibold">{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('common.close')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-[calc(100%-4.5rem)] overflow-y-auto p-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5 rounded-xl bg-background p-4 md:p-5">{panel}</div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
