'use client';

import { Undo2, Pause, Timer, Receipt, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n';
import ActiveSessionBadge from '@/features/cash-register/components/active-session-badge';

interface PosToolbarProps {
  exchangeRate: number;
  onPark: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hasItems: boolean;
  onOpenParked: () => void;
  onOpenHistory: () => void;
  parkedCount: number;
  onCloseRegister: () => void;
  activeSession: boolean;
}

export function PosToolbar({ exchangeRate, onPark, onUndo, canUndo, hasItems, onOpenParked, onOpenHistory, parkedCount, onCloseRegister, activeSession }: PosToolbarProps) {
  const { t } = useI18n();

  return (
    <TooltipProvider>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onPark} disabled={!hasItems}>
              <Pause className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('pos.park.button')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
              <Undo2 className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('pos.toolbar.undo')}</TooltipContent>
        </Tooltip>
        <div className="w-px h-5 bg-border mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenParked} className="relative overflow-visible">
              <Timer className="h-8 w-8" />
              {parkedCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 z-10 h-4 min-w-4 px-1 text-[10px] leading-none">
                  {parkedCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('pos.park.title')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenHistory}>
              <Receipt className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('pos.sales.title')}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <ActiveSessionBadge />
        {activeSession && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onCloseRegister} className="h-8 w-8">
                <XCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('registerSession.cerrar')}</TooltipContent>
          </Tooltip>
        )}
        {exchangeRate > 0 && (
          <span className="text-xs text-muted-foreground">Tasa: {exchangeRate.toFixed(2)} Bs./USD</span>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
