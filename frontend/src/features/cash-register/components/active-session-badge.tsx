'use client';

import { useMyActiveSession } from '@/features/cash-register/hooks/use-cash-register';
import { useI18n } from '@/i18n';
import { Banknote } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ActiveSessionBadge() {
  const { data: session } = useMyActiveSession();
  const { t, tp } = useI18n();

  if (!session) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
          <Banknote className="h-4 w-4" />
          <span className="hidden md:inline">{session.cashRegister?.name ?? tp('registerSession.aperturaActiva', { name: '' })}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tp('registerSession.aperturaActiva', { name: session.cashRegister?.name ?? '' })}</p>
        {session.initialCash > 0 && (
          <p className="text-xs">{t('registerSession.initialCash')}: Bs. {session.initialCash.toFixed(2)}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
