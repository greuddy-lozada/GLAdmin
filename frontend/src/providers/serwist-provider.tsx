'use client';

import { useEffect, type ReactNode } from 'react';
import { SerwistProvider } from '@serwist/turbopack/react';

/**
 * Serwist in `next dev` CacheFirst-caches Turbopack chunks. After HMR those
 * hashes disappear and the page dies with "module factory is not available".
 * Production keeps the PWA worker; development unregisters it.
 */
export function SerwistRoot({ children }: { children: ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production';

  useEffect(() => {
    if (isProd || !('serviceWorker' in navigator)) return;

    void (async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    })();
  }, [isProd]);

  if (!isProd) {
    return children;
  }

  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}
