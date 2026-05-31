'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { StripedBackground } from '@/components/ui/striped-background';
import LoginForm from '@/features/auth/components/login-form';
import { X, LogIn, TrendingUp, Globe, ShieldCheck, Warehouse } from 'lucide-react';

const features = [
  { icon: TrendingUp, text: 'Multi-moneda VED / USD' },
  { icon: Globe, text: 'Tasas BCV en tiempo real' },
  { icon: Warehouse, text: 'Inventario y lotes' },
  { icon: ShieldCheck, text: 'Retenciones IVA e ISLR' },
];

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [checkingBootstrap, setCheckingBootstrap] = useState(true);

  useEffect(() => {
    const checkBootstrap = async () => {
      try {
        const res = await fetch('/api/bootstrap/status');
        const json = await res.json();
        if (json.data?.requiresSetup) {
          router.replace('/setup');
          return;
        }
      } catch {
        // If bootstrap endpoint fails, proceed to login normally
      }
      setCheckingBootstrap(false);
    };
    checkBootstrap();
  }, [router]);

  useEffect(() => {
    if (checkingBootstrap) return;
    if (!isLoading && isAuthenticated) {
      const savedOrgId = localStorage.getItem('currentOrgId');
      router.replace(savedOrgId ? '/dashboard' : '/org-picker');
    }
  }, [isLoading, isAuthenticated, checkingBootstrap, router]);

  if (isLoading || checkingBootstrap) return null;

  return (
    <div className="relative h-full overflow-hidden">
      <motion.div
        className="relative h-full"
        animate={{ x: panelOpen ? 500 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <StripedBackground />

        <div className="relative z-10 flex h-full">
          <div className="flex flex-1 flex-col justify-center px-12 md:px-24 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-white leading-[1.1] tracking-tight">
                GLAdmin
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/80 leading-relaxed max-w-lg font-light">
                Control total de tu negocio con gestión multi-moneda, inventario,
                órdenes de compra y retenciones fiscales en un solo lugar.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="mt-10 grid gap-3"
            >
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{f.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
              className="mt-10"
            >
              <Button
                size="icon"
                onClick={() => setPanelOpen(true)}
                className="h-14 w-14 rounded-full shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-shadow"
              >
                <LogIn className="h-6 w-6" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {panelOpen && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-50"
          onClick={() => setPanelOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPanelOpen(false); }}
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        />
      )}

      <motion.div
        initial={false}
        animate={{ x: panelOpen ? 0 : -500 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 h-full z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 500 }} className="h-full bg-card text-foreground shadow-xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <span className="text-lg font-heading font-bold text-foreground">GLAdmin</span>
            <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center p-4 h-[calc(100%-4.5rem)]">
            <div className="w-full max-w-sm bg-background rounded-xl p-5 space-y-5">
              <LoginForm />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
