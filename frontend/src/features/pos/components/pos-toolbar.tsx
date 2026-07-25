'use client';

import { Undo2, Pause, Timer, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';

interface PosToolbarProps {
  exchangeRate: number;
  onPark: () => void;
  onUndo: () => void;
  canUndo: boolean;
  hasItems: boolean;
  onOpenParked: () => void;
  onOpenHistory: () => void;
  parkedCount: number;
}

export function PosToolbar({ exchangeRate, onPark, onUndo, canUndo, hasItems, onOpenParked, onOpenHistory, parkedCount }: PosToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onPark} disabled={!hasItems} title={t('pos.park.button')}>
          <Pause className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} title={t('pos.toolbar.undo')}>
          <Undo2 className="h-5 w-5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={onOpenParked} className="relative" title={t('pos.park.title')}>
          <Timer className="h-5 w-5" />
          {parkedCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] leading-none">
              {parkedCount}
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={onOpenHistory} title={t('pos.sales.title')}>
          <Receipt className="h-5 w-5" />
        </Button>
      </div>
      {exchangeRate > 0 && (
        <span className="text-xs text-muted-foreground">Tasa: {exchangeRate.toFixed(2)} Bs./USD</span>
      )}
    </div>
  );
}
