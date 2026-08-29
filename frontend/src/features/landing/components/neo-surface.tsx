'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type NeoSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'raised' | 'inset';
  pressable?: boolean;
};

export function NeoSurface({
  variant = 'raised',
  pressable = false,
  className,
  children,
  ...props
}: NeoSurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variant === 'raised' ? 'neo-raised' : 'neo-inset',
        pressable && 'neo-press cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
