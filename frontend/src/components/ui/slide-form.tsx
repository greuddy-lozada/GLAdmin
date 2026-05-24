'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
      <motion.div
        initial={false}
        animate={{ width: open ? panelWidth : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="overflow-hidden shrink-0 rounded-l-xl"
      >
        <div style={{ width: panelWidth }} className="h-full bg-card text-foreground">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 overflow-y-auto h-[calc(100%-4.5rem)]">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="bg-background rounded-xl p-5 space-y-5">
                {panel}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
