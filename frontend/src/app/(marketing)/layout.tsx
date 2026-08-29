import type { Metadata } from 'next';
import { MarketingShell } from '@/features/landing/components/marketing-shell';

export const metadata: Metadata = {
  title: 'Cuadra — POS offline para PyMEs',
  description:
    'Punto de venta offline-first con multi-moneda VES/USD y sync automático. Hecho para PyMEs venezolanas.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
