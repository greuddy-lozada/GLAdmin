'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

/** Soft Tech option A: light-only skin for dashboard + auth. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" forcedTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
