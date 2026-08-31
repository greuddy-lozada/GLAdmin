'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '@/providers/auth-provider';
import { useI18n } from '@/i18n';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Languages, LogOut } from 'lucide-react';
import { usePosNavLock } from '@/lib/sync/hooks/use-pos-nav-lock';

export function UserNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const { lockNav } = usePosNavLock();
  const lockMessage = t('sync.posNavLocked');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push('/login');
  };

  const userInitial = user?.firstName?.charAt(0)?.toUpperCase();

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        className="neo-raised relative h-9 w-9 rounded-full"
        onClick={() => setOpen(!open)}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#3e93c1] text-white text-xs">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border-0 neo-raised bg-[#e4e9f2] p-1 text-[#1a2332] shadow-none"
            data-slot="dropdown-menu-content"
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-[#5a6578]">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-[#c5cedc]/60" />
            <button
              type="button"
              onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-[#1a2332] transition-colors hover:bg-[#d8dee9]/60"
            >
              <Languages className="h-4 w-4 text-[#3e93c1]" />
              {locale === 'es' ? 'English' : 'Español'}
            </button>
            <div className="my-1 h-px bg-[#c5cedc]/60" />
            {lockNav ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex w-full cursor-not-allowed items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-destructive opacity-50">
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{lockMessage}</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-[#d8dee9]/60"
              >
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
